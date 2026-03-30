const projectService = require('../services/projectService');
const asyncHandler = require('../utils/asyncHandler');

const projectController = {
  // --- Projects ---
  getProjects: asyncHandler(async (req, res) => {
    const projects = await projectService.getProjects();
    res.json(projects);
  }),

  getProjectById: asyncHandler(async (req, res) => {
    const project = await projectService.getProjects(req.params.id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(project);
  }),

  createProject: asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  }),

  updateProject: asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json(project);
  }),

  deleteProject: asyncHandler(async (req, res) => {
    await projectService.deleteProject(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  }),

  // --- Timesheets ---
  getTimesheets: asyncHandler(async (req, res) => {
    const timesheets = await projectService.getTimesheets(req.query);
    res.json(timesheets);
  }),

  getEmployeeTimesheets: asyncHandler(async (req, res) => {
    const timesheets = await projectService.getTimesheets({ employeeId: req.params.employeeId });
    res.json(timesheets);
  }),

  getTimesheetById: asyncHandler(async (req, res) => {
    const timesheet = await projectService.getTimesheets({ id: req.params.id });
    if (!timesheet) {
      const error = new Error('Timesheet not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(timesheet);
  }),

  createTimesheet: asyncHandler(async (req, res) => {
    const timesheet = await projectService.createTimesheet(req.body);
    res.status(201).json(timesheet);
  }),

  updateTimesheet: asyncHandler(async (req, res) => {
    const timesheet = await projectService.updateTimesheet(req.params.id, req.body);
    res.json(timesheet);
  }),

  approveTimesheet: asyncHandler(async (req, res) => {
    const { approvedBy } = req.body;
    if (!approvedBy) {
      const error = new Error('Approver ID is required');
      error.statusCode = 400;
      throw error;
    }
    const timesheet = await projectService.approveTimesheet(req.params.id, approvedBy);
    res.json(timesheet);
  }),

  rejectTimesheet: asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const timesheet = await projectService.rejectTimesheet(req.params.id, notes);
    res.json(timesheet);
  }),

  deleteTimesheet: asyncHandler(async (req, res) => {
    await projectService.deleteTimesheet(req.params.id);
    res.json({ message: 'Timesheet deleted successfully' });
  })
};

module.exports = projectController;
