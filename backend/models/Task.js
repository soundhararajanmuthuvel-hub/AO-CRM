const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Overdue'),
    defaultValue: 'Pending',
  },
  reminderType: {
    type: DataTypes.ENUM('WhatsApp', 'Email', 'CRM Notification', 'None'),
    defaultValue: 'CRM Notification',
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true, // User ID assigned to task
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['workspaceId']
    }
  ]
});

module.exports = Task;
