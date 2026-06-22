# WhatsFlow - Production Deployment Guide

This guide details the processes required to run WhatsFlow locally for development, or deploy it into production on a Virtual Private Server (VPS) using Docker.

---

## 1. Running Locally (Development Mode)

WhatsFlow uses a smart fallback design: if PostgreSQL is not running or not configured, it automatically initializes and runs on a local SQLite database (`backend/database.sqlite`). It also supports a simulated WhatsApp environment to run immediately without Chrome installation blockers.

### Step 1: Start Backend API Server
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Configure `.env` values (a default configuration is already provided):
   - Set `MOCK_WHATSAPP=true` to test UI features using the interactive WhatsApp simulator.
   - Set `MOCK_WHATSAPP=false` to test with actual mobile scanning (requires Puppeteer launching Chrome).
3. Start the node express server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

### Step 2: Start Next.js Client App
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the nextjs compilation compiler:
   ```bash
   npm run dev
   ```
   The application landing page will be served on `http://localhost:3000`.

---

## 2. Running in Containerized Sandbox (Docker Setup)

Docker Compose orchestrates the three tiers (Postgres, Node Express Backend, Next.js Client) and installs all Puppeteer browser dependencies automatically.

### Command Execution
Navigate to the root directory `C:\Users\dines\.gemini\antigravity-ide\scratch\whatsflow` and run:
```bash
# Build and run all service containers in background detached mode
docker-compose up --build -d
```

### Access Ports
- **Landing Page & Dashboard**: `http://localhost:3000`
- **Express APIs**: `http://localhost:5000`
- **PostgreSQL Database Engine**: `http://localhost:5432`

---

## 3. Deploying to Production (VPS with Nginx)

When deploying to a VPS (Ubuntu/Debian), use **Nginx** as a reverse proxy behind Docker.

### Step 1: Install Nginx & Docker on Host
```bash
sudo apt update
sudo apt install -y nginx docker.io docker-compose
```

### Step 2: Configure Nginx Site Block
Create a config file at `/etc/nginx/sites-available/whatsflow`:

```nginx
server {
    server_name yourdomain.com;

    # Frontend Client Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://127.0.0.1:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Socket.io Proxy
    location /socket.io {
        proxy_pass http://127.0.0.1:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site block and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/whatsflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: Secure Domain with Certbot SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 4. Key Configurations & Environment Variables

Make sure to configure the host `.env` options on production:
- `DATABASE_URL`: Set to live PostgreSQL connection (`postgres://user:pass@host:5432/db`).
- `JWT_SECRET`: Generate a cryptographically secure 64-character hash key.
- `CLIENT_URL`: Point to your production landing domain `https://yourdomain.com`.
- `MOCK_WHATSAPP`: Set to `false` for live WhatsApp deliveries.
