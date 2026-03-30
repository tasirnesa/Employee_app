const employeeService = require('../services/employeeService');
const asyncHandler = require('../utils/asyncHandler');

const employeeController = {
  getEmployees: asyncHandler(async (req, res) => {
    const { isActive } = req.query;
    const employees = await employeeService.getAllEmployees(isActive);
    res.json(employees);
  }),

  getEmployee: asyncHandler(async (req, res) => {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json(employee);
  }),

  createEmployee: asyncHandler(async (req, res) => {
    console.log('DEBUG: createEmployee headers:', req.headers['content-type']);
    console.log('DEBUG: createEmployee body:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      const error = new Error('Request body is empty. Ensure Content-Type is correct (application/json or multipart/form-data).');
      error.statusCode = 400;
      throw error;
    }

    const uploadedFile = (req.files && req.files.profileImage) ? req.files.profileImage[0] : null;
    
    const data = { ...req.body };
    for (const key in data) {
      if (Array.isArray(data[key])) data[key] = data[key][0];
    }
    
    if (uploadedFile) {
      data.profileImage = uploadedFile.path;
    }

    if (!data.firstName) {
      const error = new Error('firstName is required');
      error.statusCode = 400;
      throw error;
    }

    const created = await employeeService.createEmployee(data, req.user?.id);
    res.status(201).json(created);
  }),

  updateEmployee: asyncHandler(async (req, res) => {
    const uploadedFile = (req.files && req.files.profileImage) ? req.files.profileImage[0] : null;
    
    const data = { ...req.body };
    for (const key in data) {
      if (Array.isArray(data[key])) data[key] = data[key][0];
    }

    if (uploadedFile) {
      data.profileImage = uploadedFile.path;
    }

    const updated = await employeeService.updateEmployee(req.params.id, data, req.user?.id);
    res.json(updated);
  }),

  activateEmployee: asyncHandler(async (req, res) => {
    const updated = await employeeService.activateEmployee(req.params.id);
    res.json(updated);
  }),

  deactivateEmployee: asyncHandler(async (req, res) => {
    const updated = await employeeService.deactivateEmployee(req.params.id);
    res.json(updated);
  }),
};

module.exports = employeeController;
