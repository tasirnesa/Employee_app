const leaveService = require('../services/leaveService');
const asyncHandler = require('../utils/asyncHandler');

const leaveController = {
  getLeaves: asyncHandler(async (req, res) => {
    const leaves = await leaveService.getLeaves(req.user);
    res.json(leaves);
  }),

  getEmployeeLeaves: asyncHandler(async (req, res) => {
    const leaves = await leaveService.getLeavesByEmployee(req.params.employeeId);
    res.json(leaves);
  }),

  getUsage: asyncHandler(async (req, res) => {
    const usage = await leaveService.getUsage(req.params.employeeId);
    res.json(usage);
  }),

  getLeave: asyncHandler(async (req, res) => {
    const leave = await leaveService.getLeaveById(req.params.id);
    if (!leave) {
      const error = new Error('Leave not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(leave);
  }),

  createLeave: asyncHandler(async (req, res) => {
    const leave = await leaveService.createLeaveRequest(req.body);
    res.status(201).json(leave);
  }),

  updateLeave: asyncHandler(async (req, res) => {
    const result = await leaveService.updateLeaveRequest(req.params.id, req.body);
    res.json(result);
  }),

  approveLeave: asyncHandler(async (req, res) => {
    const result = await leaveService.processApproval(req.params.id, 'Approved', req.user.id, req.body.comments);
    res.json(result);
  }),

  rejectLeave: asyncHandler(async (req, res) => {
    const result = await leaveService.processApproval(req.params.id, 'Rejected', req.user.id, req.body.comments);
    res.json(result);
  }),

  deleteLeave: asyncHandler(async (req, res) => {
    await leaveService.deleteLeave(req.params.id);
    res.json({ message: 'Deleted' });
  }),

  // --- Leave Types ---
  getLeaveTypes: asyncHandler(async (req, res) => {
    const types = await leaveService.getLeaveTypes();
    res.json(types);
  }),

  getLeaveTypeById: asyncHandler(async (req, res) => {
    const type = await leaveService.getLeaveTypes(req.params.id);
    if (!type) {
      const error = new Error('Leave type not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(type);
  }),

  createLeaveType: asyncHandler(async (req, res) => {
    const type = await leaveService.createLeaveType(req.body);
    res.status(201).json(type);
  }),

  updateLeaveType: asyncHandler(async (req, res) => {
    const type = await leaveService.updateLeaveType(req.params.id, req.body);
    res.json(type);
  }),

  deleteLeaveType: asyncHandler(async (req, res) => {
    await leaveService.deleteLeaveType(req.params.id);
    res.json({ message: 'Leave type deleted successfully' });
  })
};

module.exports = leaveController;
