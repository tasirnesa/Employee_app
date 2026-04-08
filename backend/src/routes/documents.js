const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

// Categories
router.get('/categories', authenticateToken, documentController.getCategories);
router.post('/categories', authenticateToken, documentController.createCategory);
router.put('/categories/:id', authenticateToken, documentController.updateCategory);
router.delete('/categories/:id', authenticateToken, documentController.deleteCategory);

// Documents
router.get('/', authenticateToken, documentController.getDocuments);
router.post('/', authenticateToken, documentController.uploadDocument);
router.put('/:id', authenticateToken, documentController.updateDocument);
router.delete('/:id', authenticateToken, documentController.deleteDocument);
router.patch('/:id/verify', authenticateToken, documentController.verifyDocument);

module.exports = router;
