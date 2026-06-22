const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole(['superadmin']));

router.get('/companies', adminController.getCompanies);
router.get('/revenue', adminController.getRevenue);
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/usage', adminController.getUsage);

module.exports = router;
