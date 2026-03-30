const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.getTimesheets);
router.get('/employee/:employeeId', projectController.getEmployeeTimesheets);
router.get('/:id', projectController.getTimesheetById);
router.post('/', projectController.createTimesheet);
router.put('/:id', projectController.updateTimesheet);
router.patch('/:id/approve', projectController.approveTimesheet);
router.patch('/:id/reject', projectController.rejectTimesheet);
router.delete('/:id', projectController.deleteTimesheet);

module.exports = router;
