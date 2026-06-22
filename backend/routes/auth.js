const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limit authentication routes specifically (e.g. max 15 login attempts per window)
const authLimiter = rateLimiter(15, 15 * 60 * 1000);

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, authController.getWorkspaceUsers);
router.put('/workspace', protect, authController.updateWorkspace);
router.post('/workspace/rotate-api-keys', protect, authController.rotateWorkspaceApiKeys);

module.exports = router;
