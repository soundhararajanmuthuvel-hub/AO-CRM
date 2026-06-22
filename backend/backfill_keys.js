const crypto = require('crypto');
const { sequelize, Workspace } = require('./models');

const generateAPIKeys = () => {
  const apiKey = 'wf_live_' + crypto.randomBytes(16).toString('hex');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
};

const backfill = async () => {
  try {
    await sequelize.sync({ alter: true });
    const workspaces = await Workspace.findAll();
    console.log(`Checking API keys for ${workspaces.length} workspaces...`);
    
    let updatedCount = 0;
    for (const ws of workspaces) {
      if (!ws.apiKey || !ws.apiSecret) {
        const { apiKey, apiSecret } = generateAPIKeys();
        ws.apiKey = apiKey;
        ws.apiSecret = apiSecret;
        await ws.save();
        console.log(`Generated API keys for workspace: "${ws.name}"`);
        console.log(`  API_KEY=${apiKey}`);
        console.log(`  API_SECRET=${apiSecret}`);
        updatedCount++;
      } else {
        console.log(`Workspace "${ws.name}" already has API keys:`);
        console.log(`  API_KEY=${ws.apiKey}`);
      }
    }
    console.log(`Backfill completed. Updated ${updatedCount} workspaces.`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
};

backfill();
