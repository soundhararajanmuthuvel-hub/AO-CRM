const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { execSync } = require('child_process');
const { WhatsAppSession, WhatsAppChat, WhatsAppMessage, ChatNote, SalesOrder, Contact } = require('../models');

// Socket.io instance reference
let ioInstance = null;

// Multi-tenant client pool
const clients = new Map();
const lastSendTimes = new Map();

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
    // Limit to the most recent 15 threads to prevent thread lock/timeouts
    const recentChats = chats.slice(0, 15);
    const totalToSync = recentChats.length;
    logInfo(workspaceId, `Found ${chats.length} active threads on device. Syncing top ${totalToSync} recent threads...`);

    // Purge existing chats and messages for this workspace to clear out demo data
    await WhatsAppMessage.destroy({ where: { workspaceId } });
    await WhatsAppChat.destroy({ where: { workspaceId } });

    await WhatsAppSession.update(
      { status: `Syncing history (0/${totalToSync} contacts)` },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: `Syncing history (0/${totalToSync} contacts)`, qrCode: null });
    }

    const contactsSynced = [];

    for (let i = 0; i < recentChats.length; i++) {
      const chat = recentChats[i];
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

      let contact = null;
      if (!isGroup) {
        try {
          const { Contact, AuditLog } = require('../models');
          contact = await Contact.findOne({ where: { workspaceId, phone: phoneNumber } });
          if (!contact) {
            contact = await Contact.create({
              workspaceId,
              phone: phoneNumber,
              name: chat.name || phoneNumber,
              leadSource: 'WhatsApp',
              isSynced: true,
              lastInboundMessageTime: timestamp
            });
            await AuditLog.create({
              workspaceId,
              action: 'CONTACT_AUTO_SYNC',
              details: { contactId: contact.id, phone: contact.phone, name: contact.name, source: 'Historical Sync' }
            });
          } else {
            if (!contact.name || contact.name === contact.phone) {
              contact.name = chat.name || contact.name;
            }
            contact.isSynced = true;
            await contact.save();
          }
        } catch (cErr) {
          logError(workspaceId, 'Contact auto-sync error in historical download:', cErr);
        }
      }

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
        isGroup,
        contactId: contact ? contact.id : null
      });

      let msgSyncedForThisContact = 0;
      // Fetch first 5 messages for the chat (down from 10)
      try {
        const messages = await chat.fetchMessages({ limit: 5 });
        msgSyncedForThisContact = messages.length;
        for (const msg of messages) {
          const msgId = msg.id.id;
          const msgTimestamp = new Date(msg.timestamp * 1000);

          // Skip making API OpenAI calls during historical sync to boost speed and avoid rate limits
          const aiTags = { leadIntent: 'None', orderIntent: 'None', sentiment: 'None', suggestedReply: null };

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
            suggestedReply: aiTags.suggestedReply,
            contactId: contact ? contact.id : null
          });
        }
      } catch (msgErr) {
        logError(workspaceId, `Error syncing messages for chat ${chatId}:`, msgErr);
      }

      contactsSynced.push({
        phone: phoneNumber,
        name: chat.name || phoneNumber,
        messagesCount: msgSyncedForThisContact
      });

      const syncedCount = i + 1;
      await WhatsAppSession.update(
        { status: `Syncing history (${syncedCount}/${totalToSync} contacts)` },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: `Syncing history (${syncedCount}/${totalToSync} contacts)`, qrCode: null });
      }
    }

    const lastSyncTime = new Date().toISOString();
    const statsObj = {
      lastSyncTime,
      syncedChats: totalToSync,
      contactsSynced,
      status: 'Success'
    };

    await WhatsAppSession.update(
      { 
        status: 'Synced',
        syncStats: JSON.stringify(statsObj)
      },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: 'Synced', qrCode: null, syncStats: JSON.stringify(statsObj) });
      ioInstance.to(workspaceId).emit('chats_synced', { count: totalToSync });
    }

    logInfo(workspaceId, `Historical chat sync completed successfully! Synced ${totalToSync} chats.`);

    // Transition to Live connection after 1.5 seconds
    setTimeout(async () => {
      await WhatsAppSession.update(
        { status: 'Live' },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Live', qrCode: null });
      }
    }, 1500);

  } catch (err) {
    logError(workspaceId, 'Error during historical chat sync:', err);
    await WhatsAppSession.update(
      { status: 'Error', lastError: err.message },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: 'Error', qrCode: null, lastError: err.message });
    }
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

    let contact = null;
    if (!isGroup) {
      try {
        const { Contact, AuditLog } = require('../models');
        contact = await Contact.findOne({ where: { workspaceId, phone: phoneNumber } });
        if (!contact) {
          contact = await Contact.create({
            workspaceId,
            phone: phoneNumber,
            name: chatName || phoneNumber,
            leadSource: 'WhatsApp',
            isSynced: true,
            lastInboundMessageTime: fromMe ? null : new Date()
          });
          await AuditLog.create({
            workspaceId,
            action: 'CONTACT_AUTO_SYNC',
            details: { contactId: contact.id, phone: contact.phone, name: contact.name, source: 'Webhook Inbound' }
          });
        } else {
          if (!contact.name || contact.name === contact.phone) {
            contact.name = chatName || contact.name;
          }
          if (!fromMe) {
            contact.lastInboundMessageTime = new Date();
          }
          contact.isSynced = true;
          await contact.save();
        }
      } catch (cErr) {
        logError(workspaceId, 'Contact auto-sync error in inbound webhook:', cErr);
      }
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
        isGroup,
        contactId: contact ? contact.id : null
      }
    });

    if (dbChat && !dbChat.contactId && contact) {
      dbChat.contactId = contact.id;
      await dbChat.save();
    }

    if (!created) {
      dbChat.lastMessage = body;
      dbChat.lastMessageTime = timestamp;
      if (!fromMe) {
        dbChat.unreadCount += 1;
      }
      await dbChat.save();
    }

    // Sync contact inbound engagement times and opt-out statuses
    if (!fromMe) {
      try {
        const { Contact, AuditLog } = require('../models');
        const cleanPhone = chatId.replace(/[^\d]/g, '');
        const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
        
        if (contact) {
          contact.lastInboundMessageTime = new Date();
          
          const textClean = body.trim().toUpperCase();
          if (textClean === 'STOP' || textClean === 'UNSUBSCRIBE') {
            contact.isOptedOut = true;
            const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];
            if (!tags.includes('Opt-Out')) tags.push('Opt-Out');
            contact.tags = tags.filter(Boolean).join(', ');
            await contact.save();

            await AuditLog.create({
              workspaceId,
              action: 'CONTACT_OPT_OUT',
              details: { contactId: contact.id, phone: contact.phone, triggeredByMessage: body }
            });

            await client.sendMessage(chatId, 'You have been unsubscribed from all broadcast communications. Reply START to opt back in.');
            return; // Exit early: do not process AI auto replies for opted-out contacts
          } else if (textClean === 'START' || textClean === 'SUBSCRIBE') {
            if (contact.isOptedOut) {
              contact.isOptedOut = false;
              const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()).filter(t => t !== 'Opt-Out') : [];
              contact.tags = tags.join(', ');
              await contact.save();

              await AuditLog.create({
                workspaceId,
                action: 'CONTACT_OPT_IN',
                details: { contactId: contact.id, phone: contact.phone, triggeredByMessage: body }
              });

              await client.sendMessage(chatId, 'Welcome back! You have successfully resubscribed to our communications.');
              return;
            }
          } else {
            await contact.save();
          }
        }
      } catch (err) {
        logError(workspaceId, 'Error during contact opt-out or engagement sync:', err);
      }
    }

    // AI Analysis & Auto reply matching
    let aiTags = { leadIntent: 'None', orderIntent: 'None', sentiment: 'None', suggestedReply: null };
    if (!fromMe) {
      try {
        // Customer Advocacy Feedback Reply parser
        try {
          const lastOutgoing = await WhatsAppMessage.findOne({
            where: {
              workspaceId,
              chatId,
              fromMe: true
            },
            order: [['timestamp', 'DESC']]
          });

          if (lastOutgoing && lastOutgoing.body && lastOutgoing.body.includes('rating from 1 to 5 stars!')) {
            const { handleAdvocacyReply } = require('./advocacyService');
            await handleAdvocacyReply(workspaceId, client, chatId, body);
          }
        } catch (advErr) {
          logError(workspaceId, 'Error processing customer advocacy feedback response:', advErr);
        }

        const aiService = require('./aiService');
        aiTags = await aiService.analyzeMessage(body, workspaceId);

        let hasReplied = false;

        // Auto reply keyword trigger
        const autoReply = await aiService.checkAutoReply(body, workspaceId);
        if (autoReply) {
          hasReplied = true;
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

        // Check for specific pattern matching e.g. "ORDER ABC1KG"
        const orderMatch = body.match(/ORDER\s+([A-Z0-9_-]+)/i);
        let patternMatched = false;
        if (orderMatch && !hasReplied) {
          const skuCode = orderMatch[1].trim().toUpperCase();
          logInfo(workspaceId, `Pattern ORDER match detected for SKU: ${skuCode}`);
          const { Product, Task } = require('../models');
          const product = await Product.findOne({
            where: {
              workspaceId,
              [require('sequelize').Op.or]: [
                { sku: skuCode },
                { barcode: skuCode }
              ]
            }
          });

          if (product) {
            hasReplied = true;
            const cleanPhone = chatId.replace(/[^\d]/g, '');
            const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
            const customerName = contact ? contact.name : chatName;
            const city = contact ? contact.city : 'Unknown';

            const priceVal = parseFloat(product.offerPrice || product.price);
            const totalValue = priceVal * 1;

            const createdOrder = await SalesOrder.create({
              workspaceId,
              chatId,
              customerName,
              phone: cleanPhone,
              totalValue,
              status: 'Draft',
              city,
              items: JSON.stringify([{
                productName: product.name,
                quantity: 1,
                price: priceVal,
                unit: product.unit || 'pcs'
              }]),
              timeline: JSON.stringify([{
                status: 'Draft',
                timestamp: new Date(),
                user: 'ORDER SKU Pattern Processor'
              }])
            });

            // Log task notification for assigned rep
            const assignedRep = dbChat.assignedTo;
            if (assignedRep) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              await Task.create({
                workspaceId,
                contactId: contact ? contact.id : null,
                title: `Review WhatsApp Order: ${product.name}`,
                description: `Customer triggered automatic order by replying "ORDER ${skuCode}". Draft order #${createdOrder.id} has been created.`,
                dueDate: tomorrow,
                status: 'Pending',
                reminderType: 'CRM Notification',
                assignedTo: assignedRep
              });
            }

            if (ioInstance) {
              ioInstance.to(workspaceId).emit('order_detected', {
                chatId,
                orderData: {
                  productName: product.name,
                  quantity: 1,
                  price: priceVal,
                  unit: product.unit || 'pcs'
                }
              });
            }

            try {
              const webhookService = require('./webhookService');
              webhookService.trigger(workspaceId, 'order.created', createdOrder.toJSON());
            } catch (whErr) {
              logError(workspaceId, 'Error triggering order.created webhook (Pattern):', whErr);
            }

            // Send confirmation message to customer
            const confirmationMsg = `✅ *Order Draft Received!*\n\nWe have created a draft order for *1x ${product.name}* (₹${priceVal.toFixed(2)}).\n\nOur representative will contact you shortly to finalize details. Thank you!`;
            await client.sendMessage(chatId, confirmationMsg);
            patternMatched = true;
          }
        }

        // Order Draft extraction
        if (!patternMatched && !hasReplied) {
          const orderData = aiService.parseHeuristicOrder(body);
          if (orderData) {
            hasReplied = true;
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
        }

        // AI LLM Auto-Reply Evaluator Trigger
        if (!hasReplied) {
          const wsSettings = await Workspace.findByPk(workspaceId);
          const isAiEnabled = wsSettings ? wsSettings.aiAutoReplyEnabled : true;
          
          if (isAiEnabled) {
            try {
              const cleanPhone = chatId.replace(/[^\d]/g, '');
              const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
              const isVip = contact && contact.tags && contact.tags.split(',').map(t => t.trim().toUpperCase()).includes('VIP');

              const { generateAiAutoReply } = require('./claudeService');
              const aiResponse = await generateAiAutoReply(workspaceId, chatId, contact || { name: chatName }, body);

              aiTags.suggestedReply = aiResponse.reply;

              const threshold = wsSettings ? wsSettings.aiConfidenceThreshold : 0.7;
              const isLowConfidence = aiResponse.confidence < threshold;
              const shouldEscalate = isVip || aiResponse.escalate || isLowConfidence;

              const { AiAutoReplyLog } = require('../models');

              if (!shouldEscalate) {
                logInfo(workspaceId, `AI auto-sending response to ${chatId} (confidence: ${aiResponse.confidence})`);
                const sendRes = await exports.sendWhatsAppMessage(workspaceId, cleanPhone, aiResponse.reply);
                const waMsgId = sendRes && sendRes.id ? sendRes.id.id : null;

                await AiAutoReplyLog.create({
                  workspaceId,
                  chatId,
                  messageId: waMsgId,
                  promptContext: `Claude Auto-Send Context: VIP=${isVip}, threshold=${threshold}, confidence=${aiResponse.confidence}`,
                  modelOutput: aiResponse.reply,
                  confidence: aiResponse.confidence,
                  isFlagged: false
                });
              } else {
                let escalationReason = aiResponse.reason || '';
                if (isVip) escalationReason = 'VIP Contact';
                if (isLowConfidence) escalationReason = `Low confidence: ${aiResponse.confidence} < threshold: ${threshold}`;

                logInfo(workspaceId, `AI auto-reply escalated to draft for ${chatId} (Reason: ${escalationReason})`);

                await AiAutoReplyLog.create({
                  workspaceId,
                  chatId,
                  messageId: null,
                  promptContext: `Claude Escalation Context: VIP=${isVip}, threshold=${threshold}, confidence=${aiResponse.confidence}`,
                  modelOutput: aiResponse.reply,
                  confidence: aiResponse.confidence,
                  isFlagged: false,
                  escalationReason
                });
              }
            } catch (claudeErr) {
              logError(workspaceId, 'Error in Claude auto-reply generation:', claudeErr);
            }
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
      suggestedReply: aiTags.suggestedReply,
      contactId: contact ? contact.id : null
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
        { status: 'Connecting', qrCode: null },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Connecting', qrCode: null });
      }

      // Check if a saved session exists
      const mockSessionPath = path.join(__dirname, '..', 'sessions', `mock-session-${workspaceId}.json`);
      if (fs.existsSync(mockSessionPath)) {
        let isCorrupted = false;
        try {
          const raw = fs.readFileSync(mockSessionPath, 'utf8');
          if (raw.includes('corrupted')) isCorrupted = true;
        } catch (e) {}

        if (isCorrupted) {
          logInfo(workspaceId, 'Existing mock session file detected but it is CORRUPTED. Simulating restoration timeout...');
          await WhatsAppSession.update(
            { status: 'Restoring previous session...', qrCode: null },
            { where: { workspaceId } }
          );
          if (ioInstance) {
            ioInstance.to(workspaceId).emit('status_change', { status: 'Restoring previous session...', qrCode: null });
          }

          setTimeout(async () => {
            logError(workspaceId, 'Mock session restoration timed out.');
            if (fs.existsSync(mockSessionPath)) {
              try {
                fs.unlinkSync(mockSessionPath);
              } catch (e) {}
            }
            await WhatsAppSession.update(
              { status: 'Session expired, generating new QR', qrCode: null, lastError: 'Session expired. Restarting fresh connection.', reconnectAttempts: 0 },
              { where: { workspaceId } }
            );
            if (ioInstance) {
              ioInstance.to(workspaceId).emit('status_change', { status: 'Session expired, generating new QR', qrCode: null });
            }

            setTimeout(() => {
              initClient(workspaceId, true);
            }, 2000);
          }, 5000);
          return;
        }

        logInfo(workspaceId, 'Existing mock session file detected. Restoring session...');
        await WhatsAppSession.update(
          { status: 'Restoring previous session...', qrCode: null },
          { where: { workspaceId } }
        );
        if (ioInstance) {
          ioInstance.to(workspaceId).emit('status_change', { status: 'Restoring previous session...', qrCode: null });
        }
        setTimeout(async () => {
          mockClient.isReady = true;
          // Run the restoration sync loop
          const totalToSync = 3;
          for (let i = 0; i <= totalToSync; i++) {
            setTimeout(async () => {
              const currentStatus = i === totalToSync ? 'Synced' : `Syncing history (${i}/${totalToSync} contacts)`;
              await WhatsAppSession.update(
                { status: currentStatus, qrCode: null },
                { where: { workspaceId } }
              );
              if (ioInstance) {
                ioInstance.to(workspaceId).emit('status_change', { status: currentStatus, qrCode: null });
              }

              if (i === totalToSync) {
                const mockStats = {
                  lastSyncTime: new Date().toISOString(),
                  syncedChats: 3,
                  contactsSynced: [
                    { phone: '919876543210', name: 'Dineshkumar', messagesCount: 5 },
                    { phone: '15550199', name: 'Sarah Miller', messagesCount: 4 },
                    { phone: '919812345678', name: 'Ramesh Patel', messagesCount: 5 }
                  ],
                  status: 'Success'
                };
                await WhatsAppSession.update(
                  { syncStats: JSON.stringify(mockStats) },
                  { where: { workspaceId } }
                );

                logInfo(workspaceId, 'Authenticated (Restored)');
                logInfo(workspaceId, 'WhatsApp Ready (Restored)');
                
                setTimeout(async () => {
                  await WhatsAppSession.update(
                    { status: 'Live' },
                    { where: { workspaceId } }
                  );
                  if (ioInstance) {
                    ioInstance.to(workspaceId).emit('status_change', { status: 'Live', qrCode: null });
                  }
                }, 1500);
              }
            }, i * 800);
          }
        }, 1000);
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

            // Transition to Syncing after 3 seconds
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

              // Run mock sync loop
              const totalToSync = 3;
              for (let i = 0; i <= totalToSync; i++) {
                setTimeout(async () => {
                  const currentStatus = i === totalToSync ? 'Synced' : `Syncing history (${i}/${totalToSync} contacts)`;
                  await WhatsAppSession.update(
                    { status: currentStatus, qrCode: null },
                    { where: { workspaceId } }
                  );
                  if (ioInstance) {
                    ioInstance.to(workspaceId).emit('status_change', { status: currentStatus, qrCode: null });
                  }

                  if (i === totalToSync) {
                    const mockStats = {
                      lastSyncTime: new Date().toISOString(),
                      syncedChats: 3,
                      contactsSynced: [
                        { phone: '919876543210', name: 'Dineshkumar', messagesCount: 5 },
                        { phone: '15550199', name: 'Sarah Miller', messagesCount: 4 },
                        { phone: '919812345678', name: 'Ramesh Patel', messagesCount: 5 }
                      ],
                      status: 'Success'
                    };
                    await WhatsAppSession.update(
                      { syncStats: JSON.stringify(mockStats) },
                      { where: { workspaceId } }
                    );

                    logInfo(workspaceId, 'Authenticated');
                    logInfo(workspaceId, 'WhatsApp Ready');
                    
                    setTimeout(async () => {
                      await WhatsAppSession.update(
                        { status: 'Live' },
                        { where: { workspaceId } }
                      );
                      if (ioInstance) {
                        ioInstance.to(workspaceId).emit('status_change', { status: 'Live', qrCode: null });
                      }
                    }, 1500);
                  }
                }, i * 1200);
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

  let client = null;
  let isRestoring = false;
  try {
    const { Client, LocalAuth } = require('whatsapp-web.js');

    const sessionDir = path.join(__dirname, '..', 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    isRestoring = hasSavedSession(workspaceId);
    const startStatus = isRestoring ? 'Restoring previous session...' : 'Connecting';

    logInfo(workspaceId, `Spawning real WhatsApp web client (Puppeteer)... Status: ${startStatus}`);
    
    // Set status to startup status in DB and sockets
    await WhatsAppSession.update(
      { status: startStatus, qrCode: null, lastError: null },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: startStatus, qrCode: null, lastError: null });
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

    client = new Client({
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
        { status: 'READY', qrCode: null, lastError: null, reconnectAttempts: 0 },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'READY', qrCode: null, lastError: null, reconnectAttempts: 0 });
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

    client.on('message_ack', async (msg, ack) => {
      try {
        let statusStr = 'sent';
        if (ack === 0) statusStr = 'failed';
        else if (ack === 1) statusStr = 'pending';
        else if (ack === 2) statusStr = 'sent';
        else if (ack === 3) statusStr = 'delivered';
        else if (ack === 4) statusStr = 'read';

        const [affectedCount] = await WhatsAppMessage.update(
          { status: statusStr },
          {
            where: {
              workspaceId,
              messageId: msg.id.id
            }
          }
        );

        if (affectedCount > 0 && ioInstance) {
          ioInstance.to(workspaceId).emit('message_ack_update', {
            messageId: msg.id.id,
            chatId: msg.to || msg.from,
            status: statusStr
          });
        }
      } catch (err) {
        logError(workspaceId, 'Error updating message ACK:', err);
      }
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
        { status: 'Disconnected', qrCode: null, lastError: `Auth Failure: ${msg}`, reconnectAttempts: 0 },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', { status: 'Disconnected', qrCode: null, lastError: `Auth Failure: ${msg}`, reconnectAttempts: 0 });
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
      
      if (client && client.pupBrowser) {
        try {
          await client.pupBrowser.close();
        } catch (err) {}
      }

      // Do NOT clean session folder so credentials persist!

      // Exponential backoff reconnect
      const session = await WhatsAppSession.findOne({ where: { workspaceId } });
      const attempts = (session ? session.reconnectAttempts : 0) + 1;
      const delay = Math.min(Math.pow(2, attempts) * 1000, 60000); // Max 60 seconds

      await WhatsAppSession.update(
        { status: 'Reconnecting', qrCode: null, lastError: `Disconnected: ${reason}`, reconnectAttempts: attempts },
        { where: { workspaceId } }
      );
      if (ioInstance) {
        ioInstance.to(workspaceId).emit('status_change', {
          status: 'Reconnecting',
          qrCode: null,
          lastError: `Disconnected: ${reason}`,
          reconnectAttempts: attempts
        });
      }

      try {
        const webhookService = require('./webhookService');
        webhookService.trigger(workspaceId, 'whatsapp.disconnected', { status: 'Disconnected', reason, timestamp: new Date() });
      } catch (whErr) {
        logError(workspaceId, 'Error triggering whatsapp.disconnected webhook:', whErr);
      }

      // Reconnect loop timeout
      setTimeout(() => {
        logInfo(workspaceId, `Attempting auto-reconnect (Attempt ${attempts}) after ${delay}ms...`);
        initClient(workspaceId, false); // Re-initialize without cleaning folder
      }, delay);
    });

    clients.set(workspaceId, client);

    const initTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Restoration Timed Out. Clear stale cache and restart connection.'));
      }, 30000);
    });

    await Promise.race([
      client.initialize(),
      initTimeoutPromise
    ]);

    return client;
  } catch (err) {
    logError(workspaceId, 'Puppeteer initialization failed. Invalidating session folder...', err);
    if (client) {
      try {
        if (client.pupBrowser) {
          await client.pupBrowser.close();
        } else {
          await client.destroy();
        }
      } catch (closeErr) {
        logError(workspaceId, 'Failed to release browser resources during error handling', closeErr);
      }
    }
    
    cleanSessionFolder(workspaceId);
    
    const targetStatus = isRestoring ? 'Session expired, generating new QR' : 'Disconnected';
    const errorMsg = `Browser failed to start: ${err.message || err}`;

    await WhatsAppSession.update(
      { status: targetStatus, qrCode: null, lastError: errorMsg },
      { where: { workspaceId } }
    );
    if (ioInstance) {
      ioInstance.to(workspaceId).emit('status_change', { status: targetStatus, qrCode: null, lastError: errorMsg });
    }

    if (isRestoring) {
      logInfo(workspaceId, 'Restoration attempt failed/timed out. Automatically restarting in clean setup...');
      setTimeout(() => {
        initClient(workspaceId, true);
      }, 2000);
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

  // 4. Send-rate limiter per session
  const lastSend = lastSendTimes.get(workspaceId) || 0;
  const timePassed = Date.now() - lastSend;
  
  const { SystemSetting } = require('../models');
  const dbSetting = await SystemSetting.findOne({ where: { key: 'whatsapp_rate_limit_ms' } }).catch(() => null);
  const minDelay = dbSetting ? parseInt(dbSetting.value, 10) : 2000; // default 2 seconds

  if (timePassed < minDelay) {
    const waitTime = minDelay - timePassed;
    logInfo(workspaceId, `Rate limit active. Throttling outbound message for ${waitTime}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastSendTimes.set(workspaceId, Date.now());

  logInfo(workspaceId, `Sending message to ${finalJid}...`);

  try {
    if (fileUrl) {
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        if (client.isMock) {
          logInfo(workspaceId, `Message Sent`);
          return await client.sendMessage(finalJid, `[Attachment: ${fileUrl}] ` + message);
        } else {
          try {
            const axios = require('axios');
            const { MessageMedia } = require('whatsapp-web.js');
            const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const base64Media = Buffer.from(res.data, 'binary').toString('base64');
            const mimeType = res.headers['content-type'] || fileType || 'image/jpeg';
            const media = new MessageMedia(mimeType, base64Media, path.basename(fileUrl) || 'file.jpg');
            const sendRes = await client.sendMessage(finalJid, media, { caption: message });
            logInfo(workspaceId, `Message Sent`);
            return sendRes;
          } catch (mediaErr) {
            logError(workspaceId, 'Failed to attach remote media. Sending text fallback.', mediaErr);
            const sendRes = await client.sendMessage(finalJid, message);
            logInfo(workspaceId, `Message Sent`);
            return sendRes;
          }
        }
      } else {
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
  hasSavedSession,
  syncWorkspaceChats
};
