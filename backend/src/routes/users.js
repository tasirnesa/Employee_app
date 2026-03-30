const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Profile routes (ME) - should come BEFORE /:id to avoid conflicts
router.get('/me', authenticateToken, userController.getMe);
router.put('/me', authenticateToken, userController.updateMe);

// GET /api/users
router.get('/', userController.getUsers);

// GET /api/users/:id
router.get('/:id', userController.getUser);

// PUT /api/users/:id
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

// PUT /api/users/:id/authorize
router.put('/:id/authorize', userController.authorizeUser);

module.exports = router;



