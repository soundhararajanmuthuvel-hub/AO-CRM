# Cusman CRM (AO-CRM)

Cusman CRM (AO-CRM) is a production-grade, AI-powered customer growth platform and WhatsApp integration engine built by DSK Technologies. It acts as a middleware and synchronization hub for multi-tenant SaaS platforms, e-commerce systems, and external ERPs.

---

## 🚀 Key Features

* **Multi-Tenant Integration Engine:** Sync Products, Customers, Orders, and Catalogues from external REST APIs (such as Shopify, WooCommerce, or Custom ERPs).
* **WhatsApp Business Web Gateway:** Integrated via `whatsapp-web.js` (Puppeteer browser sandboxing) to send notifications, rich product cards, media, and interactive template messages.
* **Real-time Webhook Receiver Debugger:** Live listener logs for incoming integrations.
* **Automation Engine:** Automated re-engagement rules (Birthday greetings, 30/60/90-day inactivity checks) and AI-assisted reply drafting.
* **Kanban Board Lifecycle:** Visual sales pipeline tracker for tracking order fulfillments and status updates.

---

## 🛠 Tech Stack

* **Backend API Gateway:** Node.js, Express, Sequelize ORM (Prisma/Sequelize models supporting SQLite fallback & Postgres DB).
* **WhatsApp Session Pool:** WhatsApp automation using Puppeteer headless Chrome instances.
* **Frontend Dashboard client:** React, Next.js, Tailwind CSS, Lucide icons.
* **Database Engine:** PostgreSQL (Production) / SQLite (Local/Development).

---

## 📂 Project Structure

```bash
├── backend/                  # Express API Gateway, Controllers, Services & Database layer
│   ├── config/               # Database dialect configurations
│   ├── controllers/          # Business logic handlers (Orders, WhatsApp, Integrations, etc.)
│   ├── middleware/           # Authentication and route protectors
│   ├── models/               # Sequelize Schema Definitions
│   ├── routes/               # API route mount definitions
│   ├── services/             # Puppeteer, Automation, AI and Webhook services
│   └── database.sqlite       # Local fallback SQLite DB file
├── frontend/                 # Next.js Client Dashboard application
│   ├── src/
│   │   ├── app/              # Dashboard pages (Kanban, Inbox, Campaigns, Settings)
│   │   ├── components/       # Visual UI widgets
│   │   └── utils/            # Axios API wrappers
│   └── public/               # Static assets & brand logos
├── docker-compose.yml        # Multi-container sandbox builder
└── production_deployment_guide.md
```

---

## 🔌 ERP Integration & WhatsApp Trigger API

If you have a **"Send WA" (Send WhatsApp) button** inside your ERP, you can send messages using the CRM gateway. The CRM exposes two endpoints depending on your use case:

### Auth Credentials
Your CRM Workspace credentials (from database seed):
* **Workspace API Key:** `wf_live_amudhasurabiy_key`
* **Workspace API Secret:** `amudhasurabiy_secret_123`

---

### Option A: Direct Synchronous Send (Instant Delivery)
Use this endpoint to send a message immediately and wait for WhatsApp verification.

* **Endpoint:** `POST /api/whatsapp/send`
* **Headers:**
  ```http
  Content-Type: application/json
  X-API-KEY: wf_live_amudhasurabiy_key
  X-API-SECRET: amudhasurabiy_secret_123
  ```
* **Payload (JSON):**
  ```json
  {
    "phone": "919988776655",
    "message": "Welcome to Amudhasurabiy Organics! Your order has been dispatched."
  }
  ```
  *(Optional: Add `"fileUrl"` and `"fileType"` if you wish to attach an invoice image/PDF).*

---

### Option B: Queued Background Send (Recommended for bulk notifications)
Use this endpoint to place the message in the database queue and let the background worker process it with anti-ban rate limiting.

* **Endpoint:** `POST /api/messages/send`
* **Headers:**
  ```http
  Content-Type: application/json
  X-API-KEY: wf_live_amudhasurabiy_key
  X-API-SECRET: amudhasurabiy_secret_123
  ```
* **Payload (JSON):**
  ```json
  {
    "phone": "919988776655",
    "message": "Welcome to Amudhasurabiy!"
  }
  ```
  *(Optional: Pass `"productId"` instead of `"message"` to auto-compile and dispatch a rich Product Card card with image, price, and specs).*

---

## 🔍 Synchronization & Error Troubleshooting

### "Request failed with status code 500" Error
If you see this error in your **Error Troubleshooting Log**:
1. It is a sync error originating from the **external ERP API host** (`https://ao-core-production.up.railway.app/`).
2. When the CRM sent a `GET /api/external/customers` or `GET /api/external/orders` request, the ERP's server was offline or returned a `500 Internal Server Error`.
3. If the **Synchronization History Log** shows **SUCCESS** for recent runs (e.g. today's timestamp), the connection has since been restored and the 500 error is purely historical logs.

---

## 🏁 Getting Started

Refer to the [Production Deployment Guide](file:///c:/Users/dines/.gemini/antigravity-ide/scratch/whatsflow/production_deployment_guide.md) for step-by-step instructions on running the development servers or running containerized in Docker Compose.
