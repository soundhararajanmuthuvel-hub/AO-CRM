const { Campaign, MessageTemplate, Contact, MessageQueue } = require('../models');

exports.getCampaigns = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const campaigns = await Campaign.findAll({
      where: { workspaceId },
      include: [{ model: MessageTemplate }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Server error fetching campaigns' });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, type, templateId, targetGroup, scheduledAt } = req.body;

    if (!name || !templateId) {
      return res.status(400).json({ error: 'Name and template are required' });
    }

    const template = await MessageTemplate.findOne({ where: { id: templateId, workspaceId } });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const status = scheduledAt ? 'Scheduled' : 'Draft';

    const campaign = await Campaign.create({
      workspaceId,
      name,
      type: type || 'Marketing',
      templateId,
      targetGroup: targetGroup || 'All',
      scheduledAt: scheduledAt || null,
      status
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Server error creating campaign' });
  }
};

exports.startCampaign = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: { id, workspaceId },
      include: [{ model: MessageTemplate }]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'Completed' || campaign.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot start campaign with status: ${campaign.status}` });
    }

    // Resolve target contacts
    let contacts = [];
    if (campaign.targetGroup === 'All') {
      contacts = await Contact.findAll({ where: { workspaceId } });
    } else {
      // Find by tags containing the group name
      const { Op } = require('sequelize');
      contacts = await Contact.findAll({
        where: {
          workspaceId,
          tags: { [Op.like]: `%${campaign.targetGroup}%` }
        }
      });
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts found matching the target group' });
    }

    // Create Message Queue entries
    const queueEntries = contacts.map(contact => {
      // Replace personalization tags
      let messageContent = campaign.MessageTemplate.content
        .replace(/\{\{name\}\}/g, contact.name)
        .replace(/\{\{phone\}\}/g, contact.phone)
        .replace(/\{\{city\}\}/g, contact.city || '')
        .replace(/\{\{company\}\}/g, contact.company || '');

      return {
        workspaceId,
        campaignId: campaign.id,
        contactId: contact.id,
        phone: contact.phone,
        message: messageContent,
        fileUrl: campaign.MessageTemplate.fileUrl,
        fileType: campaign.MessageTemplate.fileType,
        status: 'Pending'
      };
    });

    await MessageQueue.bulkCreate(queueEntries);

    campaign.status = 'Running';
    campaign.totalMessages = contacts.length;
    await campaign.save();

    return res.json(campaign);
  } catch (error) {
    console.error('Start campaign error:', error);
    return res.status(500).json({ error: 'Server error starting campaign' });
  }
};

exports.pauseCampaign = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const campaign = await Campaign.findOne({ where: { id, workspaceId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'Running') {
      return res.status(400).json({ error: 'Campaign is not currently running' });
    }

    // Shift back to draft/paused state
    campaign.status = 'Draft';
    await campaign.save();

    // Mark pending items for this campaign in queue as Paused or just leave them.
    // The processor won't send them while status is Draft/Paused.
    return res.json(campaign);
  } catch (error) {
    console.error('Pause campaign error:', error);
    return res.status(500).json({ error: 'Server error pausing campaign' });
  }
};

exports.resumeCampaign = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const campaign = await Campaign.findOne({ where: { id, workspaceId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'Draft' && campaign.status !== 'Scheduled') {
      return res.status(400).json({ error: 'Campaign cannot be resumed' });
    }

    campaign.status = 'Running';
    await campaign.save();

    return res.json(campaign);
  } catch (error) {
    console.error('Resume campaign error:', error);
    return res.status(500).json({ error: 'Server error resuming campaign' });
  }
};

exports.cancelCampaign = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const campaign = await Campaign.findOne({ where: { id, workspaceId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.status = 'Cancelled';
    await campaign.save();

    // Delete pending queue items for this campaign
    await MessageQueue.destroy({
      where: { campaignId: campaign.id, status: 'Pending' }
    });

    return res.json(campaign);
  } catch (error) {
    console.error('Cancel campaign error:', error);
    return res.status(500).json({ error: 'Server error cancelling campaign' });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const deleted = await Campaign.destroy({ where: { id, workspaceId } });
    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ error: 'Server error deleting campaign' });
  }
};
