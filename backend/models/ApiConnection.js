const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiConnection = sequelize.define('ApiConnection', {
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
  platform: {
    type: DataTypes.STRING, // Shopify, WooCommerce, Zoho, HubSpot, Salesforce, Odoo, ERPNext, QuickBooks, Custom REST APIs, Custom GraphQL APIs
    allowNull: false,
  },
  baseUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  frontendUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  backendApiUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bearerToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhookSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // Connected, Invalid API Key, URL Not Reachable, Unauthorized, Disconnected
    defaultValue: 'Disconnected',
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fieldMapping: {
    type: DataTypes.TEXT, // JSON string for custom mappings
    allowNull: true,
    defaultValue: '{}'
  },
  syncStats: {
    type: DataTypes.TEXT, // JSON string for imported counts & errors
    allowNull: true,
    defaultValue: '{"products":0,"customers":0,"orders":0,"catalogues":0,"errors":[]}'
  },
  detectedResources: {
    type: DataTypes.TEXT, // JSON string array of auto discovered items
    allowNull: true,
    defaultValue: '[]'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['workspaceId']
    }
  ]
});

module.exports = ApiConnection;
