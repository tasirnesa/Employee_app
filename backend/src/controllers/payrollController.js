const payrollService = require('../services/payrollService');
const asyncHandler = require('../utils/asyncHandler');

const payrollController = {
  // --- Payslips ---
  getPayslips: asyncHandler(async (req, res) => {
    const payslips = await payrollService.getPayslips();
    res.json(payslips);
  }),

  getEmployeePayslips: asyncHandler(async (req, res) => {
    const payslips = await payrollService.getPayslips(req.params.employeeId);
    res.json(payslips);
  }),

  createPayslip: asyncHandler(async (req, res) => {
    const payslip = await payrollService.createManualPayslip(req.body);
    res.status(201).json(payslip);
  }),

  // --- Compensations ---
  getCompensations: asyncHandler(async (req, res) => {
    const comps = await payrollService.getCompensations();
    res.json(comps);
  }),

  getEmployeeCompensations: asyncHandler(async (req, res) => {
    const comps = await payrollService.getCompensations(req.params.employeeId);
    res.json(comps);
  }),

  createCompensation: asyncHandler(async (req, res) => {
    const comp = await payrollService.createCompensation(req.body);
    res.status(201).json(comp);
  }),

  // --- Payroll Run ---
  runPayroll: asyncHandler(async (req, res) => {
    const result = await payrollService.runPayroll(req.body?.period);
    res.json(result);
  }),

  previewPayroll: asyncHandler(async (req, res) => {
    const result = await payrollService.previewPayroll(req.body.employeeId, req.body.period);
    res.json(result);
  }),

  // --- Position Config ---
  getPositionConfigs: asyncHandler(async (req, res) => {
    res.json(payrollService.loadPositionConfigs());
  }),

  getPositionConfig: asyncHandler(async (req, res) => {
    const cfg = payrollService.loadPositionConfigs();
    res.json(cfg[String(req.params.positionId)] || null);
  }),

  updatePositionConfig: asyncHandler(async (req, res) => {
    const positionId = String(req.params.positionId);
    const cfg = payrollService.loadPositionConfigs();
    cfg[positionId] = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    payrollService.savePositionConfigs(cfg);
    res.json(cfg[positionId]);
  }),

  // --- Scale Config ---
  getScaleConfigs: asyncHandler(async (req, res) => {
    res.json(payrollService.loadScaleConfigs());
  }),

  getScaleConfig: asyncHandler(async (req, res) => {
    const cfg = payrollService.loadScaleConfigs();
    res.json(cfg[String(req.params.scaleKey)] || null);
  }),

  updateScaleConfig: asyncHandler(async (req, res) => {
    const key = String(req.params.scaleKey);
    const cfg = payrollService.loadScaleConfigs();
    cfg[key] = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    payrollService.saveScaleConfigs(cfg);
    res.json(cfg[key]);
  }),

  assignScale: asyncHandler(async (req, res) => {
    const map = payrollService.loadScaleAssignments();
    map[String(req.params.userId)] = String(req.body.scaleKey);
    payrollService.saveScaleAssignments(map);
    res.json({ userId: parseInt(req.params.userId), scaleKey: req.body.scaleKey });
  }),

  getScaleAssignment: asyncHandler(async (req, res) => {
    const map = payrollService.loadScaleAssignments();
    res.json({ userId: parseInt(req.params.userId), scaleKey: map[String(req.params.userId)] || null });
  }),

  distributePayslips: asyncHandler(async (req, res) => {
    const result = await payrollService.distributePayslips(req.body.period);
    res.json(result);
  }),
};

module.exports = payrollController;
