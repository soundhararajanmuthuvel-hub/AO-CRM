const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Marketing', 'Follow-Up', 'Reminder', 'Greetings'),
    defaultValue: 'Marketing',
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  targetGroup: {
    type: DataTypes.STRING, // e.g. 'Retail Customer', 'Supermarket', 'All', or tag names
    allowNull: true,
    defaultValue: 'All',
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Scheduled', 'Running', 'Completed', 'Cancelled'),
    defaultValue: 'Draft',
  },
  totalMessages: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  deliveredCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  repliedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  convertedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Campaign;
