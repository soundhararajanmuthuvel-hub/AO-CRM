const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // open, pending, resolved
    defaultValue: 'open',
  },
  priority: {
    type: DataTypes.STRING, // low, medium, high
    defaultValue: 'medium',
  },
  replies: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('replies');
      try {
        return rawValue ? JSON.parse(rawValue) : [];
      } catch (err) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('replies', value ? JSON.stringify(value) : '[]');
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = SupportTicket;
