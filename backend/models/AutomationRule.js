const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationRule = sequelize.define('AutomationRule', {
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
  triggerType: {
    type: DataTypes.ENUM('ContactAdded', 'Birthday', 'Inactive30Days', 'Inactive60Days', 'Festival', 'NewProduct'),
    defaultValue: 'ContactAdded',
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = AutomationRule;
