const { Workspace, BillingRecord, User, WhatsAppSession } = require('../models');
const { Op } = require('sequelize');

exports.getCompanies = async (req, res) => {
  try {
    const systemFilter = { name: { [Op.ne]: 'InboxIQ System Workspace' } };
    const companies = await Workspace.findAll({
      where: systemFilter,
      order: [['createdAt', 'DESC']]
    });

    const formatted = await Promise.all(companies.map(async (c) => {
      const userCount = await User.count({ where: { workspaceId: c.id } });
      const whatsappCount = await WhatsAppSession.count({ where: { workspaceId: c.id } });
      
      return {
        id: c.id,
        name: c.name,
        subscriptionPlan: c.subscriptionPlan,
        users: userCount,
        whatsappAccounts: whatsappCount,
        status: c.status,
        planExpiryDate: c.planExpiryDate,
        messageUsageThisMonth: c.messageUsageThisMonth,
        messageLimit: c.messageLimit
      };
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('admin getCompanies error:', error);
    return res.status(500).json({ error: 'Server error retrieving companies list' });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const revenueSum = await BillingRecord.sum('amount', { where: { status: 'success' } });
    const totalRevenue = revenueSum ? parseFloat(revenueSum) : 0;

    // Monthly Recurring Revenue (MRR)
    const systemFilter = { name: { [Op.ne]: 'InboxIQ System Workspace' } };
    const starterCount = await Workspace.count({ where: { subscriptionPlan: 'starter', status: 'active', ...systemFilter } });
    const proCount = await Workspace.count({ where: { subscriptionPlan: 'pro', status: 'active', ...systemFilter } });
    const enterpriseCount = await Workspace.count({ where: { subscriptionPlan: 'enterprise', status: 'active', ...systemFilter } });
    const mrr = (starterCount * 29) + (proCount * 79) + (enterpriseCount * 299);

    const transactionCount = await BillingRecord.count({ where: { status: 'success' } });

    return res.json({
      totalRevenue,
      mrr,
      transactionCount
    });
  } catch (error) {
    console.error('admin getRevenue error:', error);
    return res.status(500).json({ error: 'Server error retrieving revenue stats' });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const systemFilter = { name: { [Op.ne]: 'InboxIQ System Workspace' } };
    const freeCount = await Workspace.count({ where: { subscriptionPlan: 'free', ...systemFilter } });
    const starterCount = await Workspace.count({ where: { subscriptionPlan: 'starter', ...systemFilter } });
    const proCount = await Workspace.count({ where: { subscriptionPlan: 'pro', ...systemFilter } });
    const enterpriseCount = await Workspace.count({ where: { subscriptionPlan: 'enterprise', ...systemFilter } });

    return res.json({
      free: freeCount,
      starter: starterCount,
      pro: proCount,
      enterprise: enterpriseCount
    });
  } catch (error) {
    console.error('admin getSubscriptions error:', error);
    return res.status(500).json({ error: 'Server error retrieving subscription stats' });
  }
};

exports.getUsage = async (req, res) => {
  try {
    const systemFilter = { name: { [Op.ne]: 'InboxIQ System Workspace' } };
    const companies = await Workspace.findAll({
      where: systemFilter,
      attributes: ['name', 'messageUsageThisMonth', 'messageLimit', 'subscriptionPlan'],
      order: [['messageUsageThisMonth', 'DESC']]
    });

    return res.json(companies);
  } catch (error) {
    console.error('admin getUsage error:', error);
    return res.status(500).json({ error: 'Server error retrieving usage stats' });
  }
};
