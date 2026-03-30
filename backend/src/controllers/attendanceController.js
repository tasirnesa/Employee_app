const attendanceService = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');

const attendanceController = {
  getEmployeeAttendance: asyncHandler(async (req, res) => {
    const records = await attendanceService.getAttendanceForEmployee(req.params.employeeId);
    res.json(records);
  }),

  getAllAttendance: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const records = await attendanceService.getAllAttendance(startDate, endDate);
    res.json(records);
  }),

  getSummary: asyncHandler(async (req, res) => {
    const summary = await attendanceService.getSummary(req.params.employeeId);
    res.json(summary);
  }),

  checkIn: asyncHandler(async (req, res) => {
    const record = await attendanceService.checkIn(req.body.employeeId);
    res.json(record);
  }),

  checkOut: asyncHandler(async (req, res) => {
    const record = await attendanceService.checkOut(req.body.employeeId);
    res.json(record);
  }),

  createAttendance: asyncHandler(async (req, res) => {
    const record = await attendanceService.manualPulse(req.body);
    res.json(record);
  }),

  updateAttendance: asyncHandler(async (req, res) => {
    const record = await attendanceService.updateAttendance(req.params.id, req.body);
    res.json(record);
  }),

  deleteAttendance: asyncHandler(async (req, res) => {
    await attendanceService.deleteAttendance(req.params.id);
    res.json({ message: 'Deleted' });
  }),
};

module.exports = attendanceController;
