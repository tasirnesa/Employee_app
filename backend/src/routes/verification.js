const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

// All verification actions require ONBOARDING_VIEW at minimum
router.use(authenticateToken);

router.get('/:onboardingId', authorize(PERMISSIONS.ONBOARDING_VIEW), verificationController.getVerifications);
router.post('/:onboardingId', authorize(PERMISSIONS.ONBOARDING_MANAGE), verificationController.createVerification);
router.post('/:onboardingId/initialize', authorize(PERMISSIONS.ONBOARDING_MANAGE), verificationController.initializeDefaults);
router.patch('/:id', authorize(PERMISSIONS.ONBOARDING_UPDATE), verificationController.updateVerification);
router.delete('/:id', authorize(PERMISSIONS.ONBOARDING_MANAGE), verificationController.deleteVerification);

module.exports = router;
