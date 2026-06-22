const { sequelize, Contact, WhatsAppChat, WhatsAppMessage, ChatNote, SalesOrder } = require('./models');

const clearMockData = async () => {
  try {
    console.log('[Cleanup] Starting database purge of seeded mock data...');
    
    // Disable SQLite foreign key checks during cleanup
    await sequelize.query('PRAGMA foreign_keys = OFF;');

    const deletedMsgs = await WhatsAppMessage.destroy({ where: {}, truncate: true });
    console.log(`- Cleared WhatsApp messages: ${deletedMsgs} records`);

    const deletedNotes = await ChatNote.destroy({ where: {}, truncate: true });
    console.log(`- Cleared Chat notes: ${deletedNotes} records`);

    const deletedOrders = await SalesOrder.destroy({ where: {}, truncate: true });
    console.log(`- Cleared Sales orders: ${deletedOrders} records`);

    const deletedChats = await WhatsAppChat.destroy({ where: {}, truncate: true });
    console.log(`- Cleared WhatsApp chats: ${deletedChats} records`);

    const deletedContacts = await Contact.destroy({ where: {}, truncate: true });
    console.log(`- Cleared Contacts: ${deletedContacts} records`);

    // Re-enable SQLite foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON;');

    console.log('[Cleanup] Database purge completed successfully! Re-connect WhatsApp device to sync original chats.');
    process.exit(0);
  } catch (err) {
    console.error('[Cleanup] Purge failed:', err);
    process.exit(1);
  }
};

clearMockData();
