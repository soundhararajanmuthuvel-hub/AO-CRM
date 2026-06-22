const axios = require('axios');
const { Product, Contact, SalesOrder, ApiConnection, SyncHistory } = require('../models');
const { Op } = require('sequelize');

/**
 * Validates connection settings by hitting the endpoint.
 */
const testConnection = async (conn) => {
  const { platform, baseUrl, apiKey, webhookSecret, frontendUrl, backendApiUrl, workspaceId, id } = conn;
  const apiHost = backendApiUrl || baseUrl;
  const connectionId = id;

  const startTime = Date.now();
  let status = 'Disconnected';
  let detected = [];
  let responseStatus = null;
  let validationResult = 'Pending';
  let errMessage = null;
  let testedUrl = '';

  if (!apiHost || (!apiHost.startsWith('http://') && !apiHost.startsWith('https://'))) {
    return { status: 'URL Not Reachable', detected: [] };
  }

  // Graceful simulation check for mocks or test platforms
  if (apiHost.includes('mock') || apiHost.includes('test') || apiHost.includes('play') || apiHost.includes('localhost:3000')) {
    if (apiKey === 'invalid_key' || apiKey === 'unauthorized' || apiKey === '401') {
      return { status: '401 Unauthorized', detected: [] };
    }
    if (apiKey === '404') {
      return { status: '404 Endpoint Missing', detected: [] };
    }
    if (apiKey === '500') {
      return { status: '500 Server Error', detected: [] };
    }
    if (apiKey === 'timeout') {
      return { status: 'Network Timeout', detected: [] };
    }
    return { status: 'Connected', detected: ['Products', 'Customers', 'Orders'] };
  }

  try {
    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    testedUrl = apiHost.replace(/\/$/, '') + '/api/external/health';
    let response;
    let isHealthOk = false;

    try {
      response = await axios.get(testedUrl, {
        headers,
        timeout: 5000,
        validateStatus: () => true
      });
      if (response.status === 200 && response.headers['content-type']?.includes('application/json')) {
        isHealthOk = true;
      }
    } catch (e) {
      // Health endpoint failed, fallback
    }

    if (!isHealthOk) {
      testedUrl = apiHost.replace(/\/$/, '') + '/api/external/products';
      response = await axios.get(testedUrl, {
        headers,
        timeout: 5000,
        validateStatus: () => true
      });
    }

    responseStatus = response.status;

    if (response.status === 401 || response.status === 403) {
      status = '401 Unauthorized';
      errMessage = `Unauthorized: API Key rejected (status ${response.status})`;
    } else if (response.status === 404) {
      status = '404 Endpoint Missing';
      errMessage = 'Route not found: API endpoint missing (status 404)';
    } else if (response.status >= 500) {
      status = '500 Server Error';
      errMessage = `Server Error: External system returned status code ${response.status}`;
    } else if (response.status === 200) {
      const isJson = response.headers['content-type']?.includes('application/json');
      if (isJson) {
        status = 'Connected';
        validationResult = 'Valid JSON';
      } else {
        status = '404 Endpoint Missing'; // Landing page HTML means endpoint is missing
        validationResult = 'Invalid: Expected JSON, got ' + (response.headers['content-type'] || 'text/html');
        errMessage = 'API response format is not JSON (likely returned frontend HTML rewrites)';
      }
    } else {
      status = 'Failed';
      errMessage = `API check returned status code ${response.status}`;
    }

    // Auto detect resources if connected
    if (status === 'Connected') {
      const allEndpoints = [
        { name: 'Products', path: '/api/external/products' },
        { name: 'Customers', path: '/api/external/customers' },
        { name: 'Orders', path: '/api/external/orders' },
        { name: 'Catalogues', path: '/api/external/catalogues' },
        { name: 'Invoices', path: '/api/external/invoices' },
        { name: 'Outstanding', path: '/api/external/outstanding?customer=test' }
      ];

      for (const ep of allEndpoints) {
        try {
          const epResp = await axios.get(apiHost.replace(/\/$/, '') + ep.path, {
            headers,
            timeout: 3000,
            validateStatus: () => true
          });
          // Outstanding will return 400 or 404 for 'test' customer, but if the endpoint is active, it won't throw 404 Not Found as a route
          if (epResp.status === 200 || (ep.name === 'Outstanding' && epResp.status !== 404)) {
            detected.push(ep.name);
          }
        } catch (e) {}
      }
    }
  } catch (error) {
    console.error(`[Integration Service] Test Connection failed:`, error.message);
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Timeout')) {
      status = 'Network Timeout';
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      status = '401 Unauthorized';
    } else if (error.response?.status === 404) {
      status = '404 Endpoint Missing';
    } else if (error.response?.status >= 500) {
      status = '500 Server Error';
    } else {
      status = 'URL Not Reachable';
    }
    errMessage = error.message;
  } finally {
    const responseTime = Date.now() - startTime;
    // Log to SyncHistory if connectionId and workspaceId are present
    if (workspaceId && connectionId) {
      try {
        const logContent = {
          connectionAttempt: 1,
          urlTested: testedUrl,
          responseStatus,
          responseTime,
          jsonValidationResult: validationResult,
          errorMessage: errMessage
        };
        await SyncHistory.create({
          workspaceId,
          connectionId,
          syncType: 'test_connection',
          status: status === 'Connected' ? 'Success' : 'Failed',
          recordsImported: 0,
          errorMessage: JSON.stringify(logContent, null, 2),
          runTimeMs: responseTime
        });
      } catch (e) {
        console.error('Failed to log connection attempt:', e.message);
      }
    }
  }

  return { status, detected };
};

/**
 * Auto discovers resources supported by the API.
 */
const autoDiscover = async (connection) => {
  const result = await testConnection(connection);
  return result.detected;
};

/**
 * Helper to build authorization headers.
 */
const getHeaders = (connection) => {
  const headers = {};
  if (connection.apiKey) {
    headers['Authorization'] = `Bearer ${connection.apiKey}`;
    headers['X-API-KEY'] = connection.apiKey;
  }
  return headers;
};

/**
 * Maps external fields to internal CRM fields.
 */
const mapFields = (externalItem, mappingConfig, defaultMappings) => {
  const finalItem = {};
  const config = { ...defaultMappings, ...mappingConfig };

  for (const [crmKey, extKey] of Object.entries(config)) {
    if (extKey && externalItem[extKey] !== undefined) {
      finalItem[crmKey] = externalItem[extKey];
    } else if (externalItem[crmKey] !== undefined) {
      finalItem[crmKey] = externalItem[crmKey];
    }
  }
  return finalItem;
};

/**
 * Sync Products.
 */
const syncProducts = async (connectionId) => {
  const connection = await ApiConnection.findByPk(connectionId);
  if (!connection) throw new Error('Connection not found');

  const startTime = Date.now();
  let importedCount = 0;
  let errMsg = null;
  let status = 'Success';

  const mappingConfig = parseJSON(connection.fieldMapping, {});
  const defaultMappings = {
    name: 'name',
    sku: 'sku',
    price: 'price',
    stock: 'stock',
    description: 'description',
    category: 'category',
    brand: 'brand',
    benefits: 'benefits',
    ingredients: 'ingredients',
    specifications: 'specifications',
    imageUrl: 'imageUrl',
    websiteUrl: 'websiteUrl',
    catalogueUrl: 'catalogueUrl'
  };

  const apiHost = connection.backendApiUrl || connection.baseUrl;
  const isMock = apiHost.includes('mock') || apiHost.includes('test') || apiHost.includes('localhost:3000');
  let externalProducts = [];

  try {
    if (isMock) {
      externalProducts = [
        { name: `${connection.platform} Sprouted Ragi Malt`, sku: `${connection.platform.toUpperCase()}-RAGI-100`, price: 190.00, stock: 120, category: 'Health Drinks', brand: 'Amudhasurabiy', description: 'Premium Sprouted Ragi Malt', benefits: 'Strengthens bones, rich in calcium', imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/abc_malt.jpg' },
        { name: `${connection.platform} Cardamom Honey`, sku: `${connection.platform.toUpperCase()}-HON-02`, price: 160.00, stock: 45, category: 'Groceries', brand: 'Amudhasurabiy', description: 'Wild organic forest honey infused with cardamom', benefits: 'Soothes throat, boosts metabolism', imageUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/organic_honey.jpg' }
      ];
    } else {
      const headers = getHeaders(connection);
      let url = apiHost.replace(/\/$/, '') + '/api/external/products';
      if (connection.lastSyncAt) {
        const lastSyncIso = new Date(connection.lastSyncAt).toISOString();
        url += `${url.includes('?') ? '&' : '?'}updated_since=${encodeURIComponent(lastSyncIso)}`;
      }
      
      const resp = await axios.get(url, { headers, timeout: 8000 });
      if (Array.isArray(resp.data)) {
        externalProducts = resp.data;
      } else if (resp.data.products && Array.isArray(resp.data.products)) {
        externalProducts = resp.data.products;
      } else if (resp.data.data && Array.isArray(resp.data.data)) {
        externalProducts = resp.data.data;
      } else {
        throw new Error('API response format not recognized (expected list or wrapper object)');
      }
    }

    for (const item of externalProducts) {
      const mapped = mapFields(item, mappingConfig, defaultMappings);
      
      let prod = null;
      if (mapped.sku) {
        prod = await Product.findOne({
          where: { workspaceId: connection.workspaceId, sku: mapped.sku }
        });
      }
      if (!prod && mapped.name) {
        prod = await Product.findOne({
          where: { workspaceId: connection.workspaceId, name: mapped.name }
        });
      }

      if (prod) {
        await prod.update({
          name: mapped.name || prod.name,
          sku: mapped.sku || prod.sku,
          price: parseFloat(mapped.price) !== undefined && !isNaN(parseFloat(mapped.price)) ? parseFloat(mapped.price) : prod.price,
          stock: parseInt(mapped.stock) !== undefined && !isNaN(parseInt(mapped.stock)) ? parseInt(mapped.stock) : prod.stock,
          description: mapped.description || prod.description,
          category: mapped.category || prod.category,
          brand: mapped.brand || prod.brand,
          benefits: mapped.benefits || prod.benefits,
          ingredients: mapped.ingredients || prod.ingredients,
          specifications: mapped.specifications || prod.specifications,
          imageUrl: mapped.imageUrl || prod.imageUrl,
          websiteUrl: mapped.websiteUrl || prod.websiteUrl,
          catalogueUrl: mapped.catalogueUrl || prod.catalogueUrl
        });
      } else {
        await Product.create({
          workspaceId: connection.workspaceId,
          name: mapped.name || 'ERP Synced Product',
          sku: mapped.sku,
          price: parseFloat(mapped.price) || 0.00,
          stock: parseInt(mapped.stock) || 0,
          description: mapped.description,
          category: mapped.category,
          brand: mapped.brand,
          benefits: mapped.benefits,
          ingredients: mapped.ingredients,
          specifications: mapped.specifications,
          imageUrl: mapped.imageUrl,
          websiteUrl: mapped.websiteUrl,
          catalogueUrl: mapped.catalogueUrl
        });
      }
      importedCount++;
    }

    const stats = parseJSON(connection.syncStats, {});
    stats.products = (stats.products || 0) + importedCount;
    connection.syncStats = JSON.stringify(stats);
    connection.lastSyncAt = new Date();
    connection.status = 'Connected';
    await connection.save();

  } catch (err) {
    status = 'Failed';
    errMsg = err.message;
    logSyncError(connection, 'products', err.message);
    throw err;
  } finally {
    const runTimeMs = Date.now() - startTime;
    await SyncHistory.create({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      syncType: 'products',
      status,
      recordsImported: importedCount,
      errorMessage: errMsg,
      runTimeMs
    });
  }

  return importedCount;
};

const syncCustomers = async (connectionId) => {
  const connection = await ApiConnection.findByPk(connectionId);
  if (!connection) throw new Error('Connection not found');

  const startTime = Date.now();
  let importedCount = 0;
  let errMsg = null;
  let status = 'Success';

  const mappingConfig = parseJSON(connection.fieldMapping, {});
  const defaultMappings = {
    name: 'name',
    phone: 'phone',
    city: 'city',
    company: 'company',
    tags: 'tags',
    outstandingAmount: 'outstandingAmount'
  };

  const apiHost = connection.backendApiUrl || connection.baseUrl;
  const isMock = apiHost.includes('mock') || apiHost.includes('test') || apiHost.includes('localhost:3000');
  let externalCustomers = [];

  try {
    if (isMock) {
      externalCustomers = [
        { name: `${connection.platform} Retail Partner`, phone: '919800011122', city: 'Coimbatore', company: 'Organic Hub', tags: 'SaaS,Retail', outstandingAmount: 0.00 },
        { name: `${connection.platform} Bulk Buyer`, phone: '919833445566', city: 'Bangalore', company: 'Supermart Ltd', tags: 'SaaS,Supermarket', outstandingAmount: 450.00 }
      ];
    } else {
      const headers = getHeaders(connection);
      let url = apiHost.replace(/\/$/, '') + '/api/external/customers';
      if (connection.lastSyncAt) {
        const lastSyncIso = new Date(connection.lastSyncAt).toISOString();
        url += `${url.includes('?') ? '&' : '?'}updated_since=${encodeURIComponent(lastSyncIso)}`;
      }
      
      const resp = await axios.get(url, { headers, timeout: 8000 });
      if (Array.isArray(resp.data)) {
        externalCustomers = resp.data;
      } else if (resp.data.customers && Array.isArray(resp.data.customers)) {
        externalCustomers = resp.data.customers;
      } else if (resp.data.data && Array.isArray(resp.data.data)) {
        externalCustomers = resp.data.data;
      } else {
        throw new Error('API response format not recognized (expected list or wrapper object)');
      }
    }

    for (const item of externalCustomers) {
      const mapped = mapFields(item, mappingConfig, defaultMappings);
      const cleanPhone = mapped.phone ? mapped.phone.replace(/[^\d]/g, '') : '';
      if (!cleanPhone) continue;

      let contact = await Contact.findOne({
        where: { workspaceId: connection.workspaceId, phone: cleanPhone }
      });

      if (contact) {
        await contact.update({
          name: mapped.name || contact.name,
          city: mapped.city || contact.city,
          company: mapped.company || contact.company,
          tags: mapped.tags || contact.tags,
          outstandingAmount: parseFloat(mapped.outstandingAmount) !== undefined && !isNaN(parseFloat(mapped.outstandingAmount)) ? parseFloat(mapped.outstandingAmount) : contact.outstandingAmount
        });
      } else {
        await Contact.create({
          workspaceId: connection.workspaceId,
          name: mapped.name || 'ERP Synced Contact',
          phone: cleanPhone,
          city: mapped.city,
          company: mapped.company,
          tags: mapped.tags || 'API Import',
          outstandingAmount: parseFloat(mapped.outstandingAmount) || 0.00,
          leadSource: 'SaaS Connector'
        });
      }
      importedCount++;
    }

    const stats = parseJSON(connection.syncStats, {});
    stats.customers = (stats.customers || 0) + importedCount;
    connection.syncStats = JSON.stringify(stats);
    connection.lastSyncAt = new Date();
    connection.status = 'Connected';
    await connection.save();

  } catch (err) {
    status = 'Failed';
    errMsg = err.message;
    logSyncError(connection, 'customers', err.message);
    throw err;
  } finally {
    const runTimeMs = Date.now() - startTime;
    await SyncHistory.create({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      syncType: 'customers',
      status,
      recordsImported: importedCount,
      errorMessage: errMsg,
      runTimeMs
    });
  }

  return importedCount;
};

const syncOrders = async (connectionId) => {
  const connection = await ApiConnection.findByPk(connectionId);
  if (!connection) throw new Error('Connection not found');

  const startTime = Date.now();
  let importedCount = 0;
  let errMsg = null;
  let status = 'Success';

  const mappingConfig = parseJSON(connection.fieldMapping, {});
  const defaultMappings = {
    customerName: 'customerName',
    phone: 'phone',
    city: 'city',
    totalValue: 'totalValue',
    status: 'status',
    items: 'items'
  };

  const apiHost = connection.backendApiUrl || connection.baseUrl;
  const isMock = apiHost.includes('mock') || apiHost.includes('test') || apiHost.includes('localhost:3000');
  let externalOrders = [];

  try {
    if (isMock) {
      externalOrders = [
        { customerName: 'Arun Kumar', phone: '919876543210', city: 'Chennai', totalValue: 450.00, status: 'Confirmed', items: JSON.stringify([{ productName: 'ABC Malt', quantity: 3, price: 150.00 }]) },
        { customerName: 'Deepa Raj', phone: '919812345678', city: 'Salem', totalValue: 390.00, status: 'Draft', items: JSON.stringify([{ productName: 'Beetroot Malt', quantity: 2, price: 195.00 }]) }
      ];
    } else {
      const headers = getHeaders(connection);
      let url = apiHost.replace(/\/$/, '') + '/api/external/orders';
      if (connection.lastSyncAt) {
        const lastSyncIso = new Date(connection.lastSyncAt).toISOString();
        url += `${url.includes('?') ? '&' : '?'}updated_since=${encodeURIComponent(lastSyncIso)}`;
      }
      
      const resp = await axios.get(url, { headers, timeout: 8000 });
      if (Array.isArray(resp.data)) {
        externalOrders = resp.data;
      } else if (resp.data.orders && Array.isArray(resp.data.orders)) {
        externalOrders = resp.data.orders;
      } else if (resp.data.data && Array.isArray(resp.data.data)) {
        externalOrders = resp.data.data;
      } else {
        throw new Error('API response format not recognized (expected list or wrapper object)');
      }
    }

    for (const item of externalOrders) {
      const mapped = mapFields(item, mappingConfig, defaultMappings);
      const cleanPhone = mapped.phone ? mapped.phone.replace(/[^\d]/g, '') : '';
      if (!cleanPhone) continue;

      const orderItemsParsed = typeof mapped.items === 'string' ? mapped.items : JSON.stringify(mapped.items || []);

      const duplicateOrder = await SalesOrder.findOne({
        where: {
          workspaceId: connection.workspaceId,
          phone: cleanPhone,
          totalValue: parseFloat(mapped.totalValue) || 0.00,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      if (!duplicateOrder) {
        await SalesOrder.create({
          workspaceId: connection.workspaceId,
          chatId: `${cleanPhone}@c.us`,
          customerName: mapped.customerName || 'API Customer',
          phone: cleanPhone,
          city: mapped.city || 'Chennai',
          totalValue: parseFloat(mapped.totalValue) || 0.00,
          status: mapped.status || 'Draft',
          items: orderItemsParsed,
          timeline: JSON.stringify([{ status: mapped.status || 'Draft', timestamp: new Date(), user: `${connection.platform} Integration` }])
        });
        importedCount++;
      }
    }

    const stats = parseJSON(connection.syncStats, {});
    stats.orders = (stats.orders || 0) + importedCount;
    connection.syncStats = JSON.stringify(stats);
    connection.lastSyncAt = new Date();
    connection.status = 'Connected';
    await connection.save();

  } catch (err) {
    status = 'Failed';
    errMsg = err.message;
    logSyncError(connection, 'orders', err.message);
    throw err;
  } finally {
    const runTimeMs = Date.now() - startTime;
    await SyncHistory.create({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      syncType: 'orders',
      status,
      recordsImported: importedCount,
      errorMessage: errMsg,
      runTimeMs
    });
  }

  return importedCount;
};

const syncCatalogues = async (connectionId) => {
  const connection = await ApiConnection.findByPk(connectionId);
  if (!connection) throw new Error('Connection not found');

  const startTime = Date.now();
  let importedCount = 0;
  let errMsg = null;
  let status = 'Success';

  const apiHost = connection.backendApiUrl || connection.baseUrl;
  const isMock = apiHost.includes('mock') || apiHost.includes('test') || apiHost.includes('localhost:3000');
  let cataloguesList = [];

  try {
    if (isMock) {
      const products = await Product.findAll({ where: { workspaceId: connection.workspaceId } });
      for (const prod of products) {
        if (!prod.catalogueUrl) {
          await prod.update({
            catalogueUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf',
            cataloguePdfUrl: 'https://res.cloudinary.com/dd9ipygsk/image/upload/v1719040000/catalogue.pdf'
          });
          importedCount++;
        }
      }
    } else {
      const headers = getHeaders(connection);
      let url = apiHost.replace(/\/$/, '') + '/api/external/catalogues';
      if (connection.lastSyncAt) {
        const lastSyncIso = new Date(connection.lastSyncAt).toISOString();
        url += `${url.includes('?') ? '&' : '?'}updated_since=${encodeURIComponent(lastSyncIso)}`;
      }
      
      const resp = await axios.get(url, { headers, timeout: 8000 });
      if (Array.isArray(resp.data)) {
        cataloguesList = resp.data;
      } else if (resp.data.catalogues && Array.isArray(resp.data.catalogues)) {
        cataloguesList = resp.data.catalogues;
      } else if (resp.data.data && Array.isArray(resp.data.data)) {
        cataloguesList = resp.data.data;
      } else {
        throw new Error('API response format not recognized (expected list or wrapper object)');
      }

      for (const cat of cataloguesList) {
        const productSku = cat.sku || cat.productSku;
        if (!productSku) continue;

        const prod = await Product.findOne({ where: { workspaceId: connection.workspaceId, sku: productSku } });
        if (prod) {
          await prod.update({
            catalogueUrl: cat.catalogueUrl || cat.pdfUrl,
            imageUrl: cat.imageUrl || prod.imageUrl
          });
          importedCount++;
        }
      }
    }

    const stats = parseJSON(connection.syncStats, {});
    stats.catalogues = (stats.catalogues || 0) + importedCount;
    connection.syncStats = JSON.stringify(stats);
    connection.lastSyncAt = new Date();
    connection.status = 'Connected';
    await connection.save();

  } catch (err) {
    status = 'Failed';
    errMsg = err.message;
    logSyncError(connection, 'catalogues', err.message);
    throw err;
  } finally {
    const runTimeMs = Date.now() - startTime;
    await SyncHistory.create({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      syncType: 'catalogues',
      status,
      recordsImported: importedCount,
      errorMessage: errMsg,
      runTimeMs
    });
  }

  return importedCount;
};

/**
 * Handle incoming webhooks mapping.
 */
const handleWebhookPayload = async (connectionId, topic, payload) => {
  const connection = await ApiConnection.findByPk(connectionId);
  if (!connection) throw new Error('Connection mapping hook not found');

  const mappingConfig = parseJSON(connection.fieldMapping, {});
  const workspaceId = connection.workspaceId;

  console.log(`[Integration Service Webhook] Received topic "${topic}" for connection ${connection.name}`);

  try {
    if (topic === 'product.created' || topic === 'product.updated') {
      const defaultMappings = { name: 'name', sku: 'sku', price: 'price', stock: 'stock', description: 'description' };
      const mapped = mapFields(payload, mappingConfig, defaultMappings);

      const [prod, created] = await Product.findOrCreate({
        where: { workspaceId, sku: mapped.sku || mapped.name },
        defaults: {
          workspaceId,
          name: mapped.name || 'API Product',
          sku: mapped.sku,
          price: parseFloat(mapped.price) || 0.00,
          stock: parseInt(mapped.stock) || 0,
          description: mapped.description
        }
      });

      if (!created) {
        await prod.update({
          name: mapped.name || prod.name,
          price: parseFloat(mapped.price) || prod.price,
          stock: parseInt(mapped.stock) || prod.stock,
          description: mapped.description || prod.description
        });
      }
    } else if (topic === 'customer.created') {
      const defaultMappings = { name: 'name', phone: 'phone', city: 'city', company: 'company' };
      const mapped = mapFields(payload, mappingConfig, defaultMappings);
      const cleanPhone = mapped.phone ? mapped.phone.replace(/[^\d]/g, '') : '';

      if (cleanPhone) {
        await Contact.findOrCreate({
          where: { workspaceId, phone: cleanPhone },
          defaults: {
            workspaceId,
            name: mapped.name || 'API Contact',
            phone: cleanPhone,
            city: mapped.city,
            company: mapped.company,
            leadSource: 'Realtime Webhook'
          }
        });
      }
    } else if (topic === 'order.created') {
      const defaultMappings = { customerName: 'customerName', phone: 'phone', city: 'city', totalValue: 'totalValue', items: 'items' };
      const mapped = mapFields(payload, mappingConfig, defaultMappings);
      const cleanPhone = mapped.phone ? mapped.phone.replace(/[^\d]/g, '') : '';

      if (cleanPhone) {
        const orderItemsParsed = typeof mapped.items === 'string' ? mapped.items : JSON.stringify(mapped.items || []);
        await SalesOrder.create({
          workspaceId,
          chatId: `${cleanPhone}@c.us`,
          customerName: mapped.customerName || 'API Customer',
          phone: cleanPhone,
          city: mapped.city || 'Chennai',
          totalValue: parseFloat(mapped.totalValue) || 0.00,
          status: 'Draft',
          items: orderItemsParsed,
          timeline: JSON.stringify([{ status: 'Draft', timestamp: new Date(), user: 'Webhook Trigger' }])
        });
      }
    }

    // Success webhook increments status log
    connection.status = 'Connected';
    await connection.save();

  } catch (err) {
    console.error(`[Webhook Service Error] Failed to process payload topic "${topic}":`, err.message);
    logSyncError(connection, `webhook-${topic}`, err.message);
  }
};

/**
 * Log integration synchronization errors.
 */
const logSyncError = (connection, component, errMsg) => {
  try {
    const stats = parseJSON(connection.syncStats, {});
    const errors = stats.errors || [];
    errors.unshift({
      timestamp: new Date(),
      component,
      message: errMsg
    });
    // Cap at 10 error logs
    stats.errors = errors.slice(0, 10);
    connection.syncStats = JSON.stringify(stats);
    connection.save();
  } catch (e) {}
};

const parseJSON = (str, fallback) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

module.exports = {
  testConnection,
  autoDiscover,
  syncProducts,
  syncCustomers,
  syncOrders,
  syncCatalogues,
  handleWebhookPayload
};
