const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppChat = sequelize.define('WhatsAppChat', {
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
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastMessageTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  salesStatus: {
    type: DataTypes.ENUM('All', 'Unread', 'Leads', 'Orders', 'Follow-up', 'Support', 'General'),
    defaultValue: 'General',
  },
  customerStatus: {
    type: DataTypes.STRING,
    defaultValue: 'New',
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profilePicUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['workspaceId', 'chatId']
    }
  ]
});

module.exports = WhatsAppChat;
