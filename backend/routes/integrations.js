const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

// Public Webhook receiver
router.post('/webhooks/:connectionId', integrationController.handleWebhook);

// Public Health Check
router.get('/health', (req, res) => res.json({ status: 'online' }));

// Protected routes (require JWT verification)
router.use(protect);

router.post('/test', integrationController.test);
router.post('/connect', integrationController.connect);
router.post('/auto-map', integrationController.autoMap);
router.post('/sync-products', integrationController.syncProducts);
router.post('/sync-customers', integrationController.syncCustomers);
router.post('/sync-orders', integrationController.syncOrders);
router.post('/sync-catalogues', integrationController.syncCatalogues);
router.get('/status', integrationController.getStatus);
router.post('/clear-errors', integrationController.clearErrors);
router.get('/sync-history', integrationController.getSyncHistory);
router.get('/webhook-logs', integrationController.getWebhookLogs);

module.exports = router;
