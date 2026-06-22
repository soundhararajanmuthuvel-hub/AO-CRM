const { Contact } = require('../models');
const { Op } = require('sequelize');

exports.getLeads = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { search, leadScore } = req.query;

    const whereClause = {
      workspaceId,
      leadStage: { [Op.ne]: 'Won' }
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } }
      ];
    }

    if (leadScore) {
      whereClause.leadScore = leadScore;
    }

    const leads = await Contact.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.json(leads);
  } catch (error) {
    console.error('getLeads error:', error);
    return res.status(500).json({ error: 'Server error retrieving leads' });
  }
};

exports.createLead = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, phone, city, company, tags, birthday, leadSource, leadStage, leadScore, conversionProbability, outstandingAmount } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');

    const [lead, created] = await Contact.findOrCreate({
      where: { workspaceId, phone: cleanPhone },
      defaults: {
        name,
        city,
        company,
        tags: tags || '',
        birthday: birthday || null,
        leadSource: leadSource || 'Manual Entry',
        leadStage: leadStage || 'New',
        leadScore: leadScore || 'Cold',
        conversionProbability: conversionProbability || 0.0,
        outstandingAmount: outstandingAmount || 0.00
      }
    });

    if (!created) {
      return res.status(400).json({ error: 'Lead with this phone number already exists' });
    }

    // Trigger webhook event
    try {
      const webhookService = require('../services/webhookService');
      webhookService.trigger(workspaceId, 'customer.created', lead.toJSON());
      webhookService.trigger(workspaceId, 'lead.created', lead.toJSON());
    } catch (whErr) {
      console.error('Error triggering lead webhook:', whErr);
    }

    return res.status(201).json(lead);
  } catch (error) {
    console.error('createLead error:', error);
    return res.status(500).json({ error: 'Server error creating lead' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { name, phone, city, company, tags, birthday, leadSource, leadStage, leadScore, conversionProbability, outstandingAmount, healthScore } = req.body;

    const lead = await Contact.findOne({ where: { id, workspaceId } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (name) lead.name = name;
    if (phone) lead.phone = phone.replace(/[^\d]/g, '');
    if (city !== undefined) lead.city = city;
    if (company !== undefined) lead.company = company;
    if (tags !== undefined) lead.tags = tags;
    if (birthday !== undefined) lead.birthday = birthday || null;
    if (leadSource !== undefined) lead.leadSource = leadSource;
    if (leadStage !== undefined) lead.leadStage = leadStage;
    if (leadScore !== undefined) lead.leadScore = leadScore;
    if (conversionProbability !== undefined) lead.conversionProbability = conversionProbability;
    if (outstandingAmount !== undefined) lead.outstandingAmount = outstandingAmount;
    if (healthScore !== undefined) lead.healthScore = healthScore;

    await lead.save();
    return res.json(lead);
  } catch (error) {
    console.error('updateLead error:', error);
    return res.status(500).json({ error: 'Server error updating lead' });
  }
};
