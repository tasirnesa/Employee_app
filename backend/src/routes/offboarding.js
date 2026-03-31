const express = require('express');
const router = express.Router();
const offboardingController = require('../controllers/offboardingController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', authenticateToken, authorize(PERMISSIONS.OFFBOARDING_VIEW), offboardingController.getOffboardings);
router.get('/:id', authenticateToken, authorize(PERMISSIONS.OFFBOARDING_VIEW), offboardingController.getOffboarding);
router.post('/initiate', authenticateToken, authorize(PERMISSIONS.OFFBOARDING_INITIATE), offboardingController.initiate);
router.put('/:id', authenticateToken, authorize(PERMISSIONS.OFFBOARDING_COMPLETE), offboardingController.update);
router.patch('/tasks/:taskId/complete', authenticateToken, authorize(PERMISSIONS.OFFBOARDING_COMPLETE), offboardingController.completeTask);
router.post('/:id/finalize', authenticateToken, authorize(PERMISSIONS.OFFBOARDING_COMPLETE), offboardingController.finalize);

module.exports = router;
