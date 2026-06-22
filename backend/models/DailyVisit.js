const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyVisit = sequelize.define('DailyVisit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  executiveId: {
    type: DataTypes.UUID,
    allowNull: false, // User ID (sales executive)
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false, // Contact ID visited
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Visited', 'Rescheduled', 'Cancelled'),
    defaultValue: 'Pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['workspaceId']
    }
  ]
});

module.exports = DailyVisit;
