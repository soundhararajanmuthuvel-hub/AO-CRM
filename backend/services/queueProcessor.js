const { MessageQueue, MessageLog, Workspace, Campaign, Contact } = require('../models');
const whatsappService = require('./whatsappService');
const { Op } = require('sequelize');

const workspaceTimers = new Map();
let isRunning = false;

const processWorkspaceMessage = async (workspaceId) => {
  try {
    const client = whatsappService.getClient(workspaceId);
    const isWhatsAppOnline = client && client.isReady;

    const statusList = ['Pending', 'Retrying'];
    if (isWhatsAppOnline) {
      statusList.push('WaitingForConnection');
    }

    // 1. Fetch highest priority, oldest message due for sync
    const messageItem = await MessageQueue.findOne({
      where: {
        workspaceId,
        status: { [Op.in]: statusList },
        [Op.or]: [
          { scheduledAt: null },
          { scheduledAt: { [Op.lte]: new Date() } }
        ]
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });

    if (!messageItem) {
      // Clean up timer and return
      workspaceTimers.delete(workspaceId);
      return;
    }

    // 2. Validate WhatsApp online status. If offline, do NOT fail the message.
    if (!isWhatsAppOnline) {
      console.log(`[Queue Processor] WhatsApp disconnected for workspace ${workspaceId}. Holding message ${messageItem.id} in WaitingForConnection status.`);
      messageItem.status = 'WaitingForConnection';
      messageItem.error = 'WhatsApp Offline';
      await messageItem.save();
      
      scheduleNext(workspaceId);
      return;
    }

    // Mark as Sending to avoid duplicate pick
    messageItem.status = 'Sending';
    await messageItem.save();

    // 3. Validate subscription limits & daily broadcast cap
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Daily Cap Validation
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sentTodayCount = await MessageLog.count({
      where: {
        workspaceId,
        status: 'Sent',
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });

    const dailyCap = workspace.broadcastDailyCap || 500;
    if (sentTodayCount >= dailyCap) {
      console.log(`[Queue Processor] Workspace ${workspaceId} crossed daily send cap of ${dailyCap}. Auto-pausing campaign.`);
      messageItem.status = 'Pending';
      messageItem.error = 'Daily send cap exceeded';
      await messageItem.save();

      if (messageItem.campaignId) {
        await Campaign.update({ status: 'Draft' }, { where: { id: messageItem.campaignId } });
      }

      scheduleNext(workspaceId);
      return;
    }

    if (workspace.messageUsageThisMonth >= workspace.messageLimit) {
      messageItem.status = 'Failed';
      messageItem.error = 'Monthly message quota exceeded';
      await messageItem.save();

      await MessageLog.create({
        workspaceId,
        campaignId: messageItem.campaignId,
        contactId: messageItem.contactId,
        phone: messageItem.phone,
        message: messageItem.message,
        fileUrl: messageItem.fileUrl,
        fileType: messageItem.fileType,
        status: 'Failed',
        error: 'Monthly quota exceeded'
      });

      if (messageItem.campaignId) {
        await Campaign.increment({ failedCount: 1 }, { where: { id: messageItem.campaignId } });
        await checkCampaignCompletion(messageItem.campaignId);
      }

      // Schedule next message check after delay
      scheduleNext(workspaceId);
      return;
    }

    // 4. Send message via WhatsApp
    console.log(`[Queue Processor] Sending message for workspace ${workspaceId} to ${messageItem.phone}`);
    
    try {
      const sendRes = await whatsappService.sendWhatsAppMessage(
        workspaceId,
        messageItem.phone,
        messageItem.message,
        messageItem.fileUrl,
        messageItem.fileType
      );

      const waMsgId = sendRes && sendRes.id ? sendRes.id.id : null;

      // Upgrade Status to Sent
      messageItem.status = 'Sent';
      messageItem.sentAt = new Date();
      messageItem.whatsappMessageId = waMsgId;
      await messageItem.save();

      // Log success
      await MessageLog.create({
        workspaceId,
        campaignId: messageItem.campaignId,
        contactId: messageItem.contactId,
        phone: messageItem.phone,
        message: messageItem.message,
        fileUrl: messageItem.fileUrl,
        fileType: messageItem.fileType,
        status: 'Sent'
      });

      // Increment Usage & Campaign Success counts
      await workspace.increment('messageUsageThisMonth');
      if (messageItem.campaignId) {
        await Campaign.increment({ sentCount: 1 }, { where: { id: messageItem.campaignId } });
        await checkCampaignCompletion(messageItem.campaignId);
      }

    } catch (sendError) {
      console.error(`[Queue Processor] Send failed for message ${messageItem.id}:`, sendError.message);

      // Auto-pause campaign if WhatsApp returns any error mid-batch
      if (messageItem.campaignId) {
        try {
          await Campaign.update({ status: 'Draft' }, { where: { id: messageItem.campaignId } });
          console.log(`[Queue Processor] Campaign ${messageItem.campaignId} auto-paused due to send error: ${sendError.message}`);
        } catch (e) {}
      }
      
      // Attempt retry backoff delays: 1 min, 5 min, 15 min, 60 min (1 hour)
      const attempt = messageItem.retryCount + 1;
      const retryLimit = 5;
      
      if (attempt < retryLimit) {
        let delayMinutes = 1;
        if (attempt === 2) delayMinutes = 5;
        if (attempt === 3) delayMinutes = 15;
        if (attempt === 4) delayMinutes = 60;
        
        messageItem.status = 'Retrying';
        messageItem.retryCount = attempt;
        messageItem.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        messageItem.error = sendError.message;
        await messageItem.save();
        
        console.log(`[Queue Processor] Message ${messageItem.id} scheduled for retry attempt ${attempt} in ${delayMinutes} minutes.`);
      } else {
        messageItem.status = 'Failed';
        messageItem.retryCount = attempt;
        messageItem.error = sendError.message;
        await messageItem.save();

        // Log final failure
        await MessageLog.create({
          workspaceId,
          campaignId: messageItem.campaignId,
          contactId: messageItem.contactId,
          phone: messageItem.phone,
          message: messageItem.message,
          fileUrl: messageItem.fileUrl,
          fileType: messageItem.fileType,
          status: 'Failed',
          error: `Failed after 5 retries: ${sendError.message}`
        });

        if (messageItem.campaignId) {
          await Campaign.increment({ failedCount: 1 }, { where: { id: messageItem.campaignId } });
          await checkCampaignCompletion(messageItem.campaignId);
        }
      }
    }

    // Schedule next run for this workspace with 5-10s random delay
    scheduleNext(workspaceId);

  } catch (err) {
    console.error(`[Queue Processor] Error processing workspace ${workspaceId}:`, err);
    workspaceTimers.delete(workspaceId);
  }
};

const scheduleNext = async (workspaceId) => {
  let minSec = 3;
  let maxSec = 8;
  try {
    const ws = await Workspace.findByPk(workspaceId);
    if (ws) {
      minSec = ws.broadcastMinDelay || 3;
      maxSec = ws.broadcastMaxDelay || 8;
    }
  } catch (e) {}

  const minMs = minSec * 1000;
  const maxMs = maxSec * 1000;
  const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

  console.log(`[Queue Processor] Scheduling next message for workspace ${workspaceId} in ${randomDelay / 1000}s (range: ${minSec}-${maxSec}s)`);
  
  const timer = setTimeout(() => {
    processWorkspaceMessage(workspaceId);
  }, randomDelay);
  
  workspaceTimers.set(workspaceId, timer);
};

const checkCampaignCompletion = async (campaignId) => {
  const pendingCount = await MessageQueue.count({
    where: campaignId ? { campaignId, status: { [Op.in]: ['Pending', 'Sending', 'Retrying', 'WaitingForConnection'] } } : {}
  });
  
  if (pendingCount === 0 && campaignId) {
    await Campaign.update({ status: 'Completed' }, { where: { id: campaignId } });
    console.log(`[Queue Processor] Campaign ${campaignId} completed!`);
  }
};

const start = () => {
  if (isRunning) return;
  isRunning = true;
  console.log('[Queue Processor] Starting background service scheduler...');

  // Main poll loop running every 2 seconds
  setInterval(async () => {
    try {
      // Find all distinct workspaces that have pending, retrying or waiting messages
      const pendingWorkspaces = await MessageQueue.findAll({
        attributes: ['workspaceId'],
        where: {
          status: { [Op.in]: ['Pending', 'Retrying', 'WaitingForConnection'] },
          [Op.or]: [
            { scheduledAt: null },
            { scheduledAt: { [Op.lte]: new Date() } }
          ]
        },
        group: ['workspaceId']
      });

      for (const queueItem of pendingWorkspaces) {
        const wsId = queueItem.workspaceId;
        
        // If workspace is not currently locked in a delay timer, start processing
        if (!workspaceTimers.has(wsId)) {
          workspaceTimers.set(wsId, true); // Lock initially
          processWorkspaceMessage(wsId);
        }
      }
    } catch (pollErr) {
      console.error('[Queue Processor] Poller error:', pollErr);
    }
  }, 2000);
};

module.exports = {
  start
};
