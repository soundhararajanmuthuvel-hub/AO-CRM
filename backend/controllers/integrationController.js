const { ApiConnection, MessageQueue, SyncHistory, WebhookLog } = require('../models');
const integrationService = require('../services/integrationService');
const aiService = require('../services/aiService');

exports.test = async (req, res) => {
  try {
    const { platform, baseUrl, apiKey, webhookSecret, frontendUrl, backendApiUrl } = req.body;
    
    const apiHost = backendApiUrl || baseUrl;
    if (!apiHost) {
      return res.status(400).json({ error: 'Backend API URL is required.' });
    }

    // Check for Frontend URL entered in Backend API URL field
    if (apiHost.includes('erp.amudhasurabiy.com') && !frontendUrl) {
      return res.status(400).json({ error: 'Frontend URL detected. Please enter Backend API URL.' });
    }

    const testResult = await integrationService.testConnection({
      platform,
      baseUrl: apiHost,
      frontendUrl,
      backendApiUrl: apiHost,
      apiKey,
      webhookSecret,
      workspaceId: req.workspaceId
    });

    return res.json({
      success: true,
      status: testResult.status,
      detected: testResult.detected
    });
  } catch (error) {
    console.error('Test connection route error:', error);
    return res.status(500).json({ error: 'Failed to test connection credentials' });
  }
};

exports.connect = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id, name, platform, baseUrl, apiKey, apiSecret, bearerToken, webhookSecret, fieldMapping, frontendUrl, backendApiUrl } = req.body;

    const apiHost = backendApiUrl || baseUrl;
    if (!name || !platform || !apiHost) {
      return res.status(400).json({ error: 'Connection Name, Platform, and Backend API URL are required.' });
    }

    let connection;
    if (id) {
      connection = await ApiConnection.findOne({ where: { id, workspaceId } });
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found.' });
      }
      await connection.update({
        name,
        platform,
        baseUrl: apiHost,
        frontendUrl: frontendUrl || null,
        backendApiUrl: apiHost,
        apiKey,
        apiSecret,
        bearerToken,
        webhookSecret,
        fieldMapping: fieldMapping || connection.fieldMapping
      });
    } else {
      connection = await ApiConnection.create({
        workspaceId,
        name,
        platform,
        baseUrl: apiHost,
        frontendUrl: frontendUrl || null,
        backendApiUrl: apiHost,
        apiKey,
        apiSecret,
        bearerToken,
        webhookSecret,
        fieldMapping: fieldMapping || '{}'
      });
    }

    // Set Webhook URL target for external system
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/integrations/webhooks/${connection.id}`;
    connection.webhookUrl = webhookUrl;
    await connection.save();

    // Auto discover resources supported
    const testResult = await integrationService.testConnection(connection);
    connection.status = testResult.status;

    if (testResult.status === 'Connected') {
      connection.detectedResources = JSON.stringify(testResult.detected);
    } else {
      connection.detectedResources = '[]';
    }
    
    await connection.save();

    return res.json({
      success: true,
      message: 'Integration connection successfully established.',
      connection
    });
  } catch (error) {
    console.error('Connect route error:', error);
    return res.status(500).json({ error: 'Failed to connect integration' });
  }
};

exports.syncProducts = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { connectionId } = req.body;

    const connection = await ApiConnection.findOne({ where: { id: connectionId, workspaceId } });
    if (!connection) {
      return res.status(404).json({ error: 'Active connection not found.' });
    }

    const count = await integrationService.syncProducts(connection.id);
    return res.json({
      success: true,
      message: `Successfully synchronized ${count} products into Cusman CRM.`,
      count
    });
  } catch (error) {
    console.error('Sync products route error:', error);
    return res.status(500).json({ error: error.message || 'Product synchronization failed.' });
  }
};

exports.syncCustomers = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { connectionId } = req.body;

    const connection = await ApiConnection.findOne({ where: { id: connectionId, workspaceId } });
    if (!connection) {
      return res.status(404).json({ error: 'Active connection not found.' });
    }

    const count = await integrationService.syncCustomers(connection.id);
    return res.json({
      success: true,
      message: `Successfully synchronized ${count} customers into Cusman CRM.`,
      count
    });
  } catch (error) {
    console.error('Sync customers route error:', error);
    return res.status(500).json({ error: error.message || 'Customer synchronization failed.' });
  }
};

exports.syncOrders = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { connectionId } = req.body;

    const connection = await ApiConnection.findOne({ where: { id: connectionId, workspaceId } });
    if (!connection) {
      return res.status(404).json({ error: 'Active connection not found.' });
    }

    const count = await integrationService.syncOrders(connection.id);
    return res.json({
      success: true,
      message: `Successfully synchronized ${count} orders into Cusman CRM.`,
      count
    });
  } catch (error) {
    console.error('Sync orders route error:', error);
    return res.status(500).json({ error: error.message || 'Order synchronization failed.' });
  }
};

exports.syncCatalogues = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { connectionId } = req.body;

    const connection = await ApiConnection.findOne({ where: { id: connectionId, workspaceId } });
    if (!connection) {
      return res.status(404).json({ error: 'Active connection not found.' });
    }

    const count = await integrationService.syncCatalogues(connection.id);
    return res.json({
      success: true,
      message: `Successfully synchronized ${count} catalogues in Cusman CRM.`,
      count
    });
  } catch (error) {
    console.error('Sync catalogues route error:', error);
    return res.status(500).json({ error: error.message || 'Catalogue synchronization failed.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const connections = await ApiConnection.findAll({ where: { workspaceId } });
    const waitingCount = await MessageQueue.count({
      where: { workspaceId, status: 'WaitingForConnection' }
    });
    return res.json({
      connections,
      waitingCount
    });
  } catch (error) {
    console.error('Get status route error:', error);
    return res.status(500).json({ error: 'Failed to retrieve connection statuses' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const webhookSecretHeader = req.headers['x-webhook-secret'];

    const connection = await ApiConnection.findByPk(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection mapping webhook not found' });
    }

    // Validate webhook secret if configured
    if (connection.webhookSecret && connection.webhookSecret !== webhookSecretHeader) {
      await WebhookLog.create({
        workspaceId: connection.workspaceId,
        connectionId: connection.id,
        receivedAt: new Date(),
        source: req.headers['x-webhook-topic'] || 'unauthorized-webhook',
        payload: JSON.stringify(req.body || {}),
        status: 'Failed',
        errorMessage: 'Unauthorized: Invalid X-WEBHOOK-SECRET header'
      });
      return res.status(401).json({ error: 'Not authorized, invalid webhook secret.' });
    }

    const topic = req.headers['x-webhook-topic'] || req.query.topic || req.body.topic || 'product.created';
    const payload = req.body;

    // Create execution log entry
    const log = await WebhookLog.create({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      receivedAt: new Date(),
      source: `${connection.platform} / ${topic}`,
      payload: JSON.stringify(payload || {}),
      status: 'Processing'
    });

    // Call service to process payload asynchronously
    integrationService.handleWebhookPayload(connection.id, topic, payload)
      .then(async () => {
        await log.update({ status: 'Success' });
      })
      .catch(async (err) => {
        console.error(`[Webhook Handler Async Err] Connection: ${connectionId}`, err);
        await log.update({ status: 'Failed', errorMessage: err.message });
      });

    return res.json({
      success: true
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Failed to process webhook payload' });
  }
};

exports.autoMap = async (req, res) => {
  try {
    const { payload, platformHint } = req.body;
    
    if (!payload) {
      return res.status(400).json({ error: 'Payload data is required.' });
    }

    const mapping = await aiService.autoMapSchema(payload, platformHint);

    return res.json({
      success: true,
      mapping
    });
  } catch (error) {
    console.error('Auto map route error:', error);
    return res.status(500).json({ error: 'AI auto-mapping failed.' });
  }
};

exports.getSyncHistory = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { connectionId } = req.query;

    if (!connectionId) {
      return res.status(400).json({ error: 'Connection ID is required.' });
    }

    const history = await SyncHistory.findAll({
      where: { connectionId, workspaceId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get sync history route error:', error);
    return res.status(500).json({ error: 'Failed to retrieve synchronization log history.' });
  }
};

exports.getWebhookLogs = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { connectionId } = req.query;

    if (!connectionId) {
      return res.status(400).json({ error: 'Connection ID is required.' });
    }

    const logs = await WebhookLog.findAll({
      where: { connectionId, workspaceId },
      order: [['receivedAt', 'DESC']],
      limit: 50
    });

    return res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve webhook debugger logs.' });
  }
};
