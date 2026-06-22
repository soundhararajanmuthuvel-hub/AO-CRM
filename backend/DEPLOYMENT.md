# Render Deployment & Troubleshooting Guide - MySQL Migration

This document provides a deployment checklist, recommended settings, and troubleshooting guidelines for the WhatsFlow backend after migrating from SQLite to MySQL with Prisma ORM.

## 1. Deployment Checklist

### Render (Backend API Service)
- [ ] **Repository Branch**: Set to `main` (or your active release branch).
- [ ] **Environment Variables**:
  - `DATABASE_URL`: Must be a valid MySQL connection string in the format:
    `DATABASE_URL=mysql://<user>:<password>@<host>:<port>/<database>`
  - `JWT_SECRET`: A secure, secret key for signing JSON Web Tokens.
  - `CLIENT_URL`: The URL of your frontend dashboard (e.g., Vercel deployment URL like `https://whatsflow.vercel.app`).
  - `NODE_ENV`: Set to `production`.
- [ ] **Build Command**:
  ```bash
  npm install && npx prisma generate && npx prisma migrate deploy
  ```
- [ ] **Start Command**:
  ```bash
  npm start
  ```

### Vercel (Frontend Dashboard Client)
- [ ] **NEXT_PUBLIC_API_URL**: Set to point to the Render backend URL (e.g., `https://whatsflow-backend.onrender.com/api`).
- [ ] **NEXT_PUBLIC_SOCKET_URL**: Set to the root URL of the Render backend (e.g., `https://whatsflow-backend.onrender.com`).

---

## 2. Health & Verification Check

Once deployed, query the health check endpoint to verify that both the server is online and the database connection is live:

- **Endpoint**: `GET /api/health`
- **Expected Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "online",
    "database": "connected",
    "environment": "production"
  }
  ```

---

## 3. Common Troubleshooting & Logs

### Compilation Error: GLIBC not found
- **Symptom**: `Error: /lib/x86_64-linux-gnu/libm.so.6: version 'GLIBC_2.38' not found required by: sqlite3`
- **Reason**: SQLite's native binary bindings failed to build/link on the Render image.
- **Resolution**: Fully resolved. All SQLite dependencies (`sqlite3`) have been removed from `package.json`, and database dialect is migrated to native JavaScript `mysql2`.

### Error validating: datasource property `url` is no longer supported (Prisma 7)
- **Symptom**: `P1012: The datasource property url is no longer supported in schema files.`
- **Reason**: Prisma 7 forces separating connection string from the schema.prisma.
- **Resolution**: Fully resolved. Downgraded to standard stable Prisma version `5.22.0` which supports schema-declared database URLs out of the box, preserving simple CommonJS Node project structures.

### Database Connection Failures
- **Symptom**: `Critical Startup Error: Database connection configuration missing or invalid.`
- **Resolution**: Verify that the `DATABASE_URL` environment variable is defined in the Render settings page and starts with `mysql://`.

- **Symptom**: `SequelizeConnectionRefusedError: connect ECONNREFUSED`
- **Resolution**: Ensure the MySQL database is running and accessible externally. Verify the hostname, port, username, and password in the connection string. If using AWS RDS or similar, verify that the Security Group allows inbound traffic from Render's outbound IPs.
