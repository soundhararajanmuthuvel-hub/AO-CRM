const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageLog = sequelize.define('MessageLog', {
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
    type: DataTypes.ENUM('Sent', 'Failed'),
    allowNull: false,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

module.exports = MessageLog;
