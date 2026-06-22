const { AutoReplyRule } = require('../models');

exports.getRules = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const rules = await AutoReplyRule.findAll({
      where: { workspaceId },
      order: [['keyword', 'ASC']]
    });
    return res.json(rules);
  } catch (error) {
    console.error('getRules error:', error);
    return res.status(500).json({ error: 'Server error retrieving auto-reply rules' });
  }
};

exports.createRule = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { keyword, response, mediaUrl, mediaType } = req.body;

    if (!keyword || !response) {
      return res.status(400).json({ error: 'Keyword and response details are required' });
    }

    const cleanKeyword = keyword.trim().toLowerCase();

    // Check if rule already exists for this keyword
    const existing = await AutoReplyRule.findOne({ where: { workspaceId, keyword: cleanKeyword } });
    if (existing) {
      return res.status(400).json({ error: 'A rule already exists for this keyword' });
    }

    const rule = await AutoReplyRule.create({
      workspaceId,
      keyword: cleanKeyword,
      response,
      mediaUrl,
      mediaType
    });

    return res.json({ success: true, rule });
  } catch (error) {
    console.error('createRule error:', error);
    return res.status(500).json({ error: 'Server error creating auto-reply rule' });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { ruleId } = req.params;
    const { response, mediaUrl, mediaType } = req.body;

    const rule = await AutoReplyRule.findOne({ where: { id: ruleId, workspaceId } });
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    rule.response = response;
    if (mediaUrl !== undefined) rule.mediaUrl = mediaUrl;
    if (mediaType !== undefined) rule.mediaType = mediaType;
    
    await rule.save();

    return res.json({ success: true, rule });
  } catch (error) {
    console.error('updateRule error:', error);
    return res.status(500).json({ error: 'Server error updating auto-reply rule' });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { ruleId } = req.params;

    const rule = await AutoReplyRule.findOne({ where: { id: ruleId, workspaceId } });
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await rule.destroy();
    return res.json({ success: true, message: 'Auto-reply rule deleted successfully.' });
  } catch (error) {
    console.error('deleteRule error:', error);
    return res.status(500).json({ error: 'Server error deleting auto-reply rule' });
  }
};

// Auto catalog uploader mapping
exports.uploadCatalogue = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No catalog file provided' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const cleanKeyword = 'catalogue';

    let [rule, created] = await AutoReplyRule.findOrCreate({
      where: { workspaceId, keyword: cleanKeyword },
      defaults: {
        response: 'Please find our catalogue attached below.',
        mediaUrl: fileUrl,
        mediaType: 'application/pdf'
      }
    });

    if (!created) {
      rule.mediaUrl = fileUrl;
      rule.mediaType = 'application/pdf';
      await rule.save();
    }

    return res.json({
      success: true,
      message: 'Catalog uploader mapped to rule trigger "catalogue" successfully.',
      rule
    });

  } catch (error) {
    console.error('uploadCatalogue error:', error);
    return res.status(500).json({ error: 'Server error uploading catalog file' });
  }
};
