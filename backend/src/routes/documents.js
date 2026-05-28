const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `doc-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// Categories
router.get('/categories', authenticateToken, documentController.getCategories);
router.post('/categories', authenticateToken, documentController.createCategory);
router.put('/categories/:id', authenticateToken, documentController.updateCategory);
router.delete('/categories/:id', authenticateToken, documentController.deleteCategory);

// Documents
router.get('/', authenticateToken, documentController.getDocuments);
router.post('/', authenticateToken, upload.single('file'), documentController.uploadDocument);
router.put('/:id', authenticateToken, documentController.updateDocument);
router.delete('/:id', authenticateToken, documentController.deleteDocument);
router.patch('/:id/verify', authenticateToken, documentController.verifyDocument);

module.exports = router;
