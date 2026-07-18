const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
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
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gst_number'
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tags: {
    type: DataTypes.TEXT, // Comma separated or stringified JSON array
    allowNull: true,
    defaultValue: '',
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  totalPurchaseValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  lastPurchaseDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  leadSource: {
    type: DataTypes.STRING, // 'WhatsApp', 'Website', 'Facebook', 'Instagram', 'Manual Entry'
    defaultValue: 'Manual Entry',
  },
  leadStage: {
    type: DataTypes.STRING, // 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'
    defaultValue: 'New',
  },
  leadScore: {
    type: DataTypes.STRING, // 'Hot', 'Warm', 'Cold'
    defaultValue: 'Cold',
  },
  conversionProbability: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  outstandingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  healthScore: {
    type: DataTypes.STRING, // 'Active', 'At Risk', 'Inactive'
    defaultValue: 'Active',
  },
  isOptedOut: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_opted_out'
  },
  lastInboundMessageTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_inbound_message_time'
  },
  isSynced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_synced'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['workspaceId', 'phone'],
    }
  ]
});

module.exports = Contact;
