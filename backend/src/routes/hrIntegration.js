const express = require('express');
const router = express.Router();
const hrIntegrationController = require('../controllers/hrIntegrationController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.get('/config', authenticateToken, hrIntegrationController.getConfig);
router.get('/merit-proposals', authenticateToken, hrIntegrationController.getMeritProposals);
router.post(
  '/merit-proposals/:id/approve',
  authenticateToken,
  requireRoles('Admin', 'SuperAdmin', 'Manager'),
  hrIntegrationController.approveMeritProposal
);
router.post(
  '/merit-proposals/:id/reject',
  authenticateToken,
  requireRoles('Admin', 'SuperAdmin', 'Manager'),
  hrIntegrationController.rejectMeritProposal
);
router.get('/employee/:userId/summary', authenticateToken, hrIntegrationController.getEmployeeSummary);

module.exports = router;
