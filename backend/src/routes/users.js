const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

// Profile routes (ME) - should come BEFORE /:id to avoid conflicts
router.get('/me', authenticateToken, userController.getMe);
router.put('/me', authenticateToken, userController.updateMe);

// GET /api/users
router.get('/', authenticateToken, authorize(PERMISSIONS.USER_VIEW), userController.getUsers);

// GET /api/users/:id
router.get('/:id', authenticateToken, authorize(PERMISSIONS.USER_VIEW), userController.getUser);

// PUT /api/users/:id
router.put('/:id', authenticateToken, authorize(PERMISSIONS.USER_UPDATE), userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, authorize(PERMISSIONS.USER_DELETE), userController.deleteUser);

// PUT /api/users/:id/authorize
router.put('/:id/authorize', authenticateToken, authorize(PERMISSIONS.USER_UPDATE), userController.authorizeUser);

module.exports = router;



