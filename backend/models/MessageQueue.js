const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageQueue = sequelize.define('MessageQueue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // Pending, Queued, Sending, Sent, Delivered, Read, Failed, Retrying, Cancelled, WaitingForConnection
    defaultValue: 'Pending',
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'whatsapp'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // 0 = standard, 1 = high
  },
  whatsappMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = MessageQueue;
