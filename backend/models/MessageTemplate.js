const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageTemplate = sequelize.define('MessageTemplate', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'document', 'video'),
    defaultValue: 'text',
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

module.exports = MessageTemplate;
