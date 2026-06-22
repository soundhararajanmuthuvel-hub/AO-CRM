const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { sequelize } = require('./models');
const whatsappService = require('./services/whatsappService');
const queueProcessor = require('./services/queueProcessor');
const automationService = require('./services/automationService');

require('dotenv').config();

// Global error handlers to prevent async library crashes (e.g. Puppeteer/whatsapp-web.js context errors) from taking down the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception] Error:', error);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Configure Socket.io inside WhatsApp Service
whatsappService.setIO(io);

// Enable JSON & URL Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Serve local media uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Linkages
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/automation', require('./routes/automation'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auto-replies', require('./routes/autoReplies'));
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/sales-team', require('./routes/salesTeam'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/messages', require('./routes/messages'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.get('/api/health', async (req, res) => {
  try {
    // Validate database connection using both Sequelize and Prisma Client
    await sequelize.authenticate();
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    res.json({
      success: true,
      status: "online",
      database: "connected",
      environment: process.env.NODE_ENV || "production"
    });
  } catch (err) {
    console.error('[Health Check Error]:', err);
    res.status(500).json({
      success: false,
      status: "offline",
      database: "disconnected",
      environment: process.env.NODE_ENV || "production",
      error: err.message
    });
  }
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  const { workspaceId } = socket.handshake.query;
  if (workspaceId) {
    socket.join(workspaceId);
    console.log(`[Socket.io] Client connected for workspace: ${workspaceId}`);
    
    // Proactively initialize client session on connect ONLY if it is active
    const { WhatsAppSession } = require('./models');
    WhatsAppSession.findOne({ where: { workspaceId } }).then(session => {
      if (session && (session.status === 'READY' || session.status === 'Connected' || session.status === 'Reconnecting' || session.status === 'Initializing')) {
        console.log(`[Socket.io] Proactively restoring active WhatsApp client for workspace: ${workspaceId}`);
        whatsappService.initClient(workspaceId).catch(() => {});
      }
    }).catch(err => {
      console.error('[Socket.io] Error checking session status:', err);
    });
  }

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected.`);
  });
});

// Start server after database sync
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Environment Variables startup validation
    console.log('[Startup Validation] Verifying environment variables...');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    console.log('[Startup Validation] Environment variables loaded.');

    // Database connection startup validation
    console.log('[Startup Validation] Verifying database connection...');
    await sequelize.authenticate();
    console.log('[Database] Sequelize connection verified.');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('[Database] Prisma Client connection verified.');
    await prisma.$disconnect();
    
    console.log('[Startup Validation] Database connected successfully.');

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('[Database] Tables synchronized successfully.');

    // Start background services
    queueProcessor.start();
    automationService.start();

    // Session Restore on Startup: Scan database and restore any active sessions
    try {
      const { WhatsAppSession } = require('./models');
      const fs = require('fs');
      const path = require('path');
      const sessions = await WhatsAppSession.findAll();
      for (const session of sessions) {
        const sessionPath = path.join(__dirname, 'sessions', `session-${session.workspaceId}`);
        const mockSessionPath = path.join(__dirname, 'sessions', `mock-session-${session.workspaceId}`);
        const hasSession = fs.existsSync(sessionPath) || fs.existsSync(mockSessionPath);
        if (hasSession && (session.status === 'READY' || session.status === 'Connected' || session.status === 'Reconnecting' || session.status === 'Initializing')) {
          console.log(`[Startup] Restoring WhatsApp session for workspace: ${session.workspaceId}`);
          whatsappService.initClient(session.workspaceId).catch(err => {
            console.error(`[Startup] Failed to restore session for workspace ${session.workspaceId}:`, err);
          });
        }
      }
    } catch (restoreErr) {
      console.error('[Startup] WhatsApp Session restoration check failed:', restoreErr);
    }

    server.listen(PORT, () => {
      console.log(`[Server] WhatsFlow running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log('[Server Started] WhatsFlow API backend server is online.');
    });
  } catch (err) {
    console.error('[Server] Critical Startup Error:', err);
    process.exit(1);
  }
};

startServer();
