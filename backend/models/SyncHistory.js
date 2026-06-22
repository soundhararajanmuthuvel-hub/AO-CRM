const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SyncHistory = sequelize.define('SyncHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  connectionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  syncType: {
    type: DataTypes.STRING, // 'products', 'customers', 'orders', 'catalogues'
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // 'Success', 'Failed'
    allowNull: false,
  },
  recordsImported: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  runTimeMs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
  updatedAt: false, // only record-keeping on creations
});

module.exports = SyncHistory;
