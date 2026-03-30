const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Get attendance records for an employee
router.get('/employee/:employeeId', attendanceController.getEmployeeAttendance);

// Get all attendance records (with filters)
router.get('/', attendanceController.getAllAttendance);

// Get attendance summary for an employee
router.get('/summary/:employeeId', attendanceController.getSummary);

// Check-in
router.post('/check-in', attendanceController.checkIn);

// Check-out
router.post('/check-out', attendanceController.checkOut);

// Manual add attendance record
router.post('/', attendanceController.createAttendance);

// Update attendance record
router.put('/:id', attendanceController.updateAttendance);

// Delete attendance record
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;