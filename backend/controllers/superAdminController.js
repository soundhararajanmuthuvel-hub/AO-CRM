const { 
  Workspace, 
  User, 
  Contact, 
  SalesOrder, 
  WhatsAppSession, 
  BillingRecord, 
  SupportTicket, 
  SystemSetting, 
  AuditLog,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    { expiresIn: '30d' }
  );
};

// 1. Dashboard Analytics & Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Exclude system workspace
    const systemFilter = { name: { [Op.ne]: 'InboxIQ System Workspace' } };

    const totalCompanies = await Workspace.count({ where: systemFilter });
    const activeCompanies = await Workspace.count({ where: { status: 'active', ...systemFilter } });
    const trialCompanies = await Workspace.count({ where: { status: 'trial', ...systemFilter } });
    const expiredCompanies = await Workspace.count({ where: { status: 'expired', ...systemFilter } });
    const suspendedCompanies = await Workspace.count({ where: { status: 'suspended', ...systemFilter } });

    const totalUsers = await User.count();
    const totalWhatsAppAccounts = await WhatsAppSession.count();
    const totalLeads = await Contact.count();
    const totalOrders = await SalesOrder.count();

    // Calculate revenue
    const revenueSum = await BillingRecord.sum('amount', { where: { status: 'success' } });
    const totalRevenue = revenueSum ? parseFloat(revenueSum) : 0;

    // Monthly Recurring Revenue (MRR) - derived from active plan counts
    const starterCount = await Workspace.count({ where: { subscriptionPlan: 'starter', status: 'active' } });
    const proCount = await Workspace.count({ where: { subscriptionPlan: 'pro', status: 'active' } });
    const enterpriseCount = await Workspace.count({ where: { subscriptionPlan: 'enterprise', status: 'active' } });
    
    // Values: starter ($29), pro ($79), enterprise ($299)
    const mrr = (starterCount * 29) + (proCount * 79) + (enterpriseCount * 299);

    // New signups today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newSignupsToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfToday
        }
      }
    });

    // Charts Datasets (Mocked/Aggregated)
    const companyGrowth = [
      { month: 'Jan', count: 5 },
      { month: 'Feb', count: 12 },
      { month: 'Mar', count: 24 },
      { month: 'Apr', count: 42 },
      { month: 'May', count: 78 },
      { month: 'Jun', count: totalCompanies }
    ];

    const revenueGrowth = [
      { month: 'Jan', amount: 500 },
      { month: 'Feb', amount: 1500 },
      { month: 'Mar', amount: 3200 },
      { month: 'Apr', amount: 6500 },
      { month: 'May', amount: 12400 },
      { month: 'Jun', amount: totalRevenue }
    ];

    const messageUsage = [
      { name: 'Amudhasurabiy Organics', sent: 1240, limit: 5000 },
      { name: 'Vrindavan Distributors', sent: 24500, limit: 50000 },
      { name: 'Organic Honey Hub', sent: 340, limit: 1000 },
    ];

    const subscriptionTrends = [
      { name: 'Free', value: await Workspace.count({ where: { subscriptionPlan: 'free', ...systemFilter } }) },
      { name: 'Starter', value: starterCount },
      { name: 'Professional', value: proCount },
      { name: 'Enterprise', value: enterpriseCount }
    ];

    return res.json({
      stats: {
        totalCompanies,
        activeCompanies,
        trialCompanies,
        expiredCompanies,
        suspendedCompanies,
        totalUsers,
        totalWhatsAppAccounts,
        totalLeads,
        totalOrders,
        totalRevenue,
        mrr,
        newSignupsToday
      },
      charts: {
        companyGrowth,
        revenueGrowth,
        messageUsage,
        subscriptionTrends
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ error: 'Server error loading analytics' });
  }
};

// 2. Company Management list
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Workspace.findAll({
      where: { name: { [Op.ne]: 'InboxIQ System Workspace' } },
      include: [{
        model: User,
        where: { role: 'owner' },
        required: false,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = await Promise.all(companies.map(async (c) => {
      const userCount = await User.count({ where: { workspaceId: c.id } });
      const whatsappCount = await WhatsAppSession.count({ where: { workspaceId: c.id } });
      const owner = c.Users && c.Users[0] ? c.Users[0] : { name: 'N/A', email: 'N/A' };
      
      return {
        id: c.id,
        name: c.name,
        ownerName: owner.name,
        email: owner.email,
        subscriptionPlan: c.subscriptionPlan,
        users: userCount,
        whatsappAccounts: whatsappCount,
        status: c.status,
        planExpiryDate: c.planExpiryDate,
        userLimit: c.userLimit,
        contactLimit: c.contactLimit,
        leadLimit: c.leadLimit,
        whatsappLimit: c.whatsappLimit,
        storageLimit: c.storageLimit,
        customDomain: c.customDomain,
        brandColorPrimary: c.brandColorPrimary,
        brandColorSecondary: c.brandColorSecondary
      };
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getCompanies error:', error);
    return res.status(500).json({ error: 'Server error listing companies' });
  }
};

// 3. Update Company status or details
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      subscriptionPlan, 
      status, 
      userLimit, 
      contactLimit, 
      leadLimit, 
      whatsappLimit, 
      storageLimit,
      planExpiryDate,
      customDomain
    } = req.body;

    const company = await Workspace.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (name) company.name = name;
    if (subscriptionPlan) company.subscriptionPlan = subscriptionPlan;
    if (status) company.status = status;
    if (userLimit !== undefined) company.userLimit = userLimit;
    if (contactLimit !== undefined) company.contactLimit = contactLimit;
    if (leadLimit !== undefined) company.leadLimit = leadLimit;
    if (whatsappLimit !== undefined) company.whatsappLimit = whatsappLimit;
    if (storageLimit !== undefined) company.storageLimit = storageLimit;
    if (planExpiryDate) company.planExpiryDate = planExpiryDate;
    if (customDomain !== undefined) company.customDomain = customDomain;

    await company.save();

    // Log this action
    await AuditLog.create({
      workspaceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'SUBSCRIPTION_CHANGE',
      details: { companyName: company.name, plan: company.subscriptionPlan, status: company.status }
    });

    return res.json(company);
  } catch (error) {
    console.error('updateCompany error:', error);
    return res.status(500).json({ error: 'Server error updating company' });
  }
};

// 4. Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Workspace.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const companyName = company.name;
    await company.destroy();

    // Log this action
    await AuditLog.create({
      workspaceId: null,
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'COMPANY_DELETION',
      details: { companyName }
    });

    return res.json({ message: 'Company successfully deleted' });
  } catch (error) {
    console.error('deleteCompany error:', error);
    return res.status(500).json({ error: 'Server error deleting company' });
  }
};

// 5. Login As Company (Impersonate)
exports.impersonateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Workspace.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find company owner
    const owner = await User.findOne({
      where: { workspaceId: id, role: 'owner' }
    });

    if (!owner) {
      return res.status(400).json({ error: 'No owner found for this company to impersonate' });
    }

    const token = generateToken(owner.id);

    // Log this impersonation activity
    await AuditLog.create({
      workspaceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'IMPERSONATE_LOGIN',
      details: { targetCompany: company.name, ownerEmail: owner.email }
    });

    return res.json({
      token,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        workspaceId: owner.workspaceId,
      },
      workspace: company
    });
  } catch (error) {
    console.error('impersonateCompany error:', error);
    return res.status(500).json({ error: 'Server error during impersonation' });
  }
};

// 6. Billing logs retrieval
exports.getBillingRecords = async (req, res) => {
  try {
    const records = await BillingRecord.findAll({
      include: [{ model: Workspace, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = records.map(r => ({
      id: r.id,
      workspaceName: r.Workspace ? r.Workspace.name : 'N/A',
      amount: r.amount,
      currency: r.currency,
      paymentGateway: r.paymentGateway,
      gatewayPaymentId: r.gatewayPaymentId,
      status: r.status,
      planName: r.planName,
      type: r.type,
      createdAt: r.createdAt
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getBillingRecords error:', error);
    return res.status(500).json({ error: 'Server error loading transactions history' });
  }
};

// 7. WhatsApp sessions status monitoring
exports.getWhatsAppMonitoring = async (req, res) => {
  try {
    const sessions = await WhatsAppSession.findAll({
      include: [{ model: Workspace, attributes: ['name'] }],
      order: [['updatedAt', 'DESC']]
    });

    const formatted = sessions.map(s => ({
      id: s.id,
      workspaceName: s.Workspace ? s.Workspace.name : 'N/A',
      status: s.status || 'Disconnected',
      phoneNumber: s.phoneNumber || 'N/A',
      updatedAt: s.updatedAt
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getWhatsAppMonitoring error:', error);
    return res.status(500).json({ error: 'Server error loading WhatsApp diagnostics' });
  }
};

// 8. Support Tickets retrieval
exports.getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      include: [{ model: Workspace, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = tickets.map(t => ({
      id: t.id,
      workspaceName: t.Workspace ? t.Workspace.name : 'N/A',
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      replies: t.replies,
      createdAt: t.createdAt,
      resolvedAt: t.resolvedAt
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getSupportTickets error:', error);
    return res.status(500).json({ error: 'Server error listing tickets' });
  }
};

// 9. Reply Support Ticket
exports.replySupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, closeTicket } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    const currentReplies = ticket.replies;
    currentReplies.push({
      sender: 'Super Admin',
      message,
      time: new Date()
    });

    ticket.replies = currentReplies;
    if (closeTicket) {
      ticket.status = 'resolved';
      ticket.resolvedAt = new Date();
    } else {
      ticket.status = 'pending';
    }

    await ticket.save();

    return res.json(ticket);
  } catch (error) {
    console.error('replySupportTicket error:', error);
    return res.status(500).json({ error: 'Server error replying to support ticket' });
  }
};

// 10. System Settings list
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    return res.json(settings);
  } catch (error) {
    console.error('getSystemSettings error:', error);
    return res.status(500).json({ error: 'Server error loading settings' });
  }
};

// 11. System Settings update
exports.updateSystemSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    let setting = await SystemSetting.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      await setting.save();
    } else {
      setting = await SystemSetting.create({ key, value });
    }

    // Log this action
    await AuditLog.create({
      workspaceId: null,
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'SYSTEM_SETTINGS_CHANGE',
      details: { key, updated: true }
    });

    return res.json(setting);
  } catch (error) {
    console.error('updateSystemSettings error:', error);
    return res.status(500).json({ error: 'Server error updating system parameters' });
  }
};

// 12. Audit Logs listing
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    return res.json(logs);
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: 'Server error listing audit logs' });
  }
};
