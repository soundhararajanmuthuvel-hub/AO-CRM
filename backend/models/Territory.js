const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Territory = sequelize.define('Territory', {
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
  code: {
    type: DataTypes.STRING,
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

module.exports = Territory;
