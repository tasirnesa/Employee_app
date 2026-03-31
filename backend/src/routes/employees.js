const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const employeeController = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `employee-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// List employees
router.get('/', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_VIEW), employeeController.getEmployees);

// Get one employee
router.get('/:id', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_VIEW), employeeController.getEmployee);

// Create employee
router.post('/', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_CREATE), upload.fields([{ name: 'profileImage', maxCount: 1 }]), employeeController.createEmployee);

// Update employee
router.put('/:id', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE), upload.fields([{ name: 'profileImage', maxCount: 1 }]), employeeController.updateEmployee);

// Activate / Deactivate
router.patch('/:id/activate', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE), employeeController.activateEmployee);
router.patch('/:id/deactivate', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE), employeeController.deactivateEmployee);

module.exports = router;



