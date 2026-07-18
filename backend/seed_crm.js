if (process.env.FORCE_SEED !== 'true') {
  console.error('ERROR: To run this seed script, you must set the FORCE_SEED=true environment variable.');
  process.exit(1);
}

const { sequelize, Workspace, User, Contact, WhatsAppChat, WhatsAppMessage, ChatNote, SalesOrder, AutoReplyRule } = require('./models');

const seedCRM = async () => {
  try {
    // 0. Disable foreign keys check for SQLite
    await sequelize.query('PRAGMA foreign_keys = OFF;');

    // 1. Find Workspace & User
    const workspace = await Workspace.findOne({ where: { name: 'Amudhasurabiy Organics' } });
    if (!workspace) {
      console.error('Workspace "Amudhasurabiy Organics" not found. Please run node seed.js first.');
      process.exit(1);
    }
    const user = await User.findOne({ where: { email: 'admin@amudhasurabiy.com' } });
    if (!user) {
      console.error('Admin user not found.');
      process.exit(1);
    }

    const workspaceId = workspace.id;
    const userId = user.id;

    console.log(`Seeding CRM data for workspace: ${workspace.name} (${workspaceId})`);

    // Clean old data first (respecting foreign key deletion order)
    await WhatsAppMessage.destroy({ where: { workspaceId } });
    await ChatNote.destroy({ where: { workspaceId } });
    await SalesOrder.destroy({ where: { workspaceId } });
    await WhatsAppChat.destroy({ where: { workspaceId } });
    await Contact.destroy({ where: { workspaceId } });
    await AutoReplyRule.destroy({ where: { workspaceId } });

    // 2. Create Contacts
    const c1 = await Contact.create({
      workspaceId,
      name: 'Dineshkumar',
      phone: '919876543210',
      email: 'dineshkumar@gmail.com',
      address: '123, G.N. Chetty Road, T. Nagar, Chennai',
      gstNumber: '33AAAAA1111A1Z1',
      city: 'Chennai',
      company: 'Amudhasurabiy Organics',
      tags: 'Organic Store',
      totalPurchaseValue: 1200.00,
      lastPurchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    const c2 = await Contact.create({
      workspaceId,
      name: 'Sarah Miller',
      phone: '15550199',
      email: 'sarah@organics.co',
      address: '456, Broadway Ave, New York, NY',
      gstNumber: '10AAAB1234F1Z9',
      city: 'New York',
      company: 'Organics Co',
      tags: 'Distributor',
      totalPurchaseValue: 3500.00,
      lastPurchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    const c3 = await Contact.create({
      workspaceId,
      name: 'Ramesh Patel',
      phone: '919812345678',
      email: 'ramesh@greengrocery.in',
      address: '789, Linking Road, Bandra West, Mumbai',
      gstNumber: '27BBBBB2222B2Z2',
      city: 'Mumbai',
      company: 'Green Grocery',
      tags: 'Supermarket',
      totalPurchaseValue: 850.00,
      lastPurchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    const c4 = await Contact.create({
      workspaceId,
      name: 'Emily Chen',
      phone: '14155552671',
      email: 'emily@naturehub.com',
      address: '101, Market St, San Francisco, CA',
      gstNumber: '06CCCCC3333C3Z3',
      city: 'San Francisco',
      company: 'Nature Hub',
      tags: 'Organic Store',
      totalPurchaseValue: 2400.00,
      lastPurchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    console.log('Seeded 4 Contacts.');

    // 3. Create WhatsAppChats
    const chatJid1 = '919876543210@c.us';
    const chatJid2 = '15550199@c.us';
    const chatJid3 = '919812345678@c.us';

    const wc1 = await WhatsAppChat.create({
      workspaceId,
      chatId: chatJid1,
      name: 'Dineshkumar',
      unreadCount: 1,
      lastMessage: 'Can you send the price of Organic Tea?',
      lastMessageTime: new Date(),
      salesStatus: 'Leads',
      customerStatus: 'Lead',
      assignedTo: userId
    });

    const wc2 = await WhatsAppChat.create({
      workspaceId,
      chatId: chatJid2,
      name: 'Sarah Miller',
      unreadCount: 0,
      lastMessage: 'I need 10 boxes of Organic Honey',
      lastMessageTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      salesStatus: 'Orders',
      customerStatus: 'Active Customer',
      assignedTo: userId
    });

    const wc3 = await WhatsAppChat.create({
      workspaceId,
      chatId: chatJid3,
      name: 'Ramesh Patel',
      unreadCount: 0,
      lastMessage: 'Thank you for the catalogue PDF.',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      salesStatus: 'General',
      customerStatus: 'New',
      assignedTo: null
    });

    console.log('Seeded 3 Chat threads.');

    // 4. Create conversation messages
    // Dineshkumar chat messages
    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid1,
      messageId: 'MSG_DK_1',
      from: chatJid1,
      to: 'me',
      body: 'Can you send the price of Organic Tea?',
      timestamp: new Date(),
      fromMe: false,
      isUnread: true,
      leadIntent: 'Price Enquiry',
      orderIntent: 'None',
      sentiment: 'Neutral',
      suggestedReply: 'Thank you for asking! Our Premium Organic Tea is priced at $12.00 per carton. How many cartons should I draft for you?'
    });

    // Sarah Miller chat messages
    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid2,
      messageId: 'MSG_SM_1',
      from: chatJid2,
      to: 'me',
      body: 'Hello, I am interested in your organic products.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      fromMe: false,
      isUnread: false,
      leadIntent: 'Product Enquiry',
      orderIntent: 'None',
      sentiment: 'Positive',
      suggestedReply: 'We would love to assist you! Would you like to review our product catalogue?'
    });

    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid2,
      messageId: 'MSG_SM_2',
      from: 'me',
      to: chatJid2,
      body: 'Here is our catalogue. Please let me know what you need.',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      fromMe: true,
      isUnread: false,
      leadIntent: 'None',
      orderIntent: 'None',
      sentiment: 'Neutral'
    });

    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid2,
      messageId: 'MSG_SM_3',
      from: chatJid2,
      to: 'me',
      body: 'I need 10 boxes of Organic Honey',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      fromMe: false,
      isUnread: false,
      leadIntent: 'Interested',
      orderIntent: 'New Order',
      sentiment: 'Positive',
      suggestedReply: 'Awesome! I have automatically drafted a Sales Order for 10 boxes of Organic Honey at $15.00/box. Please approve the draft order inside your panel.'
    });

    // Ramesh Patel chat messages
    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid3,
      messageId: 'MSG_RP_1',
      from: chatJid3,
      to: 'me',
      body: 'catalogue',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      fromMe: false,
      isUnread: false,
      leadIntent: 'Product Enquiry',
      orderIntent: 'None',
      sentiment: 'Neutral'
    });

    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid3,
      messageId: 'MSG_RP_2',
      from: 'me',
      to: chatJid3,
      body: 'Please find our catalogue attached below.',
      timestamp: new Date(Date.now() - 5.9 * 60 * 60 * 1000),
      fromMe: true,
      isUnread: false,
      leadIntent: 'None',
      orderIntent: 'None',
      sentiment: 'Neutral'
    });

    await WhatsAppMessage.create({
      workspaceId,
      chatId: chatJid3,
      messageId: 'MSG_RP_3',
      from: chatJid3,
      to: 'me',
      body: 'Thank you for the catalogue PDF.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      fromMe: false,
      isUnread: false,
      leadIntent: 'None',
      orderIntent: 'None',
      sentiment: 'Positive',
      suggestedReply: 'You are very welcome! Feel free to ask any pricing or dispatch questions.'
    });

    console.log('Seeded message logs.');

    // 5. Chat Notes
    await ChatNote.create({
      workspaceId,
      chatId: chatJid1,
      userId,
      note: 'Customer wants bulk packaging pricing for organic tea. Need to verify shipping costs for Chennai.'
    });

    await ChatNote.create({
      workspaceId,
      chatId: chatJid2,
      userId,
      note: 'Sarah is a regular distributor. Needs priority dispatch via DHL express.'
    });

    console.log('Seeded chat notes.');

    // 6. Create SalesOrders
    // Draft Order for Sarah Miller
    await SalesOrder.create({
      workspaceId,
      chatId: chatJid2,
      customerName: 'Sarah Miller',
      phone: '15550199',
      totalValue: 150.00,
      status: 'New Order',
      city: 'New York',
      items: JSON.stringify([{
        productName: 'Organic Honey',
        quantity: 10,
        price: 15.00,
        unit: 'boxes'
      }]),
      timeline: JSON.stringify([
        { status: 'New Order', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), user: 'AI Sales Assistant' }
      ])
    });

    // Confirmed Order for Emily Chen (no active chat right now, but has CRM history)
    await SalesOrder.create({
      workspaceId,
      chatId: '14155552671@c.us',
      customerName: 'Emily Chen',
      phone: '14155552671',
      totalValue: 450.00,
      status: 'Confirmed',
      city: 'San Francisco',
      items: JSON.stringify([{
        productName: 'Organic Tea',
        quantity: 30,
        price: 15.00,
        unit: 'cartons'
      }]),
      timeline: JSON.stringify([
        { status: 'New Order', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), user: 'AI Sales Assistant' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000), user: 'Dineshkumar' }
      ])
    });

    // Processing Order for Emily Chen
    await SalesOrder.create({
      workspaceId,
      chatId: '14155552671@c.us',
      customerName: 'Emily Chen',
      phone: '14155552671',
      totalValue: 300.00,
      status: 'Processing',
      city: 'San Francisco',
      items: JSON.stringify([{
        productName: 'Organic Jam',
        quantity: 20,
        price: 15.00,
        unit: 'jars'
      }]),
      timeline: JSON.stringify([
        { status: 'New Order', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), user: 'AI Sales Assistant' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000), user: 'Dineshkumar' },
        { status: 'Processing', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), user: 'Dineshkumar' }
      ])
    });

    // Delivered Order
    await SalesOrder.create({
      workspaceId,
      chatId: chatJid1,
      customerName: 'Dineshkumar',
      phone: '919876543210',
      totalValue: 1200.00,
      status: 'Delivered',
      city: 'Chennai',
      items: JSON.stringify([{
        productName: 'Premium Spices',
        quantity: 80,
        price: 15.00,
        unit: 'boxes'
      }]),
      timeline: JSON.stringify([
        { status: 'New Order', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), user: 'AI Sales Assistant' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 5.8 * 24 * 60 * 60 * 1000), user: 'Dineshkumar' },
        { status: 'Processing', timestamp: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000), user: 'Dineshkumar' },
        { status: 'Dispatched', timestamp: new Date(Date.now() - 5.2 * 24 * 60 * 60 * 1000), user: 'Dineshkumar' },
        { status: 'Delivered', timestamp: new Date(Date.now() - 5.0 * 24 * 60 * 60 * 1000), user: 'Dineshkumar' }
      ])
    });

    console.log('Seeded 4 Sales Orders.');

    // 7. Auto Reply Rules
    await AutoReplyRule.create({
      workspaceId,
      keyword: 'catalogue',
      response: 'Please find our catalogue attached below.',
      mediaUrl: '/uploads/catalogue.pdf',
      mediaType: 'application/pdf'
    });

    await AutoReplyRule.create({
      workspaceId,
      keyword: 'price',
      response: 'Sure! Our standard pricing tier is: Organic Honey $15.00/box, Organic Tea $12.00/box, Organic Jam $15.00/jar. Bulk discount of 10% is active for orders over 50 units.'
    });

    await AutoReplyRule.create({
      workspaceId,
      keyword: 'hello',
      response: 'Hello! Welcome to Amudhasurabiy Organics. Our Sales Assistant is active. Please type "catalogue" to fetch our product catalogs, or describe your order request to draft it.'
    });

    console.log('Seeded Auto Reply Rules.');

    console.log('CRM Database Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('CRM Seeding failed:', err);
    process.exit(1);
  }
};

seedCRM();
