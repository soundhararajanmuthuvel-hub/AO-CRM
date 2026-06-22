const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/analyze-chat', aiController.analyzeChat);
router.post('/suggest-reply', aiController.suggestReply);

module.exports = router;
