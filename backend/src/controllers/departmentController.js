const departmentService = require('../services/departmentService');
const asyncHandler = require('../utils/asyncHandler');

const departmentController = {
  getDepartments: asyncHandler(async (req, res) => {
    const departments = await departmentService.getDepartments();
    res.json(departments);
  }),

  getDepartmentById: asyncHandler(async (req, res) => {
    const department = await departmentService.getDepartments(req.params.id);
    if (!department) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(department);
  }),

  createDepartment: asyncHandler(async (req, res) => {
    const department = await departmentService.createDepartment(req.body);
    res.status(201).json(department);
  }),

  updateDepartment: asyncHandler(async (req, res) => {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    res.json(department);
  }),

  deleteDepartment: asyncHandler(async (req, res) => {
    await departmentService.deleteDepartment(req.params.id);
    res.json({ message: 'Department deleted successfully' });
  })
};

module.exports = departmentController;
