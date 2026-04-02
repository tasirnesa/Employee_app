const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/leaves';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
router.post('/', upload.single('attachment'), leaveController.createLeave);

// Update leave
router.put('/:id', leaveController.updateLeave);

// Approve leave
router.patch('/:id/approve', leaveController.approveLeave);

// Reject leave
router.patch('/:id/reject', leaveController.rejectLeave);

// Delete leave
router.delete('/:id', leaveController.deleteLeave);

module.exports = router;

