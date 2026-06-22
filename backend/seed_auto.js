const bcrypt = require('bcryptjs');
const { User, Workspace, WhatsAppSession, AutomationRule } = require('./models');

const seedAuto = async () => {
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
};

module.exports = seedAuto;
