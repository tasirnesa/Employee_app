const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// --- Payslips ---
router.get('/payslips', payrollController.getPayslips);
router.get('/payslips/employee/:employeeId', payrollController.getEmployeePayslips);
router.post('/payslips', payrollController.createPayslip);

// --- Compensations ---
router.get('/compensations', payrollController.getCompensations);
router.get('/compensations/employee/:employeeId', payrollController.getEmployeeCompensations);
router.post('/compensations', payrollController.createCompensation);

// --- Payroll Run ---
router.post('/run', payrollController.runPayroll);
router.post('/preview', payrollController.previewPayroll);

// --- Config: Positions ---
router.get('/position-config', payrollController.getPositionConfigs);
router.get('/position-config/:positionId', payrollController.getPositionConfig);
router.put('/position-config/:positionId', payrollController.updatePositionConfig);

// --- Config: Scales ---
router.get('/scale-config', payrollController.getScaleConfigs);
router.get('/scale-config/:scaleKey', payrollController.getScaleConfig);
router.put('/scale-config/:scaleKey', payrollController.updateScaleConfig);

// --- Scale Assignments ---
router.get('/scale-assignment/:userId', payrollController.getScaleAssignment);
router.put('/scale-assignment/:userId', payrollController.assignScale);

module.exports = router;
