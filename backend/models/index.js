const sequelize = require('../config/database');
const Workspace = require('./Workspace');
const User = require('./User');
const Contact = require('./Contact');
const WhatsAppSession = require('./WhatsAppSession');
const MessageTemplate = require('./MessageTemplate');
const Campaign = require('./Campaign');
const MessageQueue = require('./MessageQueue');
const MessageLog = require('./MessageLog');
const AutomationRule = require('./AutomationRule');
const WhatsAppChat = require('./WhatsAppChat');
const WhatsAppMessage = require('./WhatsAppMessage');
const ChatNote = require('./ChatNote');
const SalesOrder = require('./SalesOrder');
const AutoReplyRule = require('./AutoReplyRule');
const AuditLog = require('./AuditLog');
const SupportTicket = require('./SupportTicket');
const SystemSetting = require('./SystemSetting');
const BillingRecord = require('./BillingRecord');
const Product = require('./Product');
const Task = require('./Task');
const Territory = require('./Territory');
const Route = require('./Route');
const DailyVisit = require('./DailyVisit');
const ApiConnection = require('./ApiConnection');
const SyncHistory = require('./SyncHistory');
const WebhookLog = require('./WebhookLog');

// Associations

// Workspace Connections
Workspace.hasMany(User, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
User.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Contact, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Contact.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(WhatsAppSession, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
WhatsAppSession.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(MessageTemplate, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
MessageTemplate.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Campaign, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Campaign.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(MessageQueue, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
MessageQueue.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(MessageLog, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
MessageLog.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(AutomationRule, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
AutomationRule.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Product, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Product.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Task, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Task.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Territory, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Territory.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Route, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Route.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(DailyVisit, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
DailyVisit.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(ApiConnection, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ApiConnection.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(SyncHistory, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
SyncHistory.belongsTo(Workspace, { foreignKey: 'workspaceId' });

ApiConnection.hasMany(SyncHistory, { foreignKey: 'connectionId', onDelete: 'CASCADE' });
SyncHistory.belongsTo(ApiConnection, { foreignKey: 'connectionId' });

Workspace.hasMany(WebhookLog, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
WebhookLog.belongsTo(Workspace, { foreignKey: 'workspaceId' });

ApiConnection.hasMany(WebhookLog, { foreignKey: 'connectionId', onDelete: 'CASCADE' });
WebhookLog.belongsTo(ApiConnection, { foreignKey: 'connectionId' });

// Template Associations
MessageTemplate.hasMany(Campaign, { foreignKey: 'templateId', onDelete: 'SET NULL' });
Campaign.belongsTo(MessageTemplate, { foreignKey: 'templateId' });

MessageTemplate.hasMany(AutomationRule, { foreignKey: 'templateId', onDelete: 'SET NULL' });
AutomationRule.belongsTo(MessageTemplate, { foreignKey: 'templateId' });

// Campaign Associations
Campaign.hasMany(MessageQueue, { foreignKey: 'campaignId', onDelete: 'SET NULL' });
MessageQueue.belongsTo(Campaign, { foreignKey: 'campaignId' });

Campaign.hasMany(MessageLog, { foreignKey: 'campaignId', onDelete: 'SET NULL' });
MessageLog.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Contact Associations
Contact.hasMany(MessageQueue, { foreignKey: 'contactId', onDelete: 'SET NULL' });
MessageQueue.belongsTo(Contact, { foreignKey: 'contactId' });

Contact.hasMany(MessageLog, { foreignKey: 'contactId', onDelete: 'SET NULL' });
MessageLog.belongsTo(Contact, { foreignKey: 'contactId' });

Contact.hasMany(Task, { foreignKey: 'contactId', onDelete: 'CASCADE' });
Task.belongsTo(Contact, { foreignKey: 'contactId' });

Contact.hasMany(DailyVisit, { foreignKey: 'contactId', onDelete: 'CASCADE' });
DailyVisit.belongsTo(Contact, { foreignKey: 'contactId' });

// Task User assignment
User.hasMany(Task, { foreignKey: 'assignedTo', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'assignedTo' });

// Sales Route / Visit Associations
Territory.hasMany(Route, { foreignKey: 'territoryId', onDelete: 'CASCADE' });
Route.belongsTo(Territory, { foreignKey: 'territoryId' });

User.hasMany(DailyVisit, { foreignKey: 'executiveId', onDelete: 'CASCADE' });
DailyVisit.belongsTo(User, { foreignKey: 'executiveId' });

// Synced WhatsApp Chats & Messages Workspace Connections
Workspace.hasMany(WhatsAppChat, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
WhatsAppChat.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(WhatsAppMessage, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
WhatsAppMessage.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(ChatNote, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ChatNote.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(SalesOrder, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
SalesOrder.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(AutoReplyRule, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
AutoReplyRule.belongsTo(Workspace, { foreignKey: 'workspaceId' });

// Chat Messages & Notes Associations
WhatsAppChat.hasMany(WhatsAppMessage, { foreignKey: 'chatId', sourceKey: 'chatId', onDelete: 'CASCADE', constraints: false });
WhatsAppMessage.belongsTo(WhatsAppChat, { foreignKey: 'chatId', targetKey: 'chatId', constraints: false });

WhatsAppChat.hasMany(ChatNote, { foreignKey: 'chatId', sourceKey: 'chatId', onDelete: 'CASCADE', constraints: false });
ChatNote.belongsTo(WhatsAppChat, { foreignKey: 'chatId', targetKey: 'chatId', constraints: false });

User.hasMany(ChatNote, { foreignKey: 'userId', onDelete: 'CASCADE' });
ChatNote.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(WhatsAppChat, { foreignKey: 'assignedTo', as: 'AssignedChats', onDelete: 'SET NULL' });
WhatsAppChat.belongsTo(User, { foreignKey: 'assignedTo', as: 'Assignee' });

// Super Admin & Tenancy Associations
Workspace.hasMany(BillingRecord, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
BillingRecord.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(SupportTicket, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
SupportTicket.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(AuditLog, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
AuditLog.belongsTo(Workspace, { foreignKey: 'workspaceId' });

User.hasMany(SupportTicket, { foreignKey: 'userId', onDelete: 'CASCADE' });
SupportTicket.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Workspace,
  User,
  Contact,
  WhatsAppSession,
  MessageTemplate,
  Campaign,
  MessageQueue,
  MessageLog,
  AutomationRule,
  WhatsAppChat,
  WhatsAppMessage,
  ChatNote,
  SalesOrder,
  AutoReplyRule,
  AuditLog,
  SupportTicket,
  SystemSetting,
  BillingRecord,
  Product,
  Task,
  Territory,
  Route,
  DailyVisit,
  ApiConnection,
  SyncHistory,
  WebhookLog
};
