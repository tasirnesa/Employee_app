const express = require('express');
const router = express.Router();
const probationController = require('../controllers/probationController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', authenticateToken, authorize(PERMISSIONS.ONBOARDING_VIEW), probationController.getAllProbations);
router.get('/:onboardingId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_VIEW), probationController.getProbationDetail);
router.patch('/:id', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), probationController.updateProbation);
router.post('/:id/evaluate', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), probationController.evaluate);

module.exports = router;
