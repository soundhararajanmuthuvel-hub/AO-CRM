const { MessageTemplate } = require('../models');

exports.getTemplates = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const templates = await MessageTemplate.findAll({
      where: { workspaceId },
      order: [['name', 'ASC']]
    });
    return res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    return res.status(500).json({ error: 'Server error fetching templates' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, content, type } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    let fileUrl = null;
    let fileType = null;

    if (req.file) {
      // Save local path, e.g. /uploads/filename
      fileUrl = `/uploads/${req.file.filename}`;
      fileType = req.file.mimetype;
    }

    const template = await MessageTemplate.create({
      workspaceId,
      name,
      content,
      type: type || 'text',
      fileUrl,
      fileType
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    return res.status(500).json({ error: 'Server error creating template' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { name, content, type } = req.body;

    const template = await MessageTemplate.findOne({ where: { id, workspaceId } });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (name) template.name = name;
    if (content) template.content = content;
    if (type) template.type = type;

    if (req.file) {
      template.fileUrl = `/uploads/${req.file.filename}`;
      template.fileType = req.file.mimetype;
    }

    await template.save();
    return res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    return res.status(500).json({ error: 'Server error updating template' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const deleted = await MessageTemplate.destroy({ where: { id, workspaceId } });
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({ error: 'Server error deleting template' });
  }
};
