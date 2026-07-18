const { Contact, AutomationRule, MessageTemplate, MessageQueue, MessageLog, WhatsAppSession } = require('../models');
const { Op } = require('sequelize');

const start = () => {
  console.log('[Automation Service] Starting automated rule engines (Birthdays & Re-engagement checks)...');
  
  // Run checks once every hour (in production, run daily at midnight)
  setInterval(async () => {
    try {
      await triggerBirthdays();
      await triggerInactivityChecks();
      await triggerPostPurchaseCheckinsForAllWorkspaces();
    } catch (err) {
      console.error('[Automation Service] Run error:', err);
    }
  }, 60 * 60 * 1000); // 1 hour interval
};

const triggerPostPurchaseCheckinsForAllWorkspaces = async () => {
  try {
    const { getClient } = require('./whatsappService');
    const { triggerPostPurchaseCheckins } = require('./advocacyService');

    const sessions = await WhatsAppSession.findAll({ where: { status: 'READY' } });
    for (const session of sessions) {
      const client = getClient(session.workspaceId);
      if (client) {
        await triggerPostPurchaseCheckins(session.workspaceId, client);
      }
    }
  } catch (err) {
    console.error('[Automation Service] Error running post-purchase check-ins:', err);
  }
};

const triggerBirthdays = async () => {
  console.log('[Automation Service] Checking birthdays today...');
  const today = new Date();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const mmdd = `${todayMonth}-${todayDay}`;

  // Find all active Birthday rules
  const activeRules = await AutomationRule.findAll({
    where: { triggerType: 'Birthday', isActive: true },
    include: [{ model: MessageTemplate }]
  });

  for (const rule of activeRules) {
    if (!rule.templateId || !rule.MessageTemplate) continue;

    // Find contacts in this workspace with birthday today
    // Handles postgres and sqlite DATE formats
    const workspaceId = rule.workspaceId;
    const contacts = await Contact.findAll({
      where: {
        workspaceId,
        birthday: {
          [Op.like]: `%-${mmdd}`
        }
      }
    });

    for (const contact of contacts) {
      // Avoid duplicate queue entry for today
      const alreadyQueued = await MessageQueue.findOne({
        where: {
          workspaceId,
          contactId: contact.id,
          message: { [Op.like]: `%birthday%` }, // simple check
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      if (!alreadyQueued) {
        // Personalize message
        let personalized = rule.MessageTemplate.content
          .replace(/\{\{name\}\}/g, contact.name)
          .replace(/\{\{phone\}\}/g, contact.phone)
          .replace(/\{\{city\}\}/g, contact.city || '')
          .replace(/\{\{company\}\}/g, contact.company || '');

        await MessageQueue.create({
          workspaceId,
          contactId: contact.id,
          phone: contact.phone,
          message: personalized,
          fileUrl: rule.MessageTemplate.fileUrl,
          fileType: rule.MessageTemplate.fileType,
          status: 'Pending'
        });
        console.log(`[Automation Service] Birthday greeting queued for ${contact.name} (${contact.phone})`);
        
        try {
          const { AuditLog } = require('../models');
          await AuditLog.create({
            workspaceId,
            action: 'AUTOMATION_TRIGGER',
            details: { ruleType: 'Birthday', ruleId: rule.id, contactId: contact.id, phone: contact.phone }
          });
        } catch (e) {}
      }
    }
  }
};

const triggerInactivityChecks = async () => {
  console.log('[Automation Service] Checking inactive customers (30, 60, and 90 days)...');
  const now = new Date();
  
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(now.getDate() - 30);
  
  const date60DaysAgo = new Date();
  date60DaysAgo.setDate(now.getDate() - 60);

  const date90DaysAgo = new Date();
  date90DaysAgo.setDate(now.getDate() - 90);

  const inactivityIntervals = [
    { type: 'Inactive30Days', dateLimit: date30DaysAgo, label: '30-Day' },
    { type: 'Inactive60Days', dateLimit: date60DaysAgo, label: '60-Day' },
    { type: 'Inactive90Days', dateLimit: date90DaysAgo, label: '90-Day' }
  ];

  for (const interval of inactivityIntervals) {
    const rules = await AutomationRule.findAll({
      where: { triggerType: interval.type, isActive: true },
      include: [{ model: MessageTemplate }]
    });

    for (const rule of rules) {
      if (!rule.templateId || !rule.MessageTemplate) continue;
      const workspaceId = rule.workspaceId;
      const contacts = await Contact.findAll({ where: { workspaceId } });

      for (const contact of contacts) {
        // Base inactivity check on lastPurchaseDate first; fallback to message logs or creation date
        let referenceDate = contact.lastPurchaseDate ? new Date(contact.lastPurchaseDate) : null;
        
        if (!referenceDate) {
          const lastLog = await MessageLog.findOne({
            where: { workspaceId, contactId: contact.id },
            order: [['sentAt', 'DESC']]
          });
          referenceDate = lastLog ? new Date(lastLog.sentAt) : new Date(contact.createdAt);
        }

        const isInactive = referenceDate < interval.dateLimit;

        if (isInactive) {
          // Check if already sent inactivity reminder recently
          const alreadyQueued = await MessageQueue.findOne({
            where: {
              workspaceId,
              contactId: contact.id,
              createdAt: { [Op.gte]: interval.dateLimit }
            }
          });

          if (!alreadyQueued) {
            let personalized = rule.MessageTemplate.content
              .replace(/\{\{name\}\}/g, contact.name)
              .replace(/\{\{phone\}\}/g, contact.phone)
              .replace(/\{\{city\}\}/g, contact.city || '')
              .replace(/\{\{company\}\}/g, contact.company || '');

            await MessageQueue.create({
              workspaceId,
              contactId: contact.id,
              phone: contact.phone,
              message: personalized,
              status: 'Pending'
            });
            console.log(`[Automation Service] ${interval.label} purchase inactivity follow-up queued for ${contact.name}`);

            try {
              const { AuditLog } = require('../models');
              await AuditLog.create({
                workspaceId,
                action: 'AUTOMATION_TRIGGER',
                details: { ruleType: interval.type, ruleId: rule.id, contactId: contact.id, phone: contact.phone }
              });
            } catch (e) {}
          }
        }
      }
    }
  }
};

// Route-triggerable simulation helper for testing
const runSimulationNow = async (workspaceId) => {
  console.log(`[Automation Service] Forcing direct run simulation for workspace ${workspaceId}`);
  await triggerBirthdays();
  await triggerInactivityChecks();
  await triggerPostPurchaseCheckinsForAllWorkspaces();
};

module.exports = {
  start,
  runSimulationNow
};
