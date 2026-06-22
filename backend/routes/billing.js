const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', billingController.getBillingInfo);
router.post('/checkout', billingController.createCheckoutSession);
router.post('/upgrade', billingController.mockUpgradeWorkspace);

module.exports = router;
