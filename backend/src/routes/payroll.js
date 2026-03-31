const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

// --- Payslips ---
router.get('/payslips', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getPayslips);
router.get('/payslips/employee/:employeeId', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getEmployeePayslips);
router.post('/payslips', authenticateToken, authorize(PERMISSIONS.PAYROLL_RUN), payrollController.createPayslip);

// --- Compensations ---
router.get('/compensations', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getCompensations);
router.get('/compensations/employee/:employeeId', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getEmployeeCompensations);
router.post('/compensations', authenticateToken, authorize(PERMISSIONS.PAYROLL_UPDATE), payrollController.createCompensation);

// --- Payroll Run ---
router.post('/run', authenticateToken, authorize(PERMISSIONS.PAYROLL_RUN), payrollController.runPayroll);
router.post('/preview', authenticateToken, authorize(PERMISSIONS.PAYROLL_RUN), payrollController.previewPayroll);

// --- Config: Positions ---
router.get('/position-config', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getPositionConfigs);
router.get('/position-config/:positionId', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getPositionConfig);
router.put('/position-config/:positionId', authenticateToken, authorize(PERMISSIONS.PAYROLL_UPDATE), payrollController.updatePositionConfig);

// --- Config: Scales ---
router.get('/scale-config', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getScaleConfigs);
router.get('/scale-config/:scaleKey', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getScaleConfig);
router.put('/scale-config/:scaleKey', authenticateToken, authorize(PERMISSIONS.PAYROLL_UPDATE), payrollController.updateScaleConfig);

// --- Scale Assignments ---
router.get('/scale-assignment/:userId', authenticateToken, authorize(PERMISSIONS.PAYROLL_VIEW), payrollController.getScaleAssignment);
router.put('/scale-assignment/:userId', authenticateToken, authorize(PERMISSIONS.PAYROLL_UPDATE), payrollController.assignScale);

module.exports = router;
