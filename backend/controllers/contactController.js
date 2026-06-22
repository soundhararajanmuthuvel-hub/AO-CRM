const { Contact } = require('../models');
const { Op } = require('sequelize');

exports.getContacts = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { search, tag, limit = 50, offset = 0 } = req.query;

    const whereClause = { workspaceId };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
      ];
    }

    if (tag) {
      whereClause.tags = { [Op.like]: `%${tag}%` };
    }

    const { count, rows } = await Contact.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
    });

    return res.json({
      total: count,
      contacts: rows
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    return res.status(500).json({ error: 'Server error fetching contacts' });
  }
};

exports.createContact = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, phone, city, company, tags, birthday } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Clean phone number (leave only numbers)
    const cleanPhone = phone.replace(/[^\d]/g, '');

    const [contact, created] = await Contact.findOrCreate({
      where: { workspaceId, phone: cleanPhone },
      defaults: {
        name,
        city,
        company,
        tags: tags || '',
        birthday: birthday || null
      }
    });

    if (!created) {
      return res.status(400).json({ error: 'Contact with this phone number already exists in this workspace' });
    }

    // Trigger Automation trigger for New Contact if rule active
    const { AutomationRule } = require('../models');
    const rule = await AutomationRule.findOne({
      where: { workspaceId, triggerType: 'ContactAdded', isActive: true }
    });
    if (rule && rule.templateId) {
      const { MessageQueue, MessageTemplate } = require('../models');
      const template = await MessageTemplate.findByPk(rule.templateId);
      if (template) {
        // Personalize message
        let personalized = template.content
          .replace(/\{\{name\}\}/g, contact.name)
          .replace(/\{\{phone\}\}/g, contact.phone)
          .replace(/\{\{city\}\}/g, contact.city || '')
          .replace(/\{\{company\}\}/g, contact.company || '');

        await MessageQueue.create({
          workspaceId,
          contactId: contact.id,
          phone: contact.phone,
          message: personalized,
          fileUrl: template.fileUrl,
          fileType: template.fileType,
          status: 'Pending'
        });
      }
    }

    try {
      const webhookService = require('../services/webhookService');
      webhookService.trigger(workspaceId, 'customer.created', contact.toJSON());
      if (contact.leadStage !== 'Won' && contact.leadStage !== 'Lost') {
        webhookService.trigger(workspaceId, 'lead.created', contact.toJSON());
      }
    } catch (whErr) {
      console.error('Error triggering contact webhook:', whErr);
    }

    return res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    return res.status(500).json({ error: 'Server error creating contact' });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { name, phone, city, company, tags, birthday } = req.body;

    const contact = await Contact.findOne({ where: { id, workspaceId } });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (name) contact.name = name;
    if (phone) contact.phone = phone.replace(/[^\d]/g, '');
    if (city !== undefined) contact.city = city;
    if (company !== undefined) contact.company = company;
    if (tags !== undefined) contact.tags = tags;
    if (birthday !== undefined) contact.birthday = birthday || null;

    await contact.save();
    return res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    return res.status(500).json({ error: 'Server error updating contact' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const deleted = await Contact.destroy({ where: { id, workspaceId } });
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    return res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    return res.status(500).json({ error: 'Server error deleting contact' });
  }
};

exports.importCSV = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split(/\r?\n/);
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or missing content rows' });
    }

    // Simple robust CSV header parser
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find column indexes
    const nameIndex = headers.indexOf('name');
    const phoneIndex = headers.indexOf('phone') !== -1 ? headers.indexOf('phone') : headers.indexOf('mobile');
    const cityIndex = headers.indexOf('city');
    const companyIndex = headers.indexOf('company');
    const tagsIndex = headers.indexOf('tags');
    const birthdayIndex = headers.indexOf('birthday');

    if (phoneIndex === -1 || nameIndex === -1) {
      return res.status(400).json({ error: 'CSV must contain at least "name" and "phone" (or "mobile") headers.' });
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quotes in CSV values splits
      // Match comma unless inside double quotes
      const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());

      const name = row[nameIndex];
      const phone = row[phoneIndex];
      if (!name || !phone) {
        skippedCount++;
        continue;
      }

      const cleanPhone = phone.replace(/[^\d]/g, '');
      const city = cityIndex !== -1 ? row[cityIndex] : null;
      const company = companyIndex !== -1 ? row[companyIndex] : null;
      const tags = tagsIndex !== -1 ? row[tagsIndex] : '';
      const birthday = birthdayIndex !== -1 ? row[birthdayIndex] : null;

      try {
        const [_, created] = await Contact.findOrCreate({
          where: { workspaceId, phone: cleanPhone },
          defaults: {
            name,
            city,
            company,
            tags,
            birthday: birthday ? new Date(birthday) : null
          }
        });
        if (created) {
          createdCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        skippedCount++;
      }
    }

    return res.json({
      message: 'CSV import processed',
      imported: createdCount,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('Import CSV error:', error);
    return res.status(500).json({ error: 'Server error during CSV import' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const contacts = await Contact.findAll({
      where: { workspaceId },
      order: [['name', 'ASC']]
    });

    let csvContent = 'name,phone,city,company,tags,birthday\n';
    contacts.forEach(c => {
      const escapedName = `"${c.name.replace(/"/g, '""')}"`;
      const escapedCity = c.city ? `"${c.city.replace(/"/g, '""')}"` : '';
      const escapedCompany = c.company ? `"${c.company.replace(/"/g, '""')}"` : '';
      const escapedTags = c.tags ? `"${c.tags.replace(/"/g, '""')}"` : '';
      const birthday = c.birthday || '';
      
      csvContent += `${escapedName},${c.phone},${escapedCity},${escapedCompany},${escapedTags},${birthday}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ error: 'Server error exporting contacts' });
  }
};
