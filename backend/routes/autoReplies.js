const express = require('express');
const router = express.Router();
const autoReplyController = require('../controllers/autoReplyController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'catalog-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF catalog sheets are allowed.'), false);
    }
  }
});

router.use(protect);

router.get('/', autoReplyController.getRules);
router.post('/', autoReplyController.createRule);
router.put('/:ruleId', autoReplyController.updateRule);
router.delete('/:ruleId', autoReplyController.deleteRule);
router.post('/upload-catalog', upload.single('catalog'), autoReplyController.uploadCatalogue);

module.exports = router;
