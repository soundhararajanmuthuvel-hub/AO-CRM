const { sequelize, Contact, WhatsAppChat, WhatsAppMessage, ChatNote, SalesOrder } = require('./models');

const clearMockData = async () => {
  try {
    const isConfirm = process.argv.includes('--confirm');

    // Fetch current counts
    const msgCount = await WhatsAppMessage.count();
    const noteCount = await ChatNote.count();
    const orderCount = await SalesOrder.count();
    const chatCount = await WhatsAppChat.count();
    const contactCount = await Contact.count();

    if (!isConfirm) {
      console.log('====================================================');
      console.log('       DATABASE PURGE AUDIT (DRY-RUN MODE)          ');
      console.log('====================================================');
      console.log(`- WhatsApp messages: ${msgCount} records to delete`);
      console.log(`- Chat notes:        ${noteCount} records to delete`);
      console.log(`- Sales orders:      ${orderCount} records to delete`);
      console.log(`- WhatsApp chats:    ${chatCount} records to delete`);
      console.log(`- Contacts:          ${contactCount} records to delete`);
      console.log('----------------------------------------------------');
      console.log('⚠️ WARNING: Proceeding will truncate these tables.');
      console.log('Please execute the command with the --confirm flag:');
      console.log('   node clear_mock_data.js --confirm');
      console.log('====================================================');
      process.exit(0);
    }

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
