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
    const { 
      name, phone, email, address, gstNumber, city, company, tags, birthday, 
      leadSource, leadStage, leadScore, conversionProbability, outstandingAmount, healthScore 
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Clean phone number (leave only numbers)
    const cleanPhone = phone.replace(/[^\d]/g, '');

    const [contact, created] = await Contact.findOrCreate({
      where: { workspaceId, phone: cleanPhone },
      defaults: {
        name,
        email,
        address,
        gstNumber,
        city,
        company,
        tags: tags || '',
        birthday: birthday || null,
        leadSource: leadSource || 'Manual Entry',
        leadStage: leadStage || 'New',
        leadScore: leadScore || 'Cold',
        conversionProbability: parseFloat(conversionProbability) || 0.0,
        outstandingAmount: parseFloat(outstandingAmount) || 0.00,
        healthScore: healthScore || 'Active'
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
    const { 
      name, phone, email, address, gstNumber, city, company, tags, birthday,
      leadSource, leadStage, leadScore, conversionProbability, outstandingAmount, healthScore
    } = req.body;

    const contact = await Contact.findOne({ where: { id, workspaceId } });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (name) contact.name = name;
    if (phone) contact.phone = phone.replace(/[^\d]/g, '');
    if (email !== undefined) contact.email = email;
    if (address !== undefined) contact.address = address;
    if (gstNumber !== undefined) contact.gstNumber = gstNumber;
    if (city !== undefined) contact.city = city;
    if (company !== undefined) contact.company = company;
    if (tags !== undefined) contact.tags = tags;
    if (birthday !== undefined) contact.birthday = birthday || null;
    if (leadSource !== undefined) contact.leadSource = leadSource;
    if (leadStage !== undefined) contact.leadStage = leadStage;
    if (leadScore !== undefined) contact.leadScore = leadScore;
    if (conversionProbability !== undefined) contact.conversionProbability = parseFloat(conversionProbability) || 0.0;
    if (outstandingAmount !== undefined) contact.outstandingAmount = parseFloat(outstandingAmount) || 0.00;
    if (healthScore !== undefined) contact.healthScore = healthScore;

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

    const contact = await Contact.findOne({ where: { id, workspaceId } });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { Task, DailyVisit, MessageQueue, MessageLog } = require('../models');

    // Clean up or nullify related models to prevent SQLite foreign key constraint failures
    await Task.destroy({ where: { contactId: id, workspaceId } });
    await DailyVisit.destroy({ where: { contactId: id, workspaceId } });
    await MessageQueue.update({ contactId: null }, { where: { contactId: id, workspaceId } });
    await MessageLog.update({ contactId: null }, { where: { contactId: id, workspaceId } });

    await contact.destroy();

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

exports.getContactTimeline = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const contact = await Contact.findOne({ where: { id, workspaceId } });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { WhatsAppMessage, SalesOrder, Task, ChatNote } = require('../models');

    // Fetch related logs
    const chatId = `${contact.phone}@c.us`;

    const [messages, orders, tasks, notes] = await Promise.all([
      WhatsAppMessage.findAll({
        where: { workspaceId, chatId },
        limit: 100,
        order: [['timestamp', 'DESC']]
      }),
      SalesOrder.findAll({
        where: { workspaceId, [Op.or]: [{ phone: contact.phone }, { chatId }] },
        order: [['createdAt', 'DESC']]
      }),
      Task.findAll({
        where: { workspaceId, contactId: contact.id },
        order: [['dueDate', 'DESC']]
      }),
      ChatNote.findAll({
        where: { workspaceId, chatId },
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Map to normalized timeline elements
    const messageEvents = messages.map(m => ({
      id: m.id,
      type: 'message',
      title: m.fromMe ? 'Outbound Message' : 'Inbound Message',
      content: m.body,
      date: m.timestamp,
      meta: {
        fromMe: m.fromMe,
        type: m.type,
        sentiment: m.sentiment,
        leadIntent: m.leadIntent,
        orderIntent: m.orderIntent
      }
    }));

    const orderEvents = orders.map(o => {
      let itemsList = [];
      try { itemsList = JSON.parse(o.items || '[]'); } catch(e){}
      const itemsSummary = itemsList.map(item => `${item.quantity}x ${item.productName}`).join(', ');
      
      return {
        id: o.id,
        type: 'order',
        title: `Sales Order (${o.status})`,
        content: itemsSummary || `Order value: ₹${o.totalValue}`,
        date: o.createdAt,
        meta: {
          status: o.status,
          totalValue: o.totalValue,
          invoiceUrl: o.invoiceUrl
        }
      };
    });

    const taskEvents = tasks.map(t => ({
      id: t.id,
      type: 'task',
      title: `Task: ${t.title}`,
      content: t.description || 'No description provided.',
      date: t.dueDate,
      meta: {
        status: t.status,
        reminderType: t.reminderType
      }
    }));

    const noteEvents = notes.map(n => ({
      id: n.id,
      type: 'note',
      title: 'Sales Rep Note',
      content: n.note,
      date: n.createdAt,
      meta: {
        userId: n.userId
      }
    }));

    // Combine and sort (Newest First)
    const timeline = [
      ...messageEvents,
      ...orderEvents,
      ...taskEvents,
      ...noteEvents
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate metrics
    const totalOrdersCount = orders.length;
    const ltv = orders.reduce((sum, o) => sum + parseFloat(o.totalValue || 0), 0);
    const aov = totalOrdersCount > 0 ? ltv / totalOrdersCount : 0;
    const lastPurchaseDate = orders.length > 0 ? orders[0].createdAt : null;

    return res.json({
      contact,
      metrics: {
        totalOrders: totalOrdersCount,
        ltv,
        aov,
        lastPurchaseDate
      },
      timeline
    });
  } catch (error) {
    console.error('getContactTimeline error:', error);
    return res.status(500).json({ error: 'Server error loading customer timeline' });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const contact = await Contact.findOne({ where: { id, workspaceId } });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    return res.json(contact);
  } catch (error) {
    console.error('getContactById error:', error);
    return res.status(500).json({ error: 'Server error retrieving contact' });
  }
};

exports.mergeContacts = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { sourceContactId, targetContactId } = req.body;

    if (!sourceContactId || !targetContactId) {
      return res.status(400).json({ error: 'sourceContactId and targetContactId are required.' });
    }

    const sourceContact = await Contact.findOne({ where: { id: sourceContactId, workspaceId } });
    const targetContact = await Contact.findOne({ where: { id: targetContactId, workspaceId } });

    if (!sourceContact || !targetContact) {
      return res.status(404).json({ error: 'One or both contacts were not found.' });
    }

    // Merge fields
    if (!targetContact.email && sourceContact.email) targetContact.email = sourceContact.email;
    if (!targetContact.address && sourceContact.address) targetContact.address = sourceContact.address;
    if (!targetContact.gstNumber && sourceContact.gstNumber) targetContact.gstNumber = sourceContact.gstNumber;
    if (!targetContact.city && sourceContact.city) targetContact.city = sourceContact.city;
    if (!targetContact.company && sourceContact.company) targetContact.company = sourceContact.company;
    if (!targetContact.birthday && sourceContact.birthday) targetContact.birthday = sourceContact.birthday;

    // Merge tags
    const targetTags = targetContact.tags ? targetContact.tags.split(',').map(t => t.trim()) : [];
    const sourceTags = sourceContact.tags ? sourceContact.tags.split(',').map(t => t.trim()) : [];
    const mergedTags = Array.from(new Set([...targetTags, ...sourceTags])).filter(Boolean).join(', ');
    targetContact.tags = mergedTags;

    // Merge purchase values
    targetContact.totalPurchaseValue = parseFloat(targetContact.totalPurchaseValue || 0) + parseFloat(sourceContact.totalPurchaseValue || 0);
    targetContact.outstandingAmount = parseFloat(targetContact.outstandingAmount || 0) + parseFloat(sourceContact.outstandingAmount || 0);

    if (sourceContact.lastPurchaseDate) {
      if (!targetContact.lastPurchaseDate || new Date(sourceContact.lastPurchaseDate) > new Date(targetContact.lastPurchaseDate)) {
        targetContact.lastPurchaseDate = sourceContact.lastPurchaseDate;
      }
    }

    await targetContact.save();

    // Re-link associated entities
    const { SalesOrder, Task, MessageLog } = require('../models');

    await SalesOrder.update(
      { customerName: targetContact.name, phone: targetContact.phone, city: targetContact.city || 'Unknown' },
      { where: { workspaceId, phone: sourceContact.phone } }
    );

    await Task.update(
      { contactId: targetContact.id },
      { where: { workspaceId, contactId: sourceContact.id } }
    );

    await MessageLog.update(
      { contactId: targetContact.id, phone: targetContact.phone },
      { where: { workspaceId, contactId: sourceContact.id } }
    );

    // Delete source contact
    await sourceContact.destroy();

    // Audit logging for contact merge
    try {
      const { AuditLog } = require('../models');
      await AuditLog.create({
        workspaceId,
        userId: req.userId || null,
        userEmail: req.userEmail || req.userName || 'Unknown User',
        action: 'CONTACT_MERGE',
        details: {
          sourceContactId,
          sourceName: sourceContact.name,
          sourcePhone: sourceContact.phone,
          targetContactId,
          targetName: targetContact.name,
          targetPhone: targetContact.phone
        }
      });
    } catch (auditErr) {
      console.error('Failed to write merge audit log:', auditErr);
    }

    return res.json({ success: true, message: 'Contacts merged successfully.', mergedContact: targetContact });
  } catch (error) {
    console.error('Merge contacts error:', error);
    return res.status(500).json({ error: 'Server error merging contacts' });
  }
};
