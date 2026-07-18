const { SalesOrder, Contact, Task, WhatsAppMessage } = require('../models');
const { Op } = require('sequelize');

const logInfo = (workspaceId, msg) => console.log(`[Advocacy Service] [W-${workspaceId}] ${msg}`);
const logError = (workspaceId, msg, err) => console.error(`[Advocacy Service] [W-${workspaceId}] ${msg}`, err);

/**
 * Scan for orders delivered exactly 2 days ago and trigger feedback requests.
 */
const triggerPostPurchaseCheckins = async (workspaceId, client) => {
  if (!client || !client.isReady) {
    logInfo(workspaceId, 'Skipping post-purchase scan: Client is not online.');
    return;
  }

  try {
    const twoDaysAgoStart = new Date();
    twoDaysAgoStart.setDate(twoDaysAgoStart.getDate() - 2);
    twoDaysAgoStart.setHours(0, 0, 0, 0);

    const twoDaysAgoEnd = new Date();
    twoDaysAgoEnd.setDate(twoDaysAgoEnd.getDate() - 2);
    twoDaysAgoEnd.setHours(23, 59, 59, 999);

    const deliveredOrders = await SalesOrder.findAll({
      where: {
        workspaceId,
        status: 'Delivered',
        updatedAt: {
          [Op.between]: [twoDaysAgoStart, twoDaysAgoEnd]
        }
      }
    });

    logInfo(workspaceId, `Found ${deliveredOrders.length} orders delivered 2 days ago.`);

    for (const order of deliveredOrders) {
      const cleanPhone = order.phone.replace(/[^\d]/g, '');
      const chatId = `${cleanPhone}@c.us`;

      // Check if we already sent them a feedback check-in recently
      const alreadyChecked = await WhatsAppMessage.findOne({
        where: {
          workspaceId,
          chatId,
          fromMe: true,
          body: {
            [Op.like]: '%rating from 1 to 5 stars!%'
          }
        }
      });

      if (!alreadyChecked) {
        const feedbackPrompt = `Hi ${order.customerName}! Hope you're enjoying your organic purchase. How was the quality? Please reply with a rating from 1 to 5 stars! 🌟`;
        
        logInfo(workspaceId, `Sending feedback check-in to ${order.customerName} (+${cleanPhone})...`);
        const { sendWhatsAppMessage } = require('./whatsappService');
        await sendWhatsAppMessage(workspaceId, cleanPhone, feedbackPrompt);

        try {
          const { AuditLog } = require('../models');
          await AuditLog.create({
            workspaceId,
            action: 'AUTOMATION_TRIGGER',
            details: { ruleType: 'PostPurchaseFeedback', orderId: order.id, customerName: order.customerName, phone: cleanPhone }
          });
        } catch (e) {}
      }
    }
  } catch (err) {
    logError(workspaceId, 'Error during post-purchase advocacy scan:', err);
  }
};

/**
 * Handle incoming feedback response
 */
const handleAdvocacyReply = async (workspaceId, client, chatId, replyText) => {
  try {
    const cleanPhone = chatId.replace(/[^\d]/g, '');
    const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
    if (!contact) return;

    const bodyLower = replyText.toLowerCase();

    // Check if reply contains rating numbers or positive/negative cues
    const isNegative = /\b([1-3])\b/.test(bodyLower) || bodyLower.includes('bad') || bodyLower.includes('poor') || bodyLower.includes('damaged') || bodyLower.includes('worst') || bodyLower.includes('unsatisfied');
    const isPositive = /\b([4-5])\b/.test(bodyLower) || bodyLower.includes('good') || bodyLower.includes('great') || bodyLower.includes('excellent') || bodyLower.includes('awesome') || bodyLower.includes('nice') || bodyLower.includes('best');

    if (isNegative) {
      logInfo(workspaceId, `Negative advocacy score detected for contact ${contact.name}: "${replyText}"`);

      // Promote to priority negotiation list
      contact.leadStage = 'Negotiation';
      await contact.save();

      // Create priority escalation CRM task
      await Task.create({
        workspaceId,
        title: 'Priority: Customer Feedback Escalation',
        description: `Customer ${contact.name} (+${cleanPhone}) left negative feedback: "${replyText}". Reach out to resolve.`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day due
        priority: 'High',
        status: 'Pending',
        assignedTo: null, // Unassigned pool
        contactId: contact.id
      });

      // Send sorry auto reply
      const sorryMsg = `We are so sorry to hear that your experience wasn't perfect. 😔 We value your feedback and a customer representative has been assigned to contact you immediately to resolve this. Thank you for letting us know!`;
      await client.sendMessage(chatId, sorryMsg);

      try {
        const { AuditLog } = require('../models');
        await AuditLog.create({
          workspaceId,
          action: 'ADVOCACY_RESPONSE',
          details: { contactId: contact.id, type: 'Negative', response: replyText }
        });
      } catch (e) {}

    } else if (isPositive) {
      logInfo(workspaceId, `Positive advocacy score detected for contact ${contact.name}: "${replyText}"`);

      // Tag as VIP candidate
      const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];
      if (!tags.includes('Advocate')) tags.push('Advocate');
      if (!tags.includes('VIP Candidate')) tags.push('VIP Candidate');
      contact.tags = tags.join(', ');
      await contact.save();

      // Generate a unique referral coupon code
      const namePart = contact.name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5);
      const randomPart = Math.floor(100 + Math.random() * 900);
      const code = `REF-${namePart}-${randomPart}`;

      // Send thank you voucher code auto reply
      const thanksMsg = `Thank you so much for the love! 💚 We appreciate your support for organic farming. Here is a 10% off referral code for your next order: *${code}*. Share this with friends! If they order, we will credit your account. 🎁`;
      await client.sendMessage(chatId, thanksMsg);

      try {
        const { AuditLog } = require('../models');
        await AuditLog.create({
          workspaceId,
          action: 'ADVOCACY_RESPONSE',
          details: { contactId: contact.id, type: 'Positive', response: replyText, generatedVoucher: code }
        });
      } catch (e) {}
    }
  } catch (err) {
    logError(workspaceId, 'Error during advocacy response handling:', err);
  }
};

module.exports = {
  triggerPostPurchaseCheckins,
  handleAdvocacyReply
};
