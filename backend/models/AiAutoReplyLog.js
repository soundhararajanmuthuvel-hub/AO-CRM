const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiAutoReplyLog = sequelize.define('AiAutoReplyLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  chatId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true, // Can be null if the response was escalated (draft-only, no WhatsApp ID yet)
  },
  promptContext: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  modelOutput: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  flaggedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  escalationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'AiAutoReplyLogs'
});

module.exports = AiAutoReplyLog;
