const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', leadController.getLeads);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);

module.exports = router;
