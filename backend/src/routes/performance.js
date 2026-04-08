const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.get('/', authenticateToken, performanceController.getPerformance);
router.post('/', authenticateToken, requireRoles('Admin', 'SuperAdmin', 'Manager'), performanceController.createPerformance);
router.post('/recalculate', authenticateToken, performanceController.recalculateUserPerformance);
router.post('/recalculate-all', authenticateToken, requireRoles('Admin', 'SuperAdmin'), performanceController.recalculateAllPerformance);

module.exports = router;
