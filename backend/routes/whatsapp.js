const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/status', whatsappController.getStatus);
router.get('/session', whatsappController.getSession);
router.get('/qr', whatsappController.getQR);
router.post('/connect', whatsappController.connect);
router.post('/connect-qr', whatsappController.connect);
router.post('/restore-session', whatsappController.restoreSession);
router.post('/logout', whatsappController.logout);
router.post('/disconnect', whatsappController.logout);
router.post('/send', whatsappController.sendSingleMessage);
router.post('/send-product', whatsappController.sendProductMessage);
router.post('/send-bulk', whatsappController.sendBulkMessages);
router.post('/test', whatsappController.testSend);
router.post('/test-send', whatsappController.testSend);
router.post('/verify-connection', whatsappController.verifyConnection);
router.post('/verify', whatsappController.verifyConnection);
router.get('/logs', whatsappController.getMessageLogs);

// Synced Inbox & Team Workspace endpoints
router.get('/chats', whatsappController.getChats);
router.post('/sync-chats', whatsappController.syncChatsManual);
router.get('/chats/:chatId/messages', whatsappController.getChatMessages);
router.post('/chats/assign', whatsappController.assignChat);
router.post('/chats/notes', whatsappController.addChatNote);
router.get('/chats/:chatId/notes', whatsappController.getChatNotes);
router.post('/chats/sales-status', whatsappController.changeChatSalesStatus);

router.put('/chats/:chatId/pin', whatsappController.togglePinChat);
router.put('/chats/:chatId/archive', whatsappController.toggleArchiveChat);
router.put('/messages/:messageId/star', whatsappController.toggleStarMessage);

module.exports = router;
