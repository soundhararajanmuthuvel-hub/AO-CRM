const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  connectionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  receivedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  source: {
    type: DataTypes.STRING, // e.g. "Shopify / order.created"
    allowNull: false,
  },
  payload: {
    type: DataTypes.TEXT, // Store raw JSON payload as string
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // "Success", "Failed", "Processing"
    allowNull: false,
    defaultValue: 'Processing',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
  updatedAt: true,
});

module.exports = WebhookLog;
