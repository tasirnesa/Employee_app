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

  updatePayslip: asyncHandler(async (req, res) => {
    const payslip = await payrollService.updatePayslip(req.params.id, req.body);
    res.json(payslip);
  }),

  deletePayslip: asyncHandler(async (req, res) => {
    await payrollService.deletePayslip(req.params.id);
    res.status(204).end();
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

  updateCompensation: asyncHandler(async (req, res) => {
    const comp = await payrollService.updateCompensation(req.params.id, req.body);
    res.json(comp);
  }),

  deleteCompensation: asyncHandler(async (req, res) => {
    await payrollService.deleteCompensation(req.params.id);
    res.status(204).end();
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
    const prisma = require('../config/prisma');
    const positions = await prisma.position.findMany({ include: { grade: true } });
    const map = {};
    for (const p of positions) {
      map[String(p.id)] = p;
    }
    res.json(map);
  }),

  getPositionConfig: asyncHandler(async (req, res) => {
    const prisma = require('../config/prisma');
    const p = await prisma.position.findUnique({ where: { id: parseInt(req.params.positionId) }, include: { grade: true } });
    res.json(p || null);
  }),

  updatePositionConfig: asyncHandler(async (req, res) => {
    const prisma = require('../config/prisma');
    const positionId = parseInt(req.params.positionId);
    const { gradeId, positionAllowance, fuelAllowance, qualifications } = req.body;
    
    const updateData = {
        positionAllowance: Number(positionAllowance || 0),
        fuelAllowance: Number(fuelAllowance || 0)
    };
    if (gradeId !== undefined) updateData.gradeId = gradeId ? parseInt(gradeId) : null;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    
    const p = await prisma.position.update({
      where: { id: positionId },
      data: updateData,
      include: { grade: true }
    });
    res.json(p);
  }),

  // --- Scale Config ---
  getScaleConfigs: asyncHandler(async (req, res) => {
    const prisma = require('../config/prisma');
    const grades = await prisma.grade.findMany();
    const map = {};
    for (const g of grades) {
      map[g.name] = g;
    }
    res.json(map);
  }),

  getScaleConfig: asyncHandler(async (req, res) => {
    const prisma = require('../config/prisma');
    const g = await prisma.grade.findUnique({ where: { name: String(req.params.scaleKey) } });
    res.json(g || null);
  }),

  updateScaleConfig: asyncHandler(async (req, res) => {
    const prisma = require('../config/prisma');
    const key = String(req.params.scaleKey);
    const { name, minSalary, midSalary, maxSalary, housingPct, transportPct } = req.body;
    const g = await prisma.grade.upsert({
      where: { name: key },
      update: {
        name: name || key,
        minSalary: Number(minSalary || 0),
        midSalary: Number(midSalary || 0),
        maxSalary: Number(maxSalary || 0),
        housingPct: Number(housingPct || 0),
        transportPct: Number(transportPct || 0),
      },
      create: {
        name: key,
        minSalary: Number(minSalary || 0),
        midSalary: Number(midSalary || 0),
        maxSalary: Number(maxSalary || 0),
        housingPct: Number(housingPct || 0),
        transportPct: Number(transportPct || 0),
      }
    });
    res.json(g);
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

  exportBankCsv: asyncHandler(async (req, res) => {
    const csv = await payrollService.generateBankExport(req.params.period);
    res.header('Content-Type', 'text/csv');
    res.attachment(`payroll_${req.params.period}.csv`);
    return res.send(csv);
  }),
};

module.exports = payrollController;
