const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

router.get('/', leaveController.getLeaveTypes);
router.get('/:id', leaveController.getLeaveTypeById);
router.post('/', leaveController.createLeaveType);
router.put('/:id', leaveController.updateLeaveType);
router.delete('/:id', leaveController.deleteLeaveType);

module.exports = router;
