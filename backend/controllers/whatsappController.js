const whatsappService = require('../services/whatsappService');
const { WhatsAppSession, MessageLog, Contact, Campaign, MessageQueue, WhatsAppChat, WhatsAppMessage, ChatNote, User, Product } = require('../models');

exports.getStatus = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    let session = await WhatsAppSession.findOne({ where: { workspaceId } });
    
    if (!session) {
      session = await WhatsAppSession.create({ workspaceId });
    }

    const sessionExists = whatsappService.hasSavedSession(workspaceId);

    let phoneNumber = null;
    let pushname = null;
    
    const client = whatsappService.getClient(workspaceId);
    if (client && client.info) {
      pushname = client.info.pushname || null;
      phoneNumber = client.info.wid ? (client.info.wid.user || client.info.wid) : null;
    }

    return res.json({
      status: session.status,
      qrCode: session.qrCode,
      sessionExists,
      phoneNumber,
      pushname,
      lastError: session.lastError,
      syncStats: session.syncStats
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return res.status(500).json({ error: 'Server error retrieving status' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const exists = whatsappService.hasSavedSession(workspaceId);
    return res.json({ exists });
  } catch (error) {
    console.error('Check session error:', error);
    return res.status(500).json({ error: 'Server error checking session' });
  }
};

exports.getQR = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const session = await WhatsAppSession.findOne({ where: { workspaceId } });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not initialized' });
    }

    return res.json({
      qrCode: session.qrCode,
      status: session.status
    });
  } catch (error) {
    console.error('Get QR error:', error);
    return res.status(500).json({ error: 'Server error retrieving QR code' });
  }
};

exports.connect = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    
    // Disconnect old client and delete session folder to force a new QR code scan
    await whatsappService.logoutClient(workspaceId);
    
    await WhatsAppSession.update(
      { status: 'Connecting', qrCode: null },
      { where: { workspaceId } }
    );
    
    whatsappService.initClient(workspaceId, true);

    return res.json({ message: 'WhatsApp connection sequence started.' });
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    return res.status(500).json({ error: 'Server error starting connection' });
  }
};

exports.restoreSession = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const exists = whatsappService.hasSavedSession(workspaceId);
    
    if (!exists) {
      return res.status(400).json({ error: 'No existing session found.' });
    }

    await WhatsAppSession.update(
      { status: 'Connecting', qrCode: null },
      { where: { workspaceId } }
    );

    // Call initClient without forcing a cleanup (so it reuses the existing folder)
    whatsappService.initClient(workspaceId, false);

    return res.json({ message: 'Restoring saved session...' });
  } catch (error) {
    console.error('Restore session error:', error);
    return res.status(500).json({ error: 'Server error restoring session' });
  }
};

exports.logout = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    await whatsappService.logoutClient(workspaceId);
    return res.json({ message: 'Disconnected successfully.' });
  } catch (error) {
    console.error('WhatsApp logout error:', error);
    return res.status(500).json({ error: 'Server error logging out' });
  }
};

exports.sendSingleMessage = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { phone, message, fileUrl, fileType } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    let resolvedContactId = null;
    const contact = await Contact.findOne({ where: { workspaceId, phone: phone.replace(/[^\d]/g, '') } });
    if (contact) resolvedContactId = contact.id;

    try {
      await whatsappService.sendWhatsAppMessage(workspaceId, phone, message, fileUrl, fileType);
      
      await MessageLog.create({
        workspaceId,
        contactId: resolvedContactId,
        phone,
        message,
        fileUrl,
        fileType,
        status: 'Sent'
      });

      return res.json({ success: true, message: 'Message sent successfully.' });
    } catch (sendErr) {
      await MessageLog.create({
        workspaceId,
        contactId: resolvedContactId,
        phone,
        message,
        fileUrl,
        fileType,
        status: 'Failed',
        error: sendErr.message
      });

      return res.status(400).json({ error: sendErr.message });
    }
  } catch (error) {
    console.error('Send single error:', error);
    return res.status(500).json({ error: 'Server error dispatching message' });
  }
};

exports.sendProductMessage = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { phone, productId } = req.body;

    if (!phone || !productId) {
      return res.status(400).json({ error: 'Phone number and product ID are required' });
    }

    const product = await Product.findOne({ where: { id: productId, workspaceId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const priceVal = product.offerPrice ? product.offerPrice : product.price;
    const cleanSku = (product.sku || product.name.toUpperCase().replace(/[^A-Z0-9]/g, '')).toUpperCase();
    const inStock = (product.stock && product.stock > 0) ? '✅ In stock' : '❌ Out of stock';

    const formattedMessage = `*${product.name}* 🛒\n` +
      `Price: ₹${parseFloat(priceVal).toFixed(2)}\n` +
      `${inStock}\n\n` +
      `Reply *"ORDER ${cleanSku}"* to place this order,\n` +
      `or tap below to see more products.`;

    let imageUrl = product.imageUrl;
    let imageType = 'image/jpeg';
    if (!imageUrl && product.imageUrls) {
      try {
        const urls = JSON.parse(product.imageUrls);
        if (Array.isArray(urls) && urls.length > 0) {
          imageUrl = urls[0];
        }
      } catch (err) {}
    }
    if (imageUrl) {
      imageType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    }

    let resolvedContactId = null;
    const contact = await Contact.findOne({ where: { workspaceId, phone: phone.replace(/[^\d]/g, '') } });
    if (contact) resolvedContactId = contact.id;

    try {
      await whatsappService.sendWhatsAppMessage(workspaceId, phone, formattedMessage, imageUrl, imageType);
      
      await MessageLog.create({
        workspaceId,
        contactId: resolvedContactId,
        phone,
        message: formattedMessage,
        fileUrl: imageUrl,
        fileType: imageType,
        status: 'Sent'
      });

      return res.json({ success: true, message: 'Product details sent successfully.' });
    } catch (sendErr) {
      await MessageLog.create({
        workspaceId,
        contactId: resolvedContactId,
        phone,
        message: formattedMessage,
        fileUrl: imageUrl,
        fileType: imageType,
        status: 'Failed',
        error: sendErr.message
      });

      return res.status(400).json({ error: sendErr.message });
    }
  } catch (error) {
    console.error('Send product error:', error);
    return res.status(500).json({ error: 'Server error sending product details' });
  }
};

exports.sendBulkMessages = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, numbers, message } = req.body;

    if (!name || !numbers || !Array.isArray(numbers) || numbers.length === 0 || !message) {
      return res.status(400).json({ error: 'Campaign name, list of numbers array, and message are required.' });
    }

    // Create a mock campaign
    const campaign = await Campaign.create({
      workspaceId,
      name,
      type: 'Marketing',
      targetGroup: 'Custom List',
      status: 'Running',
      totalMessages: numbers.length
    });

    const queueEntries = [];
    for (const num of numbers) {
      // Find name mapping if exists in contacts
      const cleanNum = num.replace(/[^\d]/g, '');
      const contact = await Contact.findOne({ where: { workspaceId, phone: cleanNum } });
      const contactName = contact ? contact.name : 'Customer';
      
      let personalized = message.replace(/\{\{name\}\}/g, contactName);

      queueEntries.push({
        workspaceId,
        campaignId: campaign.id,
        contactId: contact ? contact.id : null,
        phone: num,
        message: personalized,
        status: 'Pending'
      });
    }

    await MessageQueue.bulkCreate(queueEntries);

    return res.json({
      success: true,
      message: `Bulk messaging campaign initialized. ${numbers.length} messages scheduled into delay processor queue.`,
      campaignId: campaign.id
    });
  } catch (error) {
    console.error('Send bulk error:', error);
    return res.status(500).json({ error: 'Server error scheduling bulk campaign' });
  }
};

exports.sendTestMessage = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone number and test message are required' });
    }

    let resolvedContactId = null;
    const contact = await Contact.findOne({ where: { workspaceId, phone: phone.replace(/[^\d]/g, '') } });
    if (contact) resolvedContactId = contact.id;

    try {
      await whatsappService.sendWhatsAppMessage(workspaceId, phone, message);
      
      await MessageLog.create({
        workspaceId,
        contactId: resolvedContactId,
        phone,
        message,
        status: 'Sent'
      });

      return res.json({ success: true, message: 'Test message sent successfully.' });
    } catch (sendErr) {
      await MessageLog.create({
        workspaceId,
        contactId: resolvedContactId,
        phone,
        message,
        status: 'Failed',
        error: sendErr.message
      });

      return res.status(400).json({ success: false, error: sendErr.message });
    }
  } catch (error) {
    console.error('Test message error:', error);
    return res.status(500).json({ error: 'Server error sending test message' });
  }
};

exports.getMessageLogs = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const logs = await MessageLog.findAll({
      where: { workspaceId },
      include: [{ model: Contact }],
      order: [['sentAt', 'DESC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({ error: 'Server error retrieving logs' });
  }
};

exports.testSend = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const client = whatsappService.getClient(workspaceId);
    if (!client) {
      console.error(`[${new Date().toISOString()}] [WhatsApp Service ERROR] [Workspace: ${workspaceId}] Message Failed: WhatsApp Not Connected`);
      return res.status(400).json({ success: false, error: 'WhatsApp Not Connected' });
    }

    if (!client.isReady) {
      console.error(`[${new Date().toISOString()}] [WhatsApp Service ERROR] [Workspace: ${workspaceId}] Message Failed: WhatsApp status is not READY`);
      return res.status(400).json({ success: false, error: 'WhatsApp status is not READY' });
    }

    // Verify client.info exists before sending
    if (!client.info) {
      console.error(`[${new Date().toISOString()}] [WhatsApp Service ERROR] [Workspace: ${workspaceId}] Message Failed: WhatsApp client info not loaded yet`);
      return res.status(400).json({ success: false, error: 'WhatsApp client info not loaded yet' });
    }

    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    const formattedJid = `${cleaned}@c.us`;

    // Verify recipient number exists using getNumberId()
    let numberId = null;
    try {
      numberId = await client.getNumberId(formattedJid);
    } catch (numErr) {
      console.error('Error fetching number ID:', numErr);
    }

    if (!numberId) {
      console.error(`[${new Date().toISOString()}] [WhatsApp Service ERROR] [Workspace: ${workspaceId}] Message Failed: Number not registered on WhatsApp`);
      return res.status(400).json({
        success: false,
        error: 'Number not registered on WhatsApp'
      });
    }

    try {
      const sendRes = await client.sendMessage(numberId._serialized, message);
      console.log(`[${new Date().toISOString()}] [WhatsApp Service] [Workspace: ${workspaceId}] Message Sent`);

      // Save success in logs
      let resolvedContactId = null;
      try {
        const contact = await Contact.findOne({ where: { workspaceId, phone: cleaned } });
        if (contact) resolvedContactId = contact.id;

        await MessageLog.create({
          workspaceId,
          contactId: resolvedContactId,
          phone: cleaned,
          message,
          status: 'Sent'
        });
      } catch (logErr) {
        console.error('Error logging test-send message:', logErr);
      }

      return res.json({
        success: true,
        messageId: sendRes.id.id,
        status: 'sent'
      });
    } catch (sendErr) {
      console.error(`[${new Date().toISOString()}] [WhatsApp Service ERROR] [Workspace: ${workspaceId}] Message Failed: ${sendErr.message}`);

      // Save failure in logs
      let resolvedContactId = null;
      try {
        const contact = await Contact.findOne({ where: { workspaceId, phone: cleaned } });
        if (contact) resolvedContactId = contact.id;

        await MessageLog.create({
          workspaceId,
          contactId: resolvedContactId,
          phone: cleaned,
          message,
          status: 'Failed',
          error: sendErr.message
        });
      } catch (logErr) {
        console.error('Error logging test-send failure:', logErr);
      }

      return res.status(400).json({
        success: false,
        error: sendErr.message || 'WhatsApp message sending failed'
      });
    }
  } catch (error) {
    console.error('test-send error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error sending test message' });
  }
};

exports.verifyConnection = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const client = whatsappService.getClient(workspaceId);
    const session = await WhatsAppSession.findOne({ where: { workspaceId } });

    if (!client || !client.isReady) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp client is not ready or connected',
        status: session ? session.status : 'Disconnected'
      });
    }

    // Get info if available
    let info = null;
    try {
      info = client.info;
    } catch (infoErr) {
      console.error('Error getting client info:', infoErr);
    }

    return res.json({
      success: true,
      status: 'READY',
      info: info || { pushname: 'Connected Device' }
    });

  } catch (error) {
    console.error('Verify connection error:', error);
    return res.status(500).json({ success: false, error: 'Server error verifying connection' });
  }
};

exports.getChats = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const isArchivedQuery = req.query.archived === 'true';
    const { Op } = require('sequelize');

    const chats = await WhatsAppChat.findAll({
      where: { 
        workspaceId,
        isArchived: isArchivedQuery,
        [Op.and]: [
          WhatsAppChat.sequelize.literal(`EXISTS (SELECT 1 FROM WhatsAppMessages WHERE WhatsAppMessages.chatId = WhatsAppChat.chatId AND WhatsAppMessages.workspaceId = WhatsAppChat.workspaceId)`)
        ]
      },
      include: [{ model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] }],
      order: [
        ['isPinned', 'DESC'],
        ['lastMessageTime', 'DESC']
      ]
    });
    return res.json(chats);
  } catch (error) {
    console.error('getChats error:', error);
    return res.status(500).json({ error: 'Server error retrieving chats' });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { chatId } = req.params;

    // Fetch real conversation messages from connected client if active
    const client = whatsappService.getClient(workspaceId);
    if (client && client.isReady) {
      try {
        const chat = await client.getChatById(chatId);
        if (chat) {
          const messages = await chat.fetchMessages({ limit: 30 });
          for (const msg of messages) {
            const msgId = msg.id.id;
            const msgTimestamp = new Date(msg.timestamp * 1000);

            // Fetch AI analysis for incoming messages if not already analyzed
            let aiTags = { leadIntent: 'None', orderIntent: 'None', sentiment: 'None', suggestedReply: null };
            const existing = await WhatsAppMessage.findOne({ where: { workspaceId, messageId: msgId } });
            if (!existing && !msg.fromMe && msg.body) {
              try {
                const aiService = require('../services/aiService');
                aiTags = await aiService.analyzeMessage(msg.body, workspaceId);
              } catch (aiErr) {}
            }

            await WhatsAppMessage.findOrCreate({
              where: { workspaceId, messageId: msgId },
              defaults: {
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
                isUnread: false,
                leadIntent: existing ? existing.leadIntent : aiTags.leadIntent,
                orderIntent: existing ? existing.orderIntent : aiTags.orderIntent,
                sentiment: existing ? existing.sentiment : aiTags.sentiment,
                suggestedReply: existing ? existing.suggestedReply : aiTags.suggestedReply
              }
            });
          }
        }
      } catch (waErr) {
        console.error('Error fetching live messages on click:', waErr.message);
      }
    }

    const messages = await WhatsAppMessage.findAll({
      where: { workspaceId, chatId },
      order: [['timestamp', 'ASC']]
    });

    const allProducts = await Product.findAll({ where: { workspaceId } });
    const messagesWithProduct = messages.map(msg => {
      const msgJson = msg.toJSON();
      if (!msg.fromMe && msg.body) {
        const textLower = msg.body.toLowerCase();
        for (const p of allProducts) {
          const pName = p.name.toLowerCase();
          if (textLower.includes(pName) || (p.sku && textLower.includes(p.sku.toLowerCase()))) {
            let parsedImg = null;
            if (p.imageUrls) {
              try {
                parsedImg = JSON.parse(p.imageUrls)[0];
              } catch (e) {}
            }
            
            msgJson.detectedProduct = {
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.offerPrice ? p.offerPrice : p.price,
              stock: p.stock,
              unit: p.unit,
              description: p.description,
              benefits: p.benefits,
              ingredients: p.ingredients,
              specifications: p.specifications,
              imageUrl: p.imageUrl || parsedImg,
              catalogueUrl: p.catalogueUrl || p.cataloguePdfUrl,
              websiteUrl: p.websiteUrl || p.productUrl,
              recommendations: allProducts
                .filter(prod => prod.id !== p.id)
                .map(prod => {
                  let pImg = null;
                  if (prod.imageUrls) {
                    try {
                      pImg = JSON.parse(prod.imageUrls)[0];
                    } catch (e) {}
                  }
                  return {
                    id: prod.id,
                    name: prod.name,
                    price: prod.offerPrice ? prod.offerPrice : prod.price,
                    imageUrl: prod.imageUrl || pImg
                  };
                })
                .slice(0, 2)
            };
            break;
          }
        }
      }
      return msgJson;
    });
    
    // Clear unread count on view
    await WhatsAppChat.update(
      { unreadCount: 0 },
      { where: { workspaceId, chatId } }
    );

    return res.json(messagesWithProduct);
  } catch (error) {
    console.error('getChatMessages error:', error);
    return res.status(500).json({ error: 'Server error retrieving chat messages' });
  }
};

exports.assignChat = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { chatId, userId } = req.body;

    const chat = await WhatsAppChat.findOne({ where: { workspaceId, chatId } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat thread not found' });
    }

    chat.assignedTo = userId || null;
    await chat.save();

    const updatedChat = await WhatsAppChat.findOne({
      where: { workspaceId, chatId },
      include: [{ model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] }]
    });

    return res.json({ success: true, message: 'Chat assigned successfully.', chat: updatedChat });
  } catch (error) {
    console.error('assignChat error:', error);
    return res.status(500).json({ error: 'Server error assigning chat' });
  }
};

exports.addChatNote = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const userId = req.userId;
    const { chatId, note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const dbNote = await ChatNote.create({
      workspaceId,
      chatId,
      userId,
      note
    });

    const populatedNote = await ChatNote.findByPk(dbNote.id, {
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    return res.json({ success: true, note: populatedNote });
  } catch (error) {
    console.error('addChatNote error:', error);
    return res.status(500).json({ error: 'Server error creating internal note' });
  }
};

exports.getChatNotes = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { chatId } = req.params;
    
    const notes = await ChatNote.findAll({
      where: { workspaceId, chatId },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.json(notes);
  } catch (error) {
    console.error('getChatNotes error:', error);
    return res.status(500).json({ error: 'Server error fetching internal notes' });
  }
};

exports.changeChatSalesStatus = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { chatId, salesStatus } = req.body;

    const chat = await WhatsAppChat.findOne({ where: { workspaceId, chatId } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.salesStatus = salesStatus;
    await chat.save();

    return res.json({ success: true, message: 'Chat status updated.', chat });
  } catch (error) {
    console.error('changeChatSalesStatus error:', error);
    return res.status(500).json({ error: 'Server error updating chat status' });
  }
};

exports.togglePinChat = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { chatId } = req.params;

    const chat = await WhatsAppChat.findOne({ where: { workspaceId, chatId } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.isPinned = !chat.isPinned;
    await chat.save();

    return res.json({ success: true, isPinned: chat.isPinned, chat });
  } catch (error) {
    console.error('togglePinChat error:', error);
    return res.status(500).json({ error: 'Server error pinning chat' });
  }
};

exports.toggleArchiveChat = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { chatId } = req.params;

    const chat = await WhatsAppChat.findOne({ where: { workspaceId, chatId } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.isArchived = !chat.isArchived;
    await chat.save();

    return res.json({ success: true, isArchived: chat.isArchived, chat });
  } catch (error) {
    console.error('toggleArchiveChat error:', error);
    return res.status(500).json({ error: 'Server error archiving chat' });
  }
};

exports.toggleStarMessage = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { messageId } = req.params;

    const msg = await WhatsAppMessage.findOne({ where: { workspaceId, messageId } });
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    msg.isStarred = !msg.isStarred;
    await msg.save();

    return res.json({ success: true, isStarred: msg.isStarred, message: msg });
  } catch (error) {
    console.error('toggleStarMessage error:', error);
    return res.status(500).json({ error: 'Server error starring message' });
  }
};

exports.flagMessageLog = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { messageId } = req.params;
    const { reason } = req.body;

    const { AiAutoReplyLog } = require('../models');

    const log = await AiAutoReplyLog.findOne({ where: { workspaceId, messageId } });
    if (!log) {
      return res.status(404).json({ error: 'AI prompt log not found for this message' });
    }

    log.isFlagged = true;
    log.flaggedReason = reason || 'Flagged as incorrect auto-reply';
    await log.save();

    return res.json({ success: true, message: 'Auto-reply flagged successfully', log });
  } catch (error) {
    console.error('flagMessageLog error:', error);
    return res.status(500).json({ error: 'Server error flagging message' });
  }
};

exports.syncChatsManual = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const client = whatsappService.getClient(workspaceId);
    if (!client || !client.isReady) {
      return res.status(400).json({ error: 'WhatsApp is not connected. Please go to WhatsApp Link page to connect.' });
    }

    // Trigger sync in background
    whatsappService.syncWorkspaceChats(workspaceId, client);
    return res.json({ success: true, message: 'WhatsApp chat sync started in background.' });
  } catch (error) {
    console.error('syncChatsManual error:', error);
    return res.status(500).json({ error: 'Server error triggering chat sync' });
  }
};
