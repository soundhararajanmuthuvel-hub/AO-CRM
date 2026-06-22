const bcrypt = require('bcryptjs');
const { 
  sequelize, 
  Workspace, 
  User, 
  AuditLog, 
  SupportTicket, 
  SystemSetting, 
  BillingRecord,
  WhatsAppSession
} = require('./models');

const seedSuperAdmin = async () => {
  try {
    console.log('[Seeding Super Admin] Connecting to database...');
    
    // Sync tables first to apply schema changes
    await sequelize.sync();
    console.log('[Seeding Super Admin] Tables synchronized.');

    // 1. Create special workspace for Admin Portal if not exists
    let adminWorkspace = await Workspace.findOne({ where: { name: 'InboxIQ System Workspace' } });
    if (!adminWorkspace) {
      adminWorkspace = await Workspace.create({
        name: 'InboxIQ System Workspace',
        subscriptionPlan: 'enterprise',
        userLimit: 9999,
        contactLimit: 999999,
        leadLimit: 999999,
        whatsappLimit: 999,
        status: 'active'
      });
      console.log('Seeded InboxIQ System Workspace.');
    }

    // 2. Create Super Admin User
    let adminUser = await User.findOne({ where: { email: 'superadmin@inboxiq.com' } });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      
      adminUser = await User.create({
        name: 'Super Admin',
        email: 'superadmin@inboxiq.com',
        passwordHash,
        role: 'superadmin',
        workspaceId: adminWorkspace.id
      });
      console.log('Seeded Super Admin User: superadmin@inboxiq.com / password123');
    }

    // 3. Update existing tenant Amudhasurabiy Organics with limits
    const tenant = await Workspace.findOne({ where: { name: 'Amudhasurabiy Organics' } });
    if (tenant) {
      tenant.subscriptionPlan = 'pro';
      tenant.userLimit = 10;
      tenant.contactLimit = 5000;
      tenant.leadLimit = 5000;
      tenant.whatsappLimit = 3;
      tenant.storageLimit = 500; // 500 MB
      tenant.status = 'active';
      tenant.planExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      await tenant.save();
      console.log('Updated Amudhasurabiy Organics workspace limits and plan expiry.');
    }

    // 4. Seed other workspaces for diversity
    const workspacesData = [
      { name: 'Organic Honey Hub', plan: 'starter', status: 'trial', users: 2, contacts: 200, revenue: 0 },
      { name: 'Vrindavan Distributors', plan: 'enterprise', status: 'active', users: 25, contacts: 45000, revenue: 15800 },
      { name: 'Chennai Retailers', plan: 'free', status: 'expired', users: 1, contacts: 50, revenue: 0 },
    ];

    for (const data of workspacesData) {
      let ws = await Workspace.findOne({ where: { name: data.name } });
      if (!ws) {
        ws = await Workspace.create({
          name: data.name,
          subscriptionPlan: data.plan,
          status: data.status,
          userLimit: data.plan === 'starter' ? 5 : data.plan === 'enterprise' ? 100 : 2,
          contactLimit: data.plan === 'starter' ? 2000 : data.plan === 'enterprise' ? 50000 : 500,
          leadLimit: data.plan === 'starter' ? 2000 : data.plan === 'enterprise' ? 50000 : 500,
          whatsappLimit: data.plan === 'starter' ? 2 : data.plan === 'enterprise' ? 10 : 1,
          storageLimit: data.plan === 'starter' ? 200 : data.plan === 'enterprise' ? 2000 : 50,
          planExpiryDate: data.status === 'expired' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        });
        
        // Seed an owner
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        const ownerEmail = `owner@${data.name.toLowerCase().replace(/[^a-z]/g, '')}.com`;
        
        await User.create({
          name: `${data.name} Owner`,
          email: ownerEmail,
          passwordHash,
          role: 'owner',
          workspaceId: ws.id
        });

        // Seed default WhatsApp Session
        await WhatsAppSession.create({ workspaceId: ws.id });
        console.log(`Seeded company: ${data.name} with owner ${ownerEmail}`);
      }
    }

    // 5. Seed System Settings
    const systemSettings = [
      { key: 'SMTP_HOST', value: 'smtp.inboxiq.com' },
      { key: 'SMTP_PORT', value: '587' },
      { key: 'SMTP_USER', value: 'no-reply@inboxiq.com' },
      { key: 'SMTP_PASSWORD', value: 'super_secret_smtp_password_123' },
      { key: 'OPENAI_API_KEY', value: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'STRIPE_API_KEY', value: 'sk_test_xxxxxxxxxxxxxx' },
      { key: 'RAZORPAY_KEY_ID', value: 'rzp_test_xxxxxxxxx' }
    ];

    for (const setting of systemSettings) {
      const existing = await SystemSetting.findOne({ where: { key: setting.key } });
      if (!existing) {
        await SystemSetting.create(setting);
      }
    }
    console.log('Seeded global system settings.');

    // Find vrindavan and honey workspaces
    const vrindavan = await Workspace.findOne({ where: { name: 'Vrindavan Distributors' } });
    const honey = await Workspace.findOne({ where: { name: 'Organic Honey Hub' } });

    // 6. Seed Support Tickets
    if (tenant && vrindavan) {
      const tickets = [
        {
          workspaceId: tenant.id,
          userId: adminUser.id, // simplified linking
          subject: 'Need help linking secondary WhatsApp number',
          description: 'We scanned the QR code for our second WhatsApp Business line, but it keeps returning disconnected after 5 minutes. Please check session persistence logs.',
          status: 'open',
          priority: 'high',
          replies: [
            { sender: 'Owner', message: 'It says "Initializing" then shifts back to disconnected.', time: new Date(Date.now() - 4 * 60 * 60 * 1000) }
          ]
        },
        {
          workspaceId: vrindavan.id,
          userId: adminUser.id,
          subject: 'Stripe Payment Failed on Renewal',
          description: 'Our annual subscription tried to renew last night but returned card payment failed. The card has sufficient funds. Can we pay via Razorpay?',
          status: 'pending',
          priority: 'medium',
          replies: [
            { sender: 'Owner', message: 'Failed transaction reference is TXN_9812739.', time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { sender: 'Super Admin', message: 'Hello! I have reviewed the logs. The decline error was "Authentication Required". I have triggered a Razorpay payment invoice link manually in your billing tab.', time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
          ]
        }
      ];

      for (const t of tickets) {
        const existing = await SupportTicket.findOne({ where: { subject: t.subject } });
        if (!existing) {
          await SupportTicket.create(t);
        }
      }
      console.log('Seeded support tickets.');
    }

    // 7. Seed Billing records
    if (tenant && vrindavan && honey) {
      const billing = [
        { workspaceId: tenant.id, amount: 2100.00, currency: 'INR', paymentGateway: 'stripe', status: 'success', planName: 'pro', type: 'subscription_creation', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { workspaceId: vrindavan.id, amount: 15800.00, currency: 'INR', paymentGateway: 'stripe', status: 'success', planName: 'enterprise', type: 'subscription_creation', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { workspaceId: honey.id, amount: 999.00, currency: 'INR', paymentGateway: 'razorpay', status: 'failed', planName: 'starter', type: 'subscription_creation', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { workspaceId: tenant.id, amount: 2100.00, currency: 'INR', paymentGateway: 'stripe', status: 'success', planName: 'pro', type: 'subscription_renewal', createdAt: new Date() }
      ];

      for (const b of billing) {
        const existing = await BillingRecord.findOne({ where: { workspaceId: b.workspaceId, amount: b.amount, type: b.type } });
        if (!existing) {
          await BillingRecord.create(b);
        }
      }
      console.log('Seeded billing transactions.');
    }

    // 8. Seed Audit logs
    if (tenant) {
      const logs = [
        { workspaceId: adminWorkspace.id, userId: adminUser.id, userEmail: 'superadmin@inboxiq.com', action: 'LOGIN', details: { ip: '127.0.0.1', device: 'Chrome / Windows' } },
        { workspaceId: tenant.id, userEmail: 'admin@amudhasurabiy.com', action: 'COMPANY_CREATION', details: { companyName: 'Amudhasurabiy Organics', plan: 'pro' } },
        { workspaceId: tenant.id, userEmail: 'superadmin@inboxiq.com', action: 'SUBSCRIPTION_CHANGE', details: { companyName: 'Amudhasurabiy Organics', oldPlan: 'free', newPlan: 'pro', manualOverride: true } }
      ];

      for (const l of logs) {
        const existing = await AuditLog.findOne({ where: { action: l.action, userEmail: l.userEmail } });
        if (!existing) {
          await AuditLog.create(l);
        }
      }
      console.log('Seeded audit logs.');
    }

    console.log('[Seeding Super Admin] Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seeding Super Admin] Seeding failed:', err);
    process.exit(1);
  }
};

seedSuperAdmin();
