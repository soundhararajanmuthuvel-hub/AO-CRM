const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local temporary upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'temp-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.use(protect);

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/recommendations', productController.getRecommendations);
router.post('/upload-image', upload.single('image'), productController.uploadProductImage);
router.post('/upload-catalogue', upload.single('catalogue'), productController.uploadProductCatalogue);
router.get('/:id', productController.getProductById);
router.put('/:productId', productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);

module.exports = router;
