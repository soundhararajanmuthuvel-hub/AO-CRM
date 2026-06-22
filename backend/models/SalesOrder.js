const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesOrder = sequelize.define('SalesOrder', {
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
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Draft',
  },
  invoiceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliverySlipUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  items: {
    type: DataTypes.TEXT, // Stringified JSON array of items: [{productName, quantity, price, unit}]
    allowNull: true,
  },
  timeline: {
    type: DataTypes.TEXT, // Stringified JSON array of timeline status updates: [{status, timestamp, user}]
    allowNull: true,
  }
}, {
  timestamps: true
});

module.exports = SalesOrder;
