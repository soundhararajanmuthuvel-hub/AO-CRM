const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.put('/:id', contactController.updateContact);

module.exports = router;
