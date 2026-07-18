if (process.env.FORCE_SEED !== 'true') {
  console.error('ERROR: To run this seed script, you must set the FORCE_SEED=true environment variable.');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const { sequelize, User, Workspace, WhatsAppSession, AutomationRule } = require('./models');

const seed = async () => {
  try {
    await sequelize.sync();
    // Check if user exists
    const existing = await User.findOne({ where: { email: 'admin@amudhasurabiy.com' } });
    if (existing) {
      console.log('Demo user already seeded.');
      process.exit(0);
    }

    // Create Workspace
    const workspace = await Workspace.create({
      name: 'Amudhasurabiy Organics',
      subscriptionPlan: 'pro',
      messageLimit: 50000
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create User
    await User.create({
      name: 'Dineshkumar',
      email: 'admin@amudhasurabiy.com',
      passwordHash,
      role: 'owner',
      workspaceId: workspace.id
    });

    // Create default sessions and rules
    await WhatsAppSession.create({ workspaceId: workspace.id });
    await AutomationRule.bulkCreate([
      { workspaceId: workspace.id, name: 'Birthday Greetings', triggerType: 'Birthday', isActive: true },
      { workspaceId: workspace.id, name: 'Inactive 30 Days', triggerType: 'Inactive30Days', isActive: true },
      { workspaceId: workspace.id, name: 'Inactive 60 Days', triggerType: 'Inactive60Days', isActive: false },
      { workspaceId: workspace.id, name: 'New Contact Welcome', triggerType: 'ContactAdded', isActive: true },
    ]);

    console.log('Demo workspace and user successfully seeded!');
    console.log('Email: admin@amudhasurabiy.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
