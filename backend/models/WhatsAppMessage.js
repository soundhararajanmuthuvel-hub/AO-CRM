const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppMessage = sequelize.define('WhatsAppMessage', {
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
    allowNull: false,
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fromMe: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'chat',
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hasMedia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isUnread: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // AI classification
  leadIntent: {
    type: DataTypes.ENUM('Interested', 'Price Enquiry', 'Product Enquiry', 'Repeat Customer', 'Hot Lead', 'Not Interested', 'None'),
    defaultValue: 'None',
  },
  orderIntent: {
    type: DataTypes.ENUM('New Order', 'Order Confirmation', 'Order Modification', 'Payment Sent', 'Dispatch Enquiry', 'None'),
    defaultValue: 'None',
  },
  sentiment: {
    type: DataTypes.ENUM('Positive', 'Neutral', 'Negative', 'None'),
    defaultValue: 'None',
  },
  suggestedReply: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed', 'pending'),
    defaultValue: 'sent',
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'contact_id'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['workspaceId', 'messageId']
    }
  ]
});

module.exports = WhatsAppMessage;
