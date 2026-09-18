const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/',    authenticateToken, evaluationController.getSessions);
router.post('/',   authenticateToken, authorize(PERMISSIONS.EMPLOYEE_CREATE), evaluationController.createSession);
router.get('/stats', authenticateToken, evaluationController.getSessionStats);
router.put('/:id/status', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE), evaluationController.updateSessionStatus);

// ── Criteria assigned to a session ────────────────────────────────────────
router.get( '/:id/criteria',        authenticateToken, evaluationController.getSessionCriteria);
router.post('/:id/criteria',        authenticateToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE), evaluationController.assignCriteriaToSession);
router.delete('/:id/criteria/:criteriaId', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE), evaluationController.removeCriteriaFromSession);

module.exports = router;
