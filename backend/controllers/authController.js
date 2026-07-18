const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Workspace } = require('../models');

const generateAPIKeys = () => {
  const apiKey = 'wf_live_' + crypto.randomBytes(16).toString('hex');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    { expiresIn: '30d' }
  );
};

exports.signup = async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create Workspace first
    const { apiKey, apiSecret } = generateAPIKeys();
    const workspace = await Workspace.create({
      name: companyName,
      apiKey,
      apiSecret
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User as Owner
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'owner',
      workspaceId: workspace.id,
    });

    // Create default WhatsApp Session and Automation Rules for the workspace
    const { WhatsAppSession, AutomationRule } = require('../models');
    await WhatsAppSession.create({ workspaceId: workspace.id });
    await AutomationRule.bulkCreate([
      { workspaceId: workspace.id, name: 'Birthday Greetings', triggerType: 'Birthday', isActive: false },
      { workspaceId: workspace.id, name: 'Inactive 30 Days', triggerType: 'Inactive30Days', isActive: false },
      { workspaceId: workspace.id, name: 'Inactive 60 Days', triggerType: 'Inactive60Days', isActive: false },
      { workspaceId: workspace.id, name: 'New Contact Welcome', triggerType: 'ContactAdded', isActive: false },
    ]);

    const token = generateToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        subscriptionPlan: workspace.subscriptionPlan,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Server error during signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Workspace }]
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      workspace: user.Workspace
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, name } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({ error: 'Google authentication details are incomplete' });
    }

    // Try finding by googleId or email
    let user = await User.findOne({
      where: { email },
      include: [{ model: Workspace }]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new tenant and user
      const { apiKey, apiSecret } = generateAPIKeys();
      const workspace = await Workspace.create({
        name: `${name}'s Workspace`,
        apiKey,
        apiSecret
      });
      user = await User.create({
        name,
        email,
        googleId,
        role: 'owner',
        workspaceId: workspace.id,
      });

      // Create defaults
      const { WhatsAppSession, AutomationRule } = require('../models');
      await WhatsAppSession.create({ workspaceId: workspace.id });
      await AutomationRule.bulkCreate([
        { workspaceId: workspace.id, name: 'Birthday Greetings', triggerType: 'Birthday', isActive: false },
        { workspaceId: workspace.id, name: 'Inactive 30 Days', triggerType: 'Inactive30Days', isActive: false },
        { workspaceId: workspace.id, name: 'Inactive 60 Days', triggerType: 'Inactive60Days', isActive: false },
        { workspaceId: workspace.id, name: 'New Contact Welcome', triggerType: 'ContactAdded', isActive: false },
      ]);

      user = await User.findByPk(user.id, { include: [{ model: Workspace }] });
    }

    const token = generateToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      workspace: user.Workspace
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Server error during Google auth' });
  }
};

exports.getMe = async (req, res) => {
  try {
    return res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        workspaceId: req.user.workspaceId,
      },
      workspace: req.user.Workspace
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getWorkspaceUsers = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const users = await User.findAll({
      where: { workspaceId },
      attributes: ['id', 'name', 'email', 'role']
    });
    return res.json(users);
  } catch (error) {
    console.error('getWorkspaceUsers error:', error);
    return res.status(500).json({ error: 'Server error listing team members' });
  }
};

exports.updateWorkspace = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { 
      name, logoUrl, faviconUrl, customDomain, 
      brandColorPrimary, brandColorSecondary, webhookUrl,
      broadcastDailyCap, broadcastMinDelay, broadcastMaxDelay,
      aiAutoReplyEnabled, aiConfidenceThreshold, aiSystemPrompt
    } = req.body;

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient workspace permissions' });
    }

    if (name) workspace.name = name;
    if (logoUrl !== undefined) workspace.logoUrl = logoUrl;
    if (faviconUrl !== undefined) workspace.faviconUrl = faviconUrl;
    if (customDomain !== undefined) workspace.customDomain = customDomain;
    if (brandColorPrimary !== undefined) workspace.brandColorPrimary = brandColorPrimary;
    if (brandColorSecondary !== undefined) workspace.brandColorSecondary = brandColorSecondary;
    if (webhookUrl !== undefined) workspace.webhookUrl = webhookUrl;
    
    // Broadcast & AI Settings
    if (broadcastDailyCap !== undefined) workspace.broadcastDailyCap = parseInt(broadcastDailyCap, 10);
    if (broadcastMinDelay !== undefined) workspace.broadcastMinDelay = parseInt(broadcastMinDelay, 10);
    if (broadcastMaxDelay !== undefined) workspace.broadcastMaxDelay = parseInt(broadcastMaxDelay, 10);
    if (aiAutoReplyEnabled !== undefined) workspace.aiAutoReplyEnabled = !!aiAutoReplyEnabled;
    if (aiConfidenceThreshold !== undefined) workspace.aiConfidenceThreshold = parseFloat(aiConfidenceThreshold);
    if (aiSystemPrompt !== undefined) workspace.aiSystemPrompt = aiSystemPrompt;

    await workspace.save();

    return res.json(workspace);
  } catch (error) {
    console.error('updateWorkspace error:', error);
    return res.status(500).json({ error: 'Server error updating workspace settings' });
  }
};

exports.rotateWorkspaceApiKeys = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient workspace permissions' });
    }

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const { apiKey, apiSecret } = generateAPIKeys();
    workspace.apiKey = apiKey;
    workspace.apiSecret = apiSecret;
    await workspace.save();

    return res.json({
      message: 'API keys rotated successfully',
      apiKey: workspace.apiKey,
      apiSecret: workspace.apiSecret
    });
  } catch (error) {
    console.error('rotateWorkspaceApiKeys error:', error);
    return res.status(500).json({ error: 'Server error rotating API keys' });
  }
};

exports.logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
};

exports.refresh = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = generateToken(userId);
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Server error refreshing token' });
  }
};

