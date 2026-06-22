const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillingRecord = sequelize.define('BillingRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
  },
  paymentGateway: {
    type: DataTypes.STRING, // stripe, razorpay, manual
    defaultValue: 'stripe',
  },
  gatewayPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gatewaySubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // success, pending, failed
    defaultValue: 'pending',
  },
  planName: {
    type: DataTypes.STRING, // free, starter, pro, enterprise
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // subscription_creation, subscription_renewal, manual_upgrade
    defaultValue: 'subscription_creation',
  }
}, {
  timestamps: true,
});

module.exports = BillingRecord;
