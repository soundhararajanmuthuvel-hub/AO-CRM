const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', automationController.getRules);
router.put('/:id', automationController.updateRule);
router.post('/simulate', automationController.triggerSimulation);

module.exports = router;
