const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  subscriptionPlan: {
    type: DataTypes.STRING,
    defaultValue: 'free',
  },
  messageUsageThisMonth: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  messageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  contactLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  leadLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  whatsappLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  storageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 100, // 100 MB
  },
  planExpiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // active, suspended, trial, expired
    defaultValue: 'active',
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  faviconUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customDomain: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brandColorPrimary: {
    type: DataTypes.STRING,
    defaultValue: '#25D366',
  },
  brandColorSecondary: {
    type: DataTypes.STRING,
    defaultValue: '#128C7E',
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  apiSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  broadcastDailyCap: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    field: 'broadcast_daily_cap'
  },
  broadcastMinDelay: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    field: 'broadcast_min_delay'
  },
  broadcastMaxDelay: {
    type: DataTypes.INTEGER,
    defaultValue: 8,
    field: 'broadcast_max_delay'
  },
  aiAutoReplyEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'ai_auto_reply_enabled'
  },
  aiConfidenceThreshold: {
    type: DataTypes.FLOAT,
    defaultValue: 0.7,
    field: 'ai_confidence_threshold'
  },
  aiSystemPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_system_prompt'
  }
}, {
  timestamps: true,
});

module.exports = Workspace;
