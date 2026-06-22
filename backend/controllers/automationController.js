const { AutomationRule, MessageTemplate } = require('../models');
const automationService = require('../services/automationService');

exports.getRules = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const rules = await AutomationRule.findAll({
      where: { workspaceId },
      include: [{ model: MessageTemplate }],
      order: [['name', 'ASC']]
    });
    return res.json(rules);
  } catch (error) {
    console.error('Get rules error:', error);
    return res.status(500).json({ error: 'Server error retrieving automation rules' });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { isActive, templateId } = req.body;

    const rule = await AutomationRule.findOne({ where: { id, workspaceId } });
    if (!rule) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }

    if (isActive !== undefined) rule.isActive = isActive;
    if (templateId !== undefined) {
      if (templateId) {
        // Validate template exists in workspace
        const template = await MessageTemplate.findOne({ where: { id: templateId, workspaceId } });
        if (!template) {
          return res.status(404).json({ error: 'Selected template not found' });
        }
        rule.templateId = templateId;
      } else {
        rule.templateId = null;
      }
    }

    await rule.save();
    
    // Fetch fresh with relations
    const updatedRule = await AutomationRule.findByPk(rule.id, {
      include: [{ model: MessageTemplate }]
    });

    return res.json(updatedRule);
  } catch (error) {
    console.error('Update rule error:', error);
    return res.status(500).json({ error: 'Server error updating automation rule' });
  }
};

exports.triggerSimulation = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    await automationService.runSimulationNow(workspaceId);
    return res.json({ message: 'Automation rules checks processed successfully. Messages queued where applicable.' });
  } catch (error) {
    console.error('Simulate rule error:', error);
    return res.status(500).json({ error: 'Server error triggering rules simulation' });
  }
};
