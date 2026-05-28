const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/employee/:employeeId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_VIEW), assetController.getEmployeeAssets);
router.post('/employee/:employeeId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), assetController.assignAsset);
router.patch('/:id', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), assetController.updateAsset);
router.delete('/:id', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), assetController.deleteAsset);

module.exports = router;
