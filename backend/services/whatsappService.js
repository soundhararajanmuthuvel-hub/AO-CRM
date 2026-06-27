const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { execSync } = require('child_process');
const { WhatsAppSession, WhatsAppChat, WhatsAppMessage, ChatNote, SalesOrder, Contact } = require('../models');

// Socket.io instance reference
let ioInstance = null;

// Multi-tenant client pool
const clients = new Map();

// Helper to set socket.io
const setIO = (io) => {
  ioInstance = io;
};

// Helper to format number to whatsapp standard: 9876543210 -> 919876543210@c.us
const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned; // Returns clean numbers like 919876543210. Actual suffix '@c.us' is added dynamically or matched.
};

// Robust helper to locate system Google Chrome path on Windows/macOS/Linux
const getChromePath = () => {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
};

// Logger utility
const logInfo = (workspaceId, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [WhatsApp Service] [Workspace: ${workspaceId}] ${message}`);
};

const logError = (workspaceId, message, err = null) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [WhatsApp Service ERROR] [Workspace: ${workspaceId}] ${message}`, err || '');
};

// Sync historical chats on connection ready
const syncWorkspaceChats = async (workspaceId, client) => {
  try {
    logInfo(workspaceId, 'Starting historical chat sync...');
    const chats = await client.getChats();
    logInfo(workspaceId, `Found ${chats.length} active threads on device. Syncing all threads...`);

    // Purge existing chats and messages for this workspace to clear out demo data
    await WhatsAppMessage.destroy({ where: { workspaceId } });
    await WhatsAppChat.destroy({ where: { workspaceId } });

    for (const chat of chats) {
      const chatId = chat.id._serialized;
      const timestamp = chat.timestamp ? new Date(chat.timestamp * 1000) : new Date();
      
      let profilePicUrl = null;
      try {
        if (!client.isMock) {
          profilePicUrl = await client.getProfilePicUrl(chatId);
        }
      } catch (picErr) {
        // Ignored fallback
      }

      const phoneNumber = chat.id.user || chatId.split('@')[0];
      const isGroup = chat.isGroup || chatId.endsWith('@g.us');

      const dbChat = await WhatsAppChat.create({
        workspaceId,
        chatId,
        name: chat.name || phoneNumber,
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.lastMessage ? chat.lastMessage.body : '',
        lastMessageTime: timestamp,
        salesStatus: 'General',
        customerStatus: 'New',
        phoneNumber,
        profilePicUrl,
        isGroup
      });

      // Fetch first 10 messages for the chat
      try {
        const messages = await chat.fetchMessages({ limit: 10 });
        for (const msg of messages) {
          const msgId = msg.id.id;
          const msgTimestamp = new Date(msg.timestamp * 1000);

          let aiTags = { leadIntent: 'None', orderIntent: 'None', sentiment: 'None', suggestedReply: null };
          if (!msg.fromMe && msg.body) {
            try {
              const aiService = require('./aiService');
              aiTags = await aiService.analyzeMessage(msg.body, workspaceId);
            } catch (err) {}
          }

          await WhatsAppMessage.create({
            workspaceId,
            chatId,
            messageId: msgId,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            timestamp: msgTimestamp,
            fromMe: msg.fromMe,
            type: msg.type,
            hasMedia: msg.hasMedia,
            isUnread: !msg.fromMe,
            leadIntent: aiTags.leadIntent,
            orderIntent: aiTags.orderIntent,
            sentiment: aiTags.sentiment,
            suggestedReply: aiTags.suggestedReply
          });
        }
      } catch (msgErr) {
        logError(workspaceId, `Error syncing messages for chat ${chatId}:`, msgErr);
      }
    }

    if (ioInstance) {
      ioInstance.to(workspaceId).emit('chats_synced', { count: chats.length });
    }

    logInfo(workspaceId, `Historical chat sync completed successfully! Synced ${chats.length} chats.`);
  } catch (err) {
    logError(workspaceId, 'Error during historical chat sync:', err);
  }
};

// Sync incoming/outgoing real-time messages
const syncIncomingMessage = async (workspaceId, client, msg) => {
  try {
    const chatId = msg.fromMe ? msg.to : msg.from;
    const body = msg.body;
    const timestamp = new Date(msg.timestamp * 1000);
    const fromMe = msg.fromMe;

    if (!body) return; // Skip empty media messages with no captions

    let chatName = chatId.split('@')[0];
    try {
      const wChat = await msg.getChat();
      if (wChat) {
        chatName = wChat.name || chatName;
      }
    } catch (e) {}

    const phoneNumber = chatId.split('@')[0];
    const isGroup = chatId.endsWith('@g.us');
    let profilePicUrl = null;
    try {
      if (!client.isMock) {
        profilePicUrl = await client.getProfilePicUrl(chatId);
      }
    } catch (picErr) {
      // Ignored fallback
    }

    // Find or create WhatsAppChat
    let [dbChat, created] = await WhatsAppChat.findOrCreate({
      where: { workspaceId, chatId },
      defaults: {
        name: chatName,
        unreadCount: fromMe ? 0 : 1,
        lastMessage: body,
        lastMessageTime: timestamp,
        salesStatus: 'General',
        customerStatus: 'New',
        phoneNumber,
        profilePicUrl,
        isGroup
      }
    });

    if (!created) {
      dbChat.lastMessage = body;
      dbChat.lastMessageTime = timestamp;
      if (!fromMe) {
        dbChat.unreadCount += 1;
      }
      await dbChat.save();
    }

    // AI Analysis & Auto reply matching
    let aiTags = { leadIntent: 'None', orderIntent: 'None', sentiment: 'None', suggestedReply: null };
    if (!fromMe) {
      try {
        const aiService = require('./aiService');
        aiTags = await aiService.analyzeMessage(body, workspaceId);

        // Auto reply keyword trigger
        const autoReply = await aiService.checkAutoReply(body, workspaceId);
        if (autoReply) {
          logInfo(workspaceId, `Auto-reply rule matched: "${body}" -> "${autoReply.response}"`);
          if (autoReply.mediaUrl) {
            const localPath = path.join(__dirname, '..', autoReply.mediaUrl);
            if (fs.existsSync(localPath)) {
              const { MessageMedia } = require('whatsapp-web.js');
              const media = MessageMedia.fromFilePath(localPath);
              await client.sendMessage(chatId, media, { caption: autoReply.response });
            } else {
              await client.sendMessage(chatId, autoReply.response);
            }
          } else {
            await client.sendMessage(chatId, autoReply.response);
          }
        }

        // Order Draft extraction
        const orderData = aiService.parseHeuristicOrder(body);
        if (orderData) {
          logInfo(workspaceId, `Draft order detected: ${orderData.quantity} units of ${orderData.productName}`);
          
          const cleanPhone = chatId.replace(/[^\d]/g, '');
          const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
          const customerName = contact ? contact.name : chatName;
          const city = contact ? contact.city : 'Unknown';

          // Resolve real product details
          const matchedProd = await aiService.resolveProductInDB(orderData.productName, workspaceId);
          const finalProdName = matchedProd ? matchedProd.name : orderData.productName;
          const finalPrice = matchedProd ? parseFloat(matchedProd.offerPrice || matchedProd.price) : orderData.price;
          const finalUnit = matchedProd ? matchedProd.unit : orderData.unit;
          const totalValue = orderData.quantity * finalPrice;
          
          const createdOrder = await SalesOrder.create({
            workspaceId,
            chatId,
            customerName,
            phone: cleanPhone,
            totalValue,
            status: 'Draft', // Set default status as 'Draft'
            city,
            items: JSON.stringify([{
              productName: finalProdName,
              quantity: orderData.quantity,
              price: finalPrice,
              unit: finalUnit
            }]),
            timeline: JSON.stringify([{
              status: 'Draft',
              timestamp: new Date(),
              user: 'AI Sales Assistant'
            }])
          });

          if (ioInstance) {
            ioInstance.to(workspaceId).emit('order_detected', { chatId, orderData: { productName: finalProdName, quantity: orderData.quantity, price: finalPrice, unit: finalUnit } });
          }

          try {
            const webhookService = require('./webhookService');
            webhookService.trigger(workspaceId, 'order.created', createdOrder.toJSON());
          } catch (whErr) {
            logError(workspaceId, 'Error triggering order.created webhook (AI):', whErr);
          }
        }
      } catch (aiErr) {
        logError(workspaceId, 'Error in AI/auto-reply sync:', aiErr);
      }
    }

    // Save message record
    const dbMsg = await WhatsAppMessage.create({
      workspaceId,
      chatId,
      messageId: msg.id.id,
      from: msg.from,
      to: msg.to,
      body,
      timestamp,
      fromMe,
      type: msg.type,
      hasMedia: msg.hasMedia,
      isUnread: !fromMe,
      leadIntent: aiTags.leadIntent,
      orderIntent: aiTags.orderIntent,
      sentiment: aiTags.sentiment,
      suggestedReply: aiTags.suggestedReply
    });

    if (ioInstance) {
      ioInstance.to(workspaceId).emit('new_chat_message', {
        chat: dbChat,
        message: dbMsg
      });
    }

    // Trigger webhook event
    try {
      const webhookService = require('./webhookService');
      const webhookEvent = fromMe ? 'message.sent' : 'message.received';
      webhookService.trigger(workspaceId, webhookEvent, dbMsg.toJSON());
    } catch (whErr) {
      logError(workspaceId, 'Error triggering message webhook:', whErr);
    }

  } catch (err) {
    logError(workspaceId, 'Error syncing incoming message:', err);
  }
};

// Helper to clean local session folders and terminate locked chrome processes
const cleanSessionFolder = (workspaceId) => {
  logInfo(workspaceId, `Attempting to clean session and release resources...`);
  
  // 1. Terminate any running chrome instances using this session folder
  try {
    let cmd = '';
    if (process.platform === 'win32') {
      cmd = `powershell -Command "Get-CimInstance Win32_Process -Filter 'Name = ''chrome.exe''' | Where-Object { $_.CommandLine -like '*${workspaceId}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`;
    } else {
      cmd = `pgrep -f "${workspaceId}" | xargs kill -9`;
    }
    execSync(cmd, { stdio: 'ignore' });
    logInfo(workspaceId, `Targeted Chrome processes terminated.`);
  } catch (procErr) {
    // Ignore errors if no process is found
  }

  // 2. Identify folders to clean
  const sessionDir = path.join(__dirname, '..', 'sessions');
  const sessionPath = path.join(sessionDir, `session-${workspaceId}`);
  const authPathDefault = path.join(__dirname, '..', '.wwebjs_auth');
  const cachePathDefault = path.join(__dirname, '..', '.wwebjs_cache');
  const cwdAuthPath = path.join(process.cwd(), '.wwebjs_auth');
  const cwdCachePath = path.join(process.cwd(), '.wwebjs_cache');
  
  const foldersToClean = [
    sessionPath,
    path.join(sessionDir, '.wwebjs_auth', `session-${workspaceId}`),
    path.join(sessionDir, '.wwebjs_cache'),
    authPathDefault,
    cachePathDefault,
    cwdAuthPath,
    cwdCachePath
  ];
  
  for (const folder of foldersToClean) {
    if (fs.existsSync(folder)) {
      try {
        logInfo(workspaceId, `Cleaning up session folder: ${folder}`);
        fs.rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch (e) {
        logError(workspaceId, `Failed to delete folder ${folder}: ${e.message}`);
      }
    }
  }

  const mockSessionPath = path.join(sessionDir, `mock-session-${workspaceId}.json`);
  if (fs.existsSync(mockSessionPath)) {
    try {
      logInfo(workspaceId, `Cleaning up mock session file: ${mockSessionPath}`);
      fs.unlinkSync(mockSessionPath);
    } catch (e) {
      logError(workspaceId, `Failed to delete mock session: ${e.message}`);
    }
  }
};

// Helper to check if a saved session exists on disk
const hasSavedSession = (workspaceId) => {
  if (process.env.MOCK_WHATSAPP === 'true') {
    const mockSessionPath = path.join(__dirname, '..', 'sessions', `mock-session-${workspaceId}.json`);
    return fs.existsSync(mockSessionPath);
  } else {
    const sessionDir = path.join(__dirname, '..', 'sessions');
    const sessionPath = path.join(sessionDir, `session-${workspaceId}`);
    return fs.existsSync(sessionPath) && fs.existsSync(path.join(sessionPath, 'Default'));
  }
};

// Helper to create mock clients if simulator is enabled
const createMockClient = (workspaceId) => {
  logInfo(workspaceId, 'Initializing client in SIMULATOR Mode...');
  
  const mockClient = {
    isMock: true,
    isReady: false,
    info: { pushname: 'Mock Workspace Owner', wid: { user: '919876543210' } },
    initialize: async () => {
      logInfo(workspaceId, 'Mock connection initializing...');
      
      await WhatsAppSession.update(
        { status: 'Initializing', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Initializing', qrCode: null });
      }

      // Check if a saved session exists
      const mockSessionPath = path.join(__dirname, '..', 'sessions', `mock-session-${workspaceId}.json`);
      if (fs.existsSync(mockSessionPath)) {
        logInfo(workspaceId, 'Existing mock session file detected. Restoring session...');
        setTimeout(async () => {
          mockClient.isReady = true;
          await WhatsAppSession.update(
            { status: 'READY', qrCode: null },
            { where: { workspaceId } }
          );
          logInfo(workspaceId, 'Authenticated (Restored)');
          logInfo(workspaceId, 'WhatsApp Ready (Restored)');
          if (ioInstance) {
            ioInstance.to(workspaceId).emit('status_change', { status: 'READY', qrCode: null });
          }
        }, 1500);
        return;
      }

      // Generate scannable mock QR code
      setTimeout(async () => {
        try {
          const qrDataURL = await QRCode.toDataURL(`https://cusmancrm.com/mock-link/${workspaceId}`);
          await WhatsAppSession.update(
            { status: 'QR Ready', qrCode: qrDataURL },
            { where: { workspaceId } }
          );
          logInfo(workspaceId, 'QR Generated');
          if (ioInstance) {
            ioInstance.to(workspaceId).emit('status_change', { status: 'QR Ready', qrCode: qrDataURL });
          }

          // Simulate scanning -> Authenticating after 4 seconds
          setTimeout(async () => {
            logInfo(workspaceId, 'QR scanned. Transitioning to Authenticating...');
            await WhatsAppSession.update(
              { status: 'Authenticating', qrCode: null },
              { where: { workspaceId } }
            );
            if (ioInstance) {
              ioInstance.to(workspaceId).emit('status_change', { status: 'Authenticating', qrCode: null });
            }

            // Transition to READY after 3 seconds
            setTimeout(async () => {
              mockClient.isReady = true;

              // Save a mock session file on disk to simulate LocalAuth file persistence
              try {
                const sessionDir = path.dirname(mockSessionPath);
                if (!fs.existsSync(sessionDir)) {
                  fs.mkdirSync(sessionDir, { recursive: true });
                }
                fs.writeFileSync(mockSessionPath, JSON.stringify({ authenticated: true, timestamp: new Date() }));
                logInfo(workspaceId, `Mock session file saved.`);
              } catch (e) {
                logError(workspaceId, `Failed to write mock session: ${e.message}`);
              }

              await WhatsAppSession.update(
                { status: 'READY', qrCode: null },
                { where: { workspaceId } }
              );
              logInfo(workspaceId, 'Authenticated');
              logInfo(workspaceId, 'WhatsApp Ready');
              if (ioInstance) {
                ioInstance.to(workspaceId).emit('status_change', { status: 'READY', qrCode: null });
              }
            }, 3000);

          }, 4000);

        } catch (qrErr) {
          logError(workspaceId, 'Failed to generate mock QR code data URL', qrErr);
        }
      }, 2000);
    },
    sendMessage: async (phone, content, options = {}) => {
      logInfo(workspaceId, `Message Sent`);
      return { id: { id: 'MOCK_MSG_' + Math.random().toString(36).substr(2, 9) } };
    },
    getNumberId: async (formattedJid) => {
      // Mock validation
      return { _serialized: formattedJid };
    },
    destroy: async () => {
      logInfo(workspaceId, 'Session disconnected');
      mockClient.isReady = false;

      const mockSessionPath = path.join(__dirname, '..', 'sessions', `mock-session-${workspaceId}.json`);
      if (fs.existsSync(mockSessionPath)) {
        try {
          fs.unlinkSync(mockSessionPath);
        } catch (e) {}
      }

      await WhatsAppSession.update(
        { status: 'Disconnected', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Disconnected', qrCode: null });
      }
    }
  };

  clients.set(workspaceId, mockClient);
  return mockClient;
};

// Main client initializer
const initClient = async (workspaceId, forceRestart = false) => {
  if (clients.has(workspaceId) && !forceRestart) {
    return clients.get(workspaceId);
  }

  // Handle force restart cleanup
  if (forceRestart) {
    logInfo(workspaceId, 'Force restarting active client instance and cleaning session...');
    if (clients.has(workspaceId)) {
      const oldClient = clients.get(workspaceId);
      try {
        await oldClient.destroy();
      } catch (destroyErr) {
        logError(workspaceId, 'Error destroying old client instance', destroyErr);
      }
      clients.delete(workspaceId);
    }
    cleanSessionFolder(workspaceId);
  }

  if (process.env.MOCK_WHATSAPP === 'true') {
    const mock = createMockClient(workspaceId);
    await mock.initialize();
    return mock;
  }

  try {
    const { Client, LocalAuth } = require('whatsapp-web.js');

    const sessionDir = path.join(__dirname, '..', 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    logInfo(workspaceId, 'Spawning real WhatsApp web client (Puppeteer)...');
    
    // Set status to Initializing in DB and sockets
    await WhatsAppSession.update(
      { status: 'Initializing', qrCode: null },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: 'Initializing', qrCode: null });
    }

    const chromePath = getChromePath();
    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--no-default-browser-check',
        '--window-size=1920,1080',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-audio-output'
      ]
    };
    if (chromePath) {
      logInfo(workspaceId, `Configuring Puppeteer to use Chrome path: ${chromePath}`);
      puppeteerOptions.executablePath = chromePath;
    } else {
      logInfo(workspaceId, 'No system Chrome installation found. Standard Puppeteer launch will be attempted.');
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: workspaceId,
        dataPath: sessionDir
      }),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      puppeteer: puppeteerOptions
    });

    client.on('qr', async (qr) => {
      try {
        logInfo(workspaceId, 'Raw QR code received. Encoding with qrcode...');
        const qrDataURL = await QRCode.toDataURL(qr);
        
        await WhatsAppSession.update(
          { status: 'QR Ready', qrCode: qrDataURL },
          { where: { workspaceId } }
        );
        logInfo(workspaceId, 'QR Generated');
        if (ioInstance) {
          ioInstance.to(workspaceId).emit('status_change', { status: 'QR Ready', qrCode: qrDataURL });
        }
      } catch (qrErr) {
        logError(workspaceId, 'Error generating QR code', qrErr);
      }
    });

    client.on('ready', async () => {
      logInfo(workspaceId, 'WhatsApp Ready');
      client.isReady = true;
      await WhatsAppSession.update(
        { status: 'READY', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'READY', qrCode: null });
      }
      // Trigger webhook event
      try {
        const webhookService = require('./webhookService');
        webhookService.trigger(workspaceId, 'whatsapp.connected', { status: 'Connected', timestamp: new Date() });
      } catch (whErr) {
        logError(workspaceId, 'Error triggering whatsapp.connected webhook:', whErr);
      }
      // Sync device chats dynamically in background
      syncWorkspaceChats(workspaceId, client);
    });

    client.on('message', async (msg) => {
      await syncIncomingMessage(workspaceId, client, msg);
    });

    client.on('message_create', async (msg) => {
      await syncIncomingMessage(workspaceId, client, msg);
    });

    client.on('authenticated', async () => {
      logInfo(workspaceId, 'Authenticated');
      await WhatsAppSession.update(
        { status: 'Authenticating', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Authenticating', qrCode: null });
      }
    });

    client.on('auth_failure', async (msg) => {
      logError(workspaceId, `Authentication failed: ${msg}. Invalidating session folder...`);
      
      cleanSessionFolder(workspaceId);
      
      await WhatsAppSession.update(
        { status: 'Disconnected', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Disconnected', qrCode: null });
      }
      try {
        const webhookService = require('./webhookService');
        webhookService.trigger(workspaceId, 'whatsapp.disconnected', { status: 'Disconnected', reason: msg, timestamp: new Date() });
      } catch (whErr) {
        logError(workspaceId, 'Error triggering whatsapp.disconnected webhook:', whErr);
      }
      
      // Auto reconnect/recreate cycle
      setTimeout(() => {
        logInfo(workspaceId, 'Session restored: Auto recreating clean session...');
        initClient(workspaceId, true);
      }, 2000);
    });

    client.on('disconnected', async (reason) => {
      logInfo(workspaceId, `Session disconnected. Reason: ${reason}`);
      client.isReady = false;
      
      cleanSessionFolder(workspaceId);

      await WhatsAppSession.update(
        { status: 'Reconnecting', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Reconnecting', qrCode: null });
      }
      try {
        const webhookService = require('./webhookService');
        webhookService.trigger(workspaceId, 'whatsapp.disconnected', { status: 'Disconnected', reason, timestamp: new Date() });
      } catch (whErr) {
        logError(workspaceId, 'Error triggering whatsapp.disconnected webhook:', whErr);
      }

      // Auto reconnect
      setTimeout(() => {
        logInfo(workspaceId, 'Session restored: Triggering auto reconnect sequence...');
        initClient(workspaceId, true);
      }, 3000);
    });

    clients.set(workspaceId, client);
    await client.initialize();
    return client;
  } catch (err) {
    logError(workspaceId, 'Puppeteer initialization failed. Invalidating session folder...', err);
    cleanSessionFolder(workspaceId);
    await WhatsAppSession.update(
      { status: 'Disconnected', qrCode: null },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: 'Disconnected', qrCode: null });
    }
    throw err;
  }
};

const getClient = (workspaceId) => {
  return clients.get(workspaceId);
};

const logoutClient = async (workspaceId) => {
  logInfo(workspaceId, 'Logging out device...');
  const client = clients.get(workspaceId);
  if (client) {
    try {
      if (client.isMock) {
        await client.destroy();
      } else {
        await client.logout();
        await client.destroy();
      }
    } catch (err) {
      logError(workspaceId, 'Error during logout', err);
    }
    clients.delete(workspaceId);
  }
  cleanSessionFolder(workspaceId); // Always clean session folder on logout/disconnect
  
  await WhatsAppSession.update(
    { status: 'Disconnected', qrCode: null },
    { where: { workspaceId } }
  );
  if (ioInstance) {
    ioInstance.to(workspaceId).emit('status_change', { status: 'Disconnected', qrCode: null });
  }
};

const sendWhatsAppMessage = async (workspaceId, phone, message, fileUrl = null, fileType = null) => {
  const client = await initClient(workspaceId);
  
  // 1. Verify WhatsApp connection before sending
  if (!client.isReady) {
    logError(workspaceId, `Message Failed: WhatsApp Not Connected`);
    throw new Error('WhatsApp Not Connected');
  }

  // 2. Validate phone number
  const rawNumber = phone.replace(/[^\d]/g, '');
  if (rawNumber.length < 10) {
    logError(workspaceId, `Message Failed: Invalid Number`);
    throw new Error('Invalid Number');
  }

  // 3. Convert numbers automatically: 9876543210 -> 919876543210@c.us
  const formattedNumber = formatPhone(phone);
  const finalJid = `${formattedNumber}@c.us`;

  logInfo(workspaceId, `Sending message to ${finalJid}...`);

  try {
    if (fileUrl) {
      const localPath = path.join(__dirname, '..', fileUrl);
      if (fs.existsSync(localPath)) {
        if (client.isMock) {
          logInfo(workspaceId, `Message Sent`);
          return await client.sendMessage(finalJid, `[Attachment: ${fileUrl}] ` + message);
        } else {
          try {
            const { MessageMedia } = require('whatsapp-web.js');
            const mediaData = fs.readFileSync(localPath);
            const base64Media = mediaData.toString('base64');
            const media = new MessageMedia(fileType, base64Media, path.basename(localPath));
            const sendRes = await client.sendMessage(finalJid, media, { caption: message });
            logInfo(workspaceId, `Message Sent`);
            return sendRes;
          } catch (mediaErr) {
            logError(workspaceId, 'Failed to attach media. Sending text fallback.', mediaErr);
            const sendRes = await client.sendMessage(finalJid, message);
            logInfo(workspaceId, `Message Sent`);
            return sendRes;
          }
        }
      }
    }

    const sendRes = await client.sendMessage(finalJid, message);
    logInfo(workspaceId, `Message Sent`);
    return sendRes;
  } catch (err) {
    logError(workspaceId, `Message Failed: ${err.message}`);
    throw err;
  }
};

module.exports = {
  setIO,
  initClient,
  getClient,
  logoutClient,
  sendWhatsAppMessage,
  hasSavedSession
};
