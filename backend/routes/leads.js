const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', leadController.getLeads);
router.post('/', leadController.createLead);
router.get('/:id', contactController.getContactById);
router.put('/:id', leadController.updateLead);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
