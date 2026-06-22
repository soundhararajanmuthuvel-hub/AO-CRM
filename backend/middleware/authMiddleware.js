const jwt = require('jsonwebtoken');
const { User, Workspace } = require('../models');

const protect = async (req, res, next) => {
  // Check for API key and API secret first
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const apiSecret = req.headers['x-api-secret'] || req.query.api_secret;

  if (apiKey && apiSecret) {
    try {
      const workspace = await Workspace.findOne({
        where: { apiKey, apiSecret }
      });

      if (!workspace) {
        return res.status(401).json({ error: 'Not authorized, invalid API Key or Secret' });
      }

      req.workspaceId = workspace.id;
      req.workspace = workspace;
      req.user = {
        id: 'api-client-user-id',
        name: 'API Client',
        email: 'api@whatsflow.com',
        role: 'admin',
        workspaceId: workspace.id,
        Workspace: workspace
      };
      req.userName = 'API Client';
      return next();
    } catch (error) {
      console.error('API key auth error:', error);
      return res.status(500).json({ error: 'Server error during API authentication' });
    }
  }

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');

      const user = await User.findByPk(decoded.id, {
        include: [{ model: Workspace }]
      });

      if (!user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      req.user = user;
      req.workspaceId = user.workspaceId;
      req.userName = user.name;
      return next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided or invalid credentials' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  protect,
  requireRole
};
