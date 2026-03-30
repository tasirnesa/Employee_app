const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { requireRoles } = require('../middleware/auth');

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', requireRoles('Admin', 'SuperAdmin'), departmentController.createDepartment);
router.put('/:id', requireRoles('admin', 'superadmin'), departmentController.updateDepartment);
router.delete('/:id', requireRoles('admin', 'superadmin'), departmentController.deleteDepartment);

module.exports = router;
