const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('details');
      try {
        return rawValue ? JSON.parse(rawValue) : null;
      } catch (err) {
        return rawValue;
      }
    },
    set(value) {
      this.setDataValue('details', value ? JSON.stringify(value) : null);
    }
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
  updatedAt: false, // Audit logs are write-only, no update needed
});

module.exports = AuditLog;
