const { Workspace } = require('../models');

exports.getBillingInfo = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    return res.json({
      plan: workspace.subscriptionPlan,
      messageUsage: workspace.messageUsageThisMonth,
      messageLimit: workspace.messageLimit,
      stripeCustomerId: workspace.stripeCustomerId
    });
  } catch (error) {
    console.error('Get billing info error:', error);
    return res.status(500).json({ error: 'Server error retrieving billing details' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { plan } = req.body;

    const allowedPlans = ['starter', 'pro', 'enterprise'];
    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan selected' });
    }

    // Determine limits
    let limit = 1000;
    if (plan === 'starter') limit = 10000;
    if (plan === 'pro') limit = 50000;
    if (plan === 'enterprise') limit = 1000000;

    // Simulate checkout session redirect URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/dashboard/settings?session_id=mock_session_${Date.now()}&plan=${plan}&limit=${limit}`;

    return res.json({ checkoutUrl: redirectUrl });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ error: 'Server error creating payment gateway session' });
  }
};

exports.mockUpgradeWorkspace = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { plan, limit } = req.body;

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    workspace.subscriptionPlan = plan;
    workspace.messageLimit = parseInt(limit);
    workspace.messageUsageThisMonth = 0; // Reset usage upon upgrade
    await workspace.save();

    return res.json({
      message: `Workspace upgraded to ${plan} successfully!`,
      plan: workspace.subscriptionPlan,
      messageLimit: workspace.messageLimit,
      messageUsage: workspace.messageUsageThisMonth
    });
  } catch (error) {
    console.error('Mock upgrade error:', error);
    return res.status(500).json({ error: 'Server error during plan upgrade' });
  }
};
