const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutoReplyRule = sequelize.define('AutoReplyRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  keyword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mediaType: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['workspaceId', 'keyword']
    }
  ]
});

module.exports = AutoReplyRule;
