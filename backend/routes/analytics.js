const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', analyticsController.getDashboardStats);
router.get('/logs', analyticsController.getAnalyticsLogs);

module.exports = router;
