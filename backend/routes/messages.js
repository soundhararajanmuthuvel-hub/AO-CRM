const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, messageController.sendMessage);

module.exports = router;
