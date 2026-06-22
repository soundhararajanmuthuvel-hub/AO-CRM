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
    type: DataTypes.ENUM('Initializing', 'QR Ready', 'Authenticating', 'Connected', 'Disconnected', 'Reconnecting', 'READY'),
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
}, {
  timestamps: true,
});

module.exports = WhatsAppSession;
