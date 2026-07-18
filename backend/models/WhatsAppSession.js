const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppSession = sequelize.define('WhatsAppSession', {
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
    defaultValue: 'Primary Connection',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Disconnected',
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sessionData: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reconnectAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  syncStats: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'sync_stats'
  },
}, {
  timestamps: true,
});

module.exports = WhatsAppSession;
