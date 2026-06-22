const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
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
  DailyVisit
} = require('./models');

const seedEnterprise = async () => {
  try {
    console.log('[Seeding Enterprise] Restructuring and cleaning database...');
    
    // Disable foreign key checks for SQLite resetting
    await sequelize.query('PRAGMA foreign_keys = OFF;');

    // Sync database schemas
    await sequelize.sync({ force: true });
    console.log('[Seeding Enterprise] Database synchronized.');

    // 1. Seed Global System Settings
    const systemSettings = [
      { key: 'SMTP_HOST', value: 'smtp.inboxiq.com' },
      { key: 'SMTP_PORT', value: '587' },
      { key: 'SMTP_USER', value: 'no-reply@inboxiq.com' },
      { key: 'SMTP_PASSWORD', value: 'super_secret_smtp_password_123' },
      { key: 'OPENAI_API_KEY', value: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'STRIPE_API_KEY', value: 'sk_test_xxxxxxxxxxxxxx' },
      { key: 'RAZORPAY_KEY_ID', value: 'rzp_test_xxxxxxxxx' }
    ];
    await SystemSetting.bulkCreate(systemSettings);
    console.log('Seeded global system settings.');

    // 2. Create InboxIQ System Workspace & Super Admin
    const adminWorkspace = await Workspace.create({
      name: 'InboxIQ System Workspace',
      subscriptionPlan: 'enterprise',
      userLimit: 9999,
      contactLimit: 999999,
      leadLimit: 999999,
      whatsappLimit: 999,
      status: 'active',
      apiKey: 'wf_live_system_key',
      apiSecret: 'system_secret_123'
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@inboxiq.com',
      passwordHash,
      role: 'superadmin',
      workspaceId: adminWorkspace.id
    });
    console.log('Seeded Super Admin User: superadmin@inboxiq.com / password123');

    // 3. Create Tenant Workspace & Users
    const tenantWorkspace = await Workspace.create({
      name: 'Amudhasurabiy Organics',
      subscriptionPlan: 'pro',
      messageLimit: 50000,
      userLimit: 10,
      contactLimit: 5000,
      leadLimit: 5000,
      whatsappLimit: 3,
      storageLimit: 500, // 500 MB
      status: 'active',
      planExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      apiKey: 'wf_live_amudhasurabiy_key',
      apiSecret: 'amudhasurabiy_secret_123'
    });

    // Hash Tenant Passwords
    const tenantOwner = await User.create({
      name: 'Dineshkumar',
      email: 'admin@amudhasurabiy.com',
      passwordHash,
      role: 'owner',
      workspaceId: tenantWorkspace.id
    });

    const tenantOwner2 = await User.create({
      name: 'Dineshkumar',
      email: 'dinesh@amudhasurabiy.com',
      passwordHash,
      role: 'owner',
      workspaceId: tenantWorkspace.id
    });

    const tenantAdmin = await User.create({
      name: 'AO Manager',
      email: 'manager@amudhasurabiy.com',
      passwordHash,
      role: 'admin',
      workspaceId: tenantWorkspace.id
    });

    const tenantStaff = await User.create({
      name: 'AO Staff Member',
      email: 'staff@amudhasurabiy.com',
      passwordHash,
      role: 'staff',
      workspaceId: tenantWorkspace.id
    });
    console.log('Seeded Tenant Users under Amudhasurabiy Organics.');

    // 4. Create default WhatsApp Session & Automation Rules
    await WhatsAppSession.create({ workspaceId: tenantWorkspace.id });
    await AutomationRule.bulkCreate([
      { workspaceId: tenantWorkspace.id, name: 'Birthday Greetings', triggerType: 'Birthday', isActive: true },
      { workspaceId: tenantWorkspace.id, name: 'No Order 30 Days', triggerType: 'Inactive30Days', isActive: true },
      { workspaceId: tenantWorkspace.id, name: 'No Order 60 Days', triggerType: 'Inactive60Days', isActive: false },
      { workspaceId: tenantWorkspace.id, name: 'No Order 90 Days', triggerType: 'Inactive90Days', isActive: true },
      { workspaceId: tenantWorkspace.id, name: 'New Contact Welcome', triggerType: 'ContactAdded', isActive: true },
    ]);
    console.log('Seeded WhatsApp Session and Automation Rules.');

    // 5. Seed Products with rich fields
    const productsData = [
      {
        workspaceId: tenantWorkspace.id,
        name: 'ABC Malt',
        sku: 'ABC-MALT-100',
        barcode: '8901234567890',
        category: 'Health Drinks',
        brand: 'Amudhasurabiy',
        unit: 'packets',
        price: 180.00,
        offerPrice: 150.00,
        stock: 150,
        description: 'Amudhasurabiy Organic Bio Malt for energy & vitality.',
        benefits: 'Increases physical stamina, strengthens bone density, boosts immunity system, rich in protein',
        ingredients: 'Sprouted ragi, premium almonds, whole cardamom, natural pistachios, organic raw sugar',
        imageUrls: JSON.stringify(['https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/abc_malt.jpg']),
        productUrl: 'http://localhost:3000/products/abc-malt',
        cataloguePdfUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/abc_malt.jpg',
        catalogueUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        websiteUrl: 'http://localhost:3000/products/abc-malt'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Beetroot Malt',
        sku: 'BT-MALT-100',
        barcode: '8901234567891',
        category: 'Health Drinks',
        brand: 'Amudhasurabiy',
        unit: 'packets',
        price: 220.00,
        offerPrice: 195.00,
        stock: 90,
        description: 'Beetroot Malt for natural iron enrichment & blood detox.',
        benefits: 'Improves hemoglobin counts rapidly, purifies blood stream, provides natural skin glow',
        ingredients: 'Fresh beetroot juice, organic brown sugar, cashews, cardamom, almonds',
        imageUrls: JSON.stringify(['https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/beetroot_malt.jpg']),
        productUrl: 'http://localhost:3000/products/beetroot-malt',
        cataloguePdfUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/beetroot_malt.jpg',
        catalogueUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        websiteUrl: 'http://localhost:3000/products/beetroot-malt'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Nendran Banana Malt',
        sku: 'NB-MALT-100',
        barcode: '8901234567892',
        category: 'Health Drinks',
        brand: 'Amudhasurabiy',
        unit: 'packets',
        price: 250.00,
        offerPrice: 215.00,
        stock: 45,
        description: 'Banana Malt processed with raw Nendran bananas for healthy weight gain.',
        benefits: 'Rich source of potassium & dietary fibers, aids digestive system, promotes weight gain in children',
        ingredients: 'Raw Nendran banana powder, sprouted green gram, organic jaggery, cardamom',
        imageUrls: JSON.stringify(['https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/banana_malt.jpg']),
        productUrl: 'http://localhost:3000/products/banana-malt',
        cataloguePdfUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/banana_malt.jpg',
        catalogueUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        websiteUrl: 'http://localhost:3000/products/banana-malt'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Organic Tea',
        sku: 'ORG-TEA-01',
        barcode: '8901234567893',
        category: 'Beverages',
        brand: 'Amudhasurabiy',
        unit: 'boxes',
        price: 120.00,
        offerPrice: 110.00,
        stock: 300,
        description: 'Premium organic tea leaves plucked from Nilgiris estate.',
        benefits: 'Rich in antioxidants, relieves stress, boosts brain focus',
        ingredients: '100% Organic Nilgiris Black Tea Leaves',
        imageUrls: JSON.stringify(['https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/organic_tea.jpg']),
        productUrl: 'http://localhost:3000/products/organic-tea',
        imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/organic_tea.jpg',
        websiteUrl: 'http://localhost:3000/products/organic-tea'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Organic Honey',
        sku: 'ORG-HON-01',
        barcode: '8901234567894',
        category: 'Groceries',
        brand: 'Amudhasurabiy',
        unit: 'bottles',
        price: 150.00,
        offerPrice: 135.00,
        stock: 80,
        description: 'Raw forest honey collected from Western Ghats.',
        benefits: 'Natural cough suppressant, aids digestion, rich in enzymes',
        ingredients: '100% Pure Raw Western Ghats Forest Honey',
        specifications: 'Weight: 500ml, Glass Bottle packaging',
        imageUrls: JSON.stringify(['https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/organic_honey.jpg']),
        productUrl: 'http://localhost:3000/products/organic-honey',
        cataloguePdfUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/organic_honey.jpg',
        catalogueUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
        websiteUrl: 'http://localhost:3000/products/organic-honey'
      }
    ];
    await Product.bulkCreate(productsData);
    console.log('Seeded 5 Products.');

    // 6. Seed CRM Contacts with Lead & Customer metrics
    const contactsData = [
      {
        workspaceId: tenantWorkspace.id,
        name: 'Dineshkumar',
        phone: '919876543210',
        city: 'Chennai',
        company: 'Amudhasurabiy Organics',
        tags: 'VIP,Organic Store',
        totalPurchaseValue: 1200.00,
        lastPurchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        leadSource: 'WhatsApp',
        leadStage: 'Negotiation',
        leadScore: 'Hot',
        conversionProbability: 0.85,
        outstandingAmount: 250.00,
        healthScore: 'Active'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Sarah Miller',
        phone: '15550199',
        city: 'New York',
        company: 'Organics Co',
        tags: 'Distributor',
        totalPurchaseValue: 3500.00,
        lastPurchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        leadSource: 'Instagram',
        leadStage: 'Won',
        leadScore: 'Hot',
        conversionProbability: 1.00,
        outstandingAmount: 0.00,
        healthScore: 'Active'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Ramesh Patel',
        phone: '919812345678',
        city: 'Mumbai',
        company: 'Green Grocery',
        tags: 'Supermarket',
        totalPurchaseValue: 850.00,
        lastPurchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        leadSource: 'Facebook',
        leadStage: 'Contacted',
        leadScore: 'Warm',
        conversionProbability: 0.50,
        outstandingAmount: 50.00,
        healthScore: 'Active'
      },
      {
        workspaceId: tenantWorkspace.id,
        name: 'Emily Chen',
        phone: '14155552671',
        city: 'San Francisco',
        company: 'Nature Hub',
        tags: 'Retail Store,Organic Store',
        totalPurchaseValue: 2400.00,
        lastPurchaseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Inactive > 30 days
        leadSource: 'Website',
        leadStage: 'Won',
        leadScore: 'Hot',
        conversionProbability: 1.00,
        outstandingAmount: 120.00,
        healthScore: 'At Risk'
      }
    ];
    await Contact.bulkCreate(contactsData);
    console.log('Seeded 4 CRM Contacts.');

    // Fetch contacts for relations
    const dkContact = await Contact.findOne({ where: { phone: '919876543210' } });
    const smContact = await Contact.findOne({ where: { phone: '15550199' } });
    const rpContact = await Contact.findOne({ where: { phone: '919812345678' } });

    // 7. Seed WhatsApp Chats & Messages
    const chatJid1 = '919876543210@c.us';
    const chatJid2 = '15550199@c.us';
    const chatJid3 = '919812345678@c.us';

    await WhatsAppChat.bulkCreate([
      {
        workspaceId: tenantWorkspace.id,
        chatId: chatJid1,
        name: 'Dineshkumar',
        unreadCount: 1,
        lastMessage: 'Can you send the price of Organic Tea?',
        lastMessageTime: new Date(),
        salesStatus: 'Leads',
        customerStatus: 'Lead',
        assignedTo: tenantOwner.id,
        isPinned: true
      },
      {
        workspaceId: tenantWorkspace.id,
        chatId: chatJid2,
        name: 'Sarah Miller',
        unreadCount: 0,
        lastMessage: 'I need 10 boxes of Organic Honey',
        lastMessageTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        salesStatus: 'Orders',
        customerStatus: 'Active Customer',
        assignedTo: tenantOwner.id,
        isPinned: false
      },
      {
        workspaceId: tenantWorkspace.id,
        chatId: chatJid3,
        name: 'Ramesh Patel',
        unreadCount: 0,
        lastMessage: 'Thank you for the catalogue PDF.',
        lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        salesStatus: 'General',
        customerStatus: 'New',
        assignedTo: null,
        isPinned: false
      }
    ]);

    await WhatsAppMessage.bulkCreate([
      {
        workspaceId: tenantWorkspace.id,
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
        suggestedReply: 'Thank you for asking! Our Premium Organic Tea is priced at ₹120.00 per box. How many boxes should I draft for you?'
      },
      {
        workspaceId: tenantWorkspace.id,
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
      },
      {
        workspaceId: tenantWorkspace.id,
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
      },
      {
        workspaceId: tenantWorkspace.id,
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
        suggestedReply: 'Awesome! I have automatically drafted a Sales Order for 10 boxes of Organic Honey at ₹135.00/box. Please approve the draft order inside your panel.'
      }
    ]);

    await ChatNote.bulkCreate([
      { workspaceId: tenantWorkspace.id, chatId: chatJid1, userId: tenantOwner.id, note: 'Wants bulk tea packs. Verifying shipping costs to Chennai Central.' },
      { workspaceId: tenantWorkspace.id, chatId: chatJid2, userId: tenantOwner.id, note: 'Sarah is our top distributor. Prioritize DHL express dispatch.' }
    ]);
    console.log('Seeded chat history and notes.');

    // 8. Seed Sales Orders
    await SalesOrder.bulkCreate([
      {
        workspaceId: tenantWorkspace.id,
        chatId: chatJid1,
        customerName: 'Dineshkumar',
        phone: '919876543210',
        totalValue: 3000.00,
        status: 'Draft',
        city: 'Chennai',
        invoiceNumber: 'INV-2026-0001',
        items: JSON.stringify([{ productName: 'ABC Malt', quantity: 20, price: 150.00, unit: 'packets' }]),
        timeline: JSON.stringify([{ status: 'Draft', timestamp: new Date(), user: 'AI Sales Assistant' }])
      },
      {
        workspaceId: tenantWorkspace.id,
        chatId: chatJid2,
        customerName: 'Sarah Miller',
        phone: '15550199',
        totalValue: 1350.00,
        status: 'Confirmed',
        city: 'New York',
        invoiceNumber: 'INV-2026-0002',
        items: JSON.stringify([{ productName: 'Organic Honey', quantity: 10, price: 135.00, unit: 'bottles' }]),
        timeline: JSON.stringify([
          { status: 'Draft', timestamp: new Date(Date.now() - 1.2 * 60 * 60 * 1000), user: 'AI Sales Assistant' },
          { status: 'Confirmed', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), user: 'Dineshkumar' }
        ])
      },
      {
        workspaceId: tenantWorkspace.id,
        chatId: '14155552671@c.us',
        customerName: 'Emily Chen',
        phone: '14155552671',
        totalValue: 3300.00,
        status: 'Delivered',
        city: 'San Francisco',
        invoiceNumber: 'INV-2026-0003',
        items: JSON.stringify([{ productName: 'Organic Tea', quantity: 30, price: 110.00, unit: 'boxes' }]),
        timeline: JSON.stringify([
          { status: 'Draft', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), user: 'AI Sales Assistant' },
          { status: 'Confirmed', timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000), user: 'Dineshkumar' },
          { status: 'Dispatched', timestamp: new Date(Date.now() - 4.2 * 24 * 60 * 60 * 1000), user: 'AO Manager' },
          { status: 'Delivered', timestamp: new Date(Date.now() - 4.0 * 24 * 60 * 60 * 1000), user: 'AO Manager' }
        ])
      }
    ]);
    console.log('Seeded 3 Sales Orders.');

    // 9. Seed Tasks & Follow-ups
    await Task.bulkCreate([
      {
        workspaceId: tenantWorkspace.id,
        title: 'Review custom pricing sheet with Dineshkumar',
        description: 'Negotiate bulk prices for Organic Tea packaging.',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'Pending',
        reminderType: 'WhatsApp',
        contactId: dkContact.id,
        assignedTo: tenantOwner.id
      },
      {
        workspaceId: tenantWorkspace.id,
        title: 'Dispatch honey batch to Sarah Miller',
        description: 'Priority courier dispatch via DHL Express.',
        dueDate: new Date(),
        status: 'Completed',
        reminderType: 'CRM Notification',
        contactId: smContact.id,
        assignedTo: tenantAdmin.id
      },
      {
        workspaceId: tenantWorkspace.id,
        title: 'Send re-engagement campaign to Emily Chen',
        description: 'No orders placed in last 40 days.',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'Overdue',
        reminderType: 'WhatsApp',
        contactId: smContact.id,
        assignedTo: tenantOwner.id
      }
    ]);
    console.log('Seeded 3 Tasks.');

    // 10. Seed Sales Team: Territories, Routes, and Visits
    const tnTerritory = await Territory.create({
      workspaceId: tenantWorkspace.id,
      name: 'Chennai Central',
      code: 'CH-CTR-01'
    });

    const mbTerritory = await Territory.create({
      workspaceId: tenantWorkspace.id,
      name: 'South Mumbai',
      code: 'MB-STH-01'
    });

    const tnRoute = await Route.create({
      workspaceId: tenantWorkspace.id,
      territoryId: tnTerritory.id,
      name: 'T. Nagar Retail Route',
      description: 'Covering organic retail outlets and supermarkets in T. Nagar.'
    });

    const mbRoute = await Route.create({
      workspaceId: tenantWorkspace.id,
      territoryId: mbTerritory.id,
      name: 'Colaba Distribution Route',
      description: 'Covering distributor points around Colaba Market.'
    });

    await DailyVisit.bulkCreate([
      {
        workspaceId: tenantWorkspace.id,
        executiveId: tenantStaff.id,
        contactId: dkContact.id,
        visitDate: new Date(),
        status: 'Pending',
        notes: 'Introduce new Beetroot Malt packaging.'
      },
      {
        workspaceId: tenantWorkspace.id,
        executiveId: tenantAdmin.id,
        contactId: rpContact.id,
        visitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'Visited',
        notes: 'Store owner requested details on bulk banana malt discounts.'
      }
    ]);
    console.log('Seeded Sales Territories, Routes, and Daily Visits.');

    // 11. Seed Billing Records & Support Tickets
    await BillingRecord.bulkCreate([
      { workspaceId: tenantWorkspace.id, amount: 2100.00, currency: 'INR', paymentGateway: 'stripe', status: 'success', planName: 'pro', type: 'subscription_creation', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { workspaceId: tenantWorkspace.id, amount: 2100.00, currency: 'INR', paymentGateway: 'stripe', status: 'success', planName: 'pro', type: 'subscription_renewal', createdAt: new Date() }
    ]);

    await SupportTicket.create({
      workspaceId: tenantWorkspace.id,
      userId: tenantOwner.id,
      subject: 'Need help linking secondary WhatsApp number',
      description: 'We scanned the QR code for our second line, but it returns disconnected after 5 minutes.',
      status: 'open',
      priority: 'high',
      replies: JSON.stringify([{ sender: 'Owner', message: 'It says "Initializing" then shifts back.', time: new Date() }])
    });
    console.log('Seeded Billing Records & Support Tickets.');

    // 12. Seed Auto Reply rules
    await AutoReplyRule.bulkCreate([
      {
        workspaceId: tenantWorkspace.id,
        keyword: 'catalogue',
        response: 'Please find our catalogue attached below.',
        mediaUrl: '/uploads/catalogue.pdf',
        mediaType: 'application/pdf'
      },
      {
        workspaceId: tenantWorkspace.id,
        keyword: 'price',
        response: 'Sure! Our standard pricing tier is: ABC Malt ₹150.00/pack, Beetroot Malt ₹195.00/pack, Nendran Banana Malt ₹215.00/pack. Bulk discount of 10% is active for orders over 50 units.'
      },
      {
        workspaceId: tenantWorkspace.id,
        keyword: 'hello',
        response: 'Hello! Welcome to Amudhasurabiy Organics. Our Sales Assistant is active. Please type "catalogue" to fetch our product catalogs, or describe your order request to draft it.'
      }
    ]);
    console.log('Seeded Auto Reply Rules.');

    // Enable foreign keys back
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('[Seeding Enterprise] Completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Enterprise Seeding failed:', err);
    process.exit(1);
  }
};

seedEnterprise();
