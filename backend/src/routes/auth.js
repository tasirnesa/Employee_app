const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth'); // assuming this exists or will be moved

const ssoController = require('../controllers/ssoController');

router.post('/login', userController.login);
router.post('/change-password', authenticateToken, userController.changePassword);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// SSO endpoints
router.post('/sso/google', ssoController.googleLogin);
router.post('/sso/microsoft', ssoController.microsoftLogin);

module.exports = router;
