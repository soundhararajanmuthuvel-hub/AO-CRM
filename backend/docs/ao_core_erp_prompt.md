# 📋 Developer Specification: AO Core ERP Sync Endpoints

The Cusman CRM integration expects specific endpoints on the **AO Core ERP** backend (`https://ao-core-production.up.railway.app/`) to retrieve data for Products, Customers, Orders, and Catalogues. 

If these endpoints return `500 Internal Server Error`, the synchronization will fail. Below is the exact prompt and specification to give to the ERP development team to fix these endpoints.

---

## 🛠 Required Endpoints & JSON Specifications

All synchronization requests sent from the CRM include the following headers for authentication:
```http
Authorization: Bearer <ERP_API_KEY>
X-API-KEY: <ERP_API_KEY>
```

---

### 1. Customers Sync Endpoint
* **Method & Path:** `GET /api/external/customers`
* **Query Parameters:** `updated_since` (optional, ISO 8601 string, e.g. `2026-06-24T17:19:31.616Z`)
* **Expected Response (HTTP 200 JSON):**
  The CRM accepts either a raw JSON array of customers, or an object containing `customers` or `data` arrays.
  
  ```json
  [
    {
      "name": "AO Retail Partner",
      "phone": "919800011122",
      "city": "Coimbatore",
      "company": "Organic Hub",
      "tags": "Retail,Wholesale",
      "outstandingAmount": 450.00
    }
  ]
  ```

---

### 2. Orders Sync Endpoint
* **Method & Path:** `GET /api/external/orders`
* **Query Parameters:** `updated_since` (optional, ISO 8601 string)
* **Expected Response (HTTP 200 JSON):**
  The CRM accepts either a raw JSON array of orders, or an object containing `orders` or `data` arrays.
  
  ```json
  [
    {
      "customerName": "Arun Kumar",
      "phone": "919876543210",
      "city": "Chennai",
      "totalValue": 450.00,
      "status": "Confirmed",
      "items": [
        {
          "productName": "ABC Malt",
          "quantity": 3,
          "price": 150.00
        }
      ]
    }
  ]
  ```
  *Note: The `items` field can either be a JSON array (recommended) or a stringified JSON array.*

---

### 3. Products Sync Endpoint
* **Method & Path:** `GET /api/external/products`
* **Query Parameters:** `updated_since` (optional, ISO 8601 string)
* **Expected Response (HTTP 200 JSON):**
  ```json
  [
    {
      "name": "Sprouted Ragi Malt",
      "sku": "AO-RAGI-100",
      "price": 190.00,
      "stock": 120,
      "category": "Health Drinks",
      "brand": "Amudhasurabiy",
      "description": "Premium Sprouted Ragi Malt",
      "benefits": "Strengthens bones, rich in calcium",
      "imageUrl": "https://example.com/ragi.jpg"
    }
  ]
  ```

---

### 4. Health Check Endpoint
* **Method & Path:** `GET /api/external/health`
* **Expected Response (HTTP 200 JSON):**
  ```json
  {
    "status": "online"
  }
  ```

---

## 💻 Sample Node.js / Express Implementation for ERP Developers
ERP developers can use this boilerplate code to quickly mock or implement endpoints that are 100% compatible with the CRM:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// API Key Auth Middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!apiKey || apiKey !== 'ao_live_2b2ff0efaa001a57a4fbd643ec64c121eff339f4f2067464') {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

// Health Check
app.get('/api/external/health', (req, res) => {
  res.json({ status: 'online' });
});

// Customers list
app.get('/api/external/customers', authMiddleware, (req, res) => {
  const updatedSince = req.query.updated_since; // Use to filter newer records
  res.json([
    { name: "AO Retail Partner", phone: "919800011122", city: "Coimbatore", company: "Organic Hub", tags: "Retail", outstandingAmount: 0.00 },
    { name: "AO Bulk Buyer", phone: "919833445566", city: "Bangalore", company: "Supermart Ltd", tags: "Supermarket", outstandingAmount: 450.00 }
  ]);
});

// Orders list
app.get('/api/external/orders', authMiddleware, (req, res) => {
  res.json([
    { customerName: "Arun Kumar", phone: "919876543210", city: "Chennai", totalValue: 450.00, status: "Confirmed", items: [{ productName: "ABC Malt", quantity: 3, price: 150.00 }] },
    { customerName: "Deepa Raj", phone: "919812345678", city: "Salem", totalValue: 390.00, status: "Draft", items: [{ productName: "Beetroot Malt", quantity: 2, price: 195.00 }] }
  ]);
});

// Start Server
app.listen(8080, () => console.log('ERP API running on port 8080'));
```
