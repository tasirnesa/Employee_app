const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// Get all leaves
router.get('/', leaveController.getLeaves);

// Get leaves for specific employee
router.get('/employee/:employeeId', leaveController.getEmployeeLeaves);

// Usage summary for an employee
router.get('/usage/:employeeId', leaveController.getUsage);

// Get leave by ID
router.get('/:id', leaveController.getLeave);

// Create new leave request
router.post('/', leaveController.createLeave);

// Update leave
router.put('/:id', leaveController.updateLeave);

// Approve leave
router.patch('/:id/approve', leaveController.approveLeave);

// Reject leave
router.patch('/:id/reject', leaveController.rejectLeave);

// Delete leave
router.delete('/:id', leaveController.deleteLeave);

module.exports = router;

