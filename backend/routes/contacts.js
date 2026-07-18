const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.get('/:id/timeline', contactController.getContactTimeline);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);
router.post('/import', upload.single('file'), contactController.importCSV);
router.post('/merge', contactController.mergeContacts);
router.get('/export', contactController.exportCSV);

module.exports = router;
