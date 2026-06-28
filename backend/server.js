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

const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const checkOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cleanAllowed = allowedOrigins.map(allowed => 
    allowed.replace(/^https?:\/\//, '').replace(/\/$/, '')
  );
  return cleanAllowed.some(allowed => cleanOrigin === allowed) || cleanOrigin.endsWith('.vercel.app');
};

const corsOptions = {
  origin: (origin, callback) => {
    if (checkOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (checkOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure Socket.io inside WhatsApp Service
whatsappService.setIO(io);

// Enable JSON & URL Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors(corsOptions));

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

// Root API landing page (Dynamic HTML dashboard or JSON response)
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.sendFile(path.join(__dirname, 'public', 'api-status.html'));
  }
  return res.json({
    success: true,
    application: "Cusman CRM API",
    company: "DSK Technologies",
    status: "online",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    documentation: "/api/docs",
    health: "/api/health"
  });
});

// Swagger UI Documentation center
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Cusman CRM API Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// OpenAPI specifications JSON route
app.get('/api/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'openapi.json'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.get('/api/health', async (req, res) => {
  try {
    // Validate database connection using both Sequelize and Prisma Client
    await sequelize.authenticate();
    
    let prismaConnected = false;
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      prismaConnected = true;
    } catch (prismaErr) {
      console.warn('[Health Check] Prisma verification bypassed:', prismaErr.message);
    }

    res.json({
      success: true,
      status: "online",
      database: "connected",
      prisma: prismaConnected ? "connected" : "bypassed",
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

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('[Database] Prisma Client connection verified.');
      await prisma.$disconnect();
    } catch (prismaErr) {
      console.warn('[Database] Prisma connection bypassed (using SQLite/fallback):', prismaErr.message);
    }
    
    console.log('[Startup Validation] Database connected successfully.');

    // Sync models safely (sqlite dialect cannot alter tables with foreign keys)
    if (sequelize.options.dialect === 'sqlite') {
      await sequelize.sync();
    } else {
      await sequelize.sync({ alter: true });
    }
    console.log('[Database] Tables synchronized successfully.');

    // Auto-seed database if empty on startup
    try {
      const { User } = require('./models');
      const userCount = await User.count();
      if (userCount === 0) {
        console.log('[Database] Database is empty. Running auto-seed...');
        const seedAuto = require('./seed_auto');
        await seedAuto();
        console.log('[Database] Auto-seeding completed successfully.');
      } else {
        console.log('[Database] Database already contains data. Skipping auto-seed.');
      }
    } catch (seedErr) {
      console.error('[Database] Auto-seeding failed:', seedErr);
    }

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
        const mockSessionPath = path.join(__dirname, 'sessions', `mock-session-${session.workspaceId}.json`);
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
      console.log(`[Server] Cusman CRM running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log('[Server Started] Cusman CRM API backend server is online.');
    });
  } catch (err) {
    console.error('[Server] Critical Startup Error:', err);
    process.exit(1);
  }
};

startServer();
