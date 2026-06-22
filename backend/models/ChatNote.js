const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatNote = sequelize.define('ChatNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  chatId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  timestamps: true
});

module.exports = ChatNote;
