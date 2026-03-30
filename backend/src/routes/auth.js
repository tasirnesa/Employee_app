const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth'); // assuming this exists or will be moved

router.post('/login', userController.login);
router.post('/change-password', authenticateToken, userController.changePassword);

module.exports = router;
