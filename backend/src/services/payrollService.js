const payrollRepository = require('../repositories/payrollRepository');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

// Config paths (relative to this service file, but pointing to backend root as before)
const CONFIG_FILE = path.join(__dirname, '..', '..', 'payroll.position.config.json');
const SCALE_CONFIG_FILE = path.join(__dirname, '..', '..', 'payroll.scale.config.json');
const SCALE_ASSIGN_FILE = path.join(__dirname, '..', '..', 'payroll.scale.assignments.json');

const payrollService = {
  // --- Payslip Business Logic ---
  getPayslips: async (employeeId = null) => {
    const where = employeeId ? { employeeId: parseInt(employeeId) } : {};
    return await payrollRepository.findAllPayslips(where);
  },

  createManualPayslip: async (data) => {
    const { employeeId, period, basicSalary, allowances, deductions, status } = data;
    const employee = await userRepository.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);
    return await payrollRepository.createPayslip({
      employeeId: parseInt(employeeId),
      period,
      basicSalary: parseFloat(basicSalary),
      allowances: parseFloat(allowances),
      deductions: parseFloat(deductions),
      netSalary,
      status: status || 'Generated'
    });
  },

  // --- Compensation Business Logic ---
  getCompensations: async (employeeId = null) => {
    const where = employeeId ? { employeeId: parseInt(employeeId) } : {};
    return await payrollRepository.findAllCompensations(where);
  },

  createCompensation: async (data) => {
    const { employeeId, basicSalary, allowances, bonus } = data;
    const totalCompensation = parseFloat(basicSalary) + parseFloat(allowances) + parseFloat(bonus);
    return await payrollRepository.createCompensation({
      ...data,
      employeeId: parseInt(employeeId),
      basicSalary: parseFloat(basicSalary),
      allowances: parseFloat(allowances),
      bonus: parseFloat(bonus),
      totalCompensation,
      effectiveDate: new Date(data.effectiveDate)
    });
  },

  // --- Payroll Run Engine ---
  runPayroll: async (periodLabel) => {
    const start = payrollService._startOfMonth(periodLabel);
    const end = payrollService._endOfMonth(start);

    const users = await userRepository.findAll({ 
      status: 'true', 
      activeStatus: 'true' 
    });

    const posCfg = payrollService.loadPositionConfigs();
    const scaleCfg = payrollService.loadScaleConfigs();
    const scaleAssign = payrollService.loadScaleAssignments();
    const results = [];

    for (const u of users) {
      let comp = await payrollRepository.findActiveCompensation(u.id, end);
      
      // Fallbacks
      if (!comp) {
        comp = payrollService._getFallbackCompensation(u, start, scaleAssign, scaleCfg, posCfg);
      }

      if (!comp) continue;

      const calc = await payrollService._calculatePayrollDetails(u.id, comp, start, end);

      const existing = await payrollRepository.findPayslipByPeriod(u.id, `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`);
      let payslip;
      const payslipData = {
        employeeId: u.id,
        period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        basicSalary: calc.basicSalary,
        allowances: calc.allowances,
        deductions: calc.deductions,
        netSalary: calc.netSalary,
        status: 'Generated',
      };

      if (existing) {
        payslip = await payrollRepository.updatePayslip(existing.id, payslipData);
      } else {
        payslip = await payrollRepository.createPayslip(payslipData);
      }
      results.push({ userId: u.id, payslip, calc });
    }

    return { 
      period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`, 
      count: results.length, 
      results 
    };
  },

  previewPayroll: async (employeeId, periodLabel) => {
    const start = payrollService._startOfMonth(periodLabel);
    const end = payrollService._endOfMonth(start);
    const u = await userRepository.findById(employeeId);
    if (!u) throw new Error('User not found');
    if (String(u.status).toLowerCase() !== 'true') throw new Error('User inactive');

    let comp = await payrollRepository.findActiveCompensation(u.id, end);
    if (!comp) {
      const posCfg = payrollService.loadPositionConfigs();
      const scaleCfg = payrollService.loadScaleConfigs();
      const scaleAssign = payrollService.loadScaleAssignments();
      comp = payrollService._getFallbackCompensation(u, start, scaleAssign, scaleCfg, posCfg);
    }
    if (!comp) throw new Error('No compensation found');

    const calc = await payrollService._calculatePayrollDetails(u.id, comp, start, end);
    return { period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`, calc };
  },

  // --- Config Helpers ---
  loadPositionConfigs: () => payrollService._loadJson(CONFIG_FILE),
  savePositionConfigs: (cfg) => payrollService._saveJson(CONFIG_FILE, cfg),
  loadScaleConfigs: () => payrollService._loadJson(SCALE_CONFIG_FILE),
  saveScaleConfigs: (cfg) => payrollService._saveJson(SCALE_CONFIG_FILE, cfg),
  loadScaleAssignments: () => payrollService._loadJson(SCALE_ASSIGN_FILE),
  saveScaleAssignments: (map) => payrollService._saveJson(SCALE_ASSIGN_FILE, map),

  // --- Internal Helpers ---
  _loadJson: (file) => {
    try {
      if (!fs.existsSync(file)) return {};
      return JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
    } catch { return {}; }
  },
  _saveJson: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'),

  _startOfMonth: (periodLabel) => {
    if (periodLabel && /^\d{4}-\d{2}$/.test(periodLabel)) {
      const [y, m] = periodLabel.split('-').map((n) => parseInt(n, 10));
      return new Date(y, m - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  },
  _endOfMonth: (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),

  _getFallbackCompensation: (u, start, scaleAssign, scaleCfg, posCfg) => {
    const scaleKey = scaleAssign[String(u.id)];
    if (scaleKey && scaleCfg[String(scaleKey)]) {
      const sCfg = scaleCfg[String(scaleKey)];
      return {
        employeeId: u.id,
        position: sCfg.label || '',
        basicSalary: Number(sCfg.basicSalary || 0),
        allowances: Number(sCfg.allowances || 0),
        bonus: Number(sCfg.bonus || 0),
        effectiveDate: start,
        status: 'Active',
        overtimeMultiplier: Number(sCfg.overtimeMultiplier || 1.5),
        pensionEmployeePct: Number(sCfg.pensionEmployeePct ?? 0.07),
        taxFixed: Number(sCfg.taxFixed || 0),
        insuranceEmployeeFixed: Number(sCfg.insuranceEmployeeFixed || 0),
        otherDeductionsFixed: Number(sCfg.otherDeductionsFixed || 0),
      };
    }
    if (u.positionId && posCfg[String(u.positionId)]) {
      const pCfg = posCfg[String(u.positionId)];
      return {
        employeeId: u.id,
        position: pCfg.positionName || '',
        basicSalary: Number(pCfg.basicSalary || 0),
        allowances: Number(pCfg.allowances || 0),
        bonus: Number(pCfg.bonus || 0),
        effectiveDate: start,
        status: 'Active',
        overtimeMultiplier: Number(pCfg.overtimeMultiplier || 1.5),
        pensionEmployeePct: Number(pCfg.pensionEmployeePct ?? 0.07),
        taxFixed: Number(pCfg.taxFixed || 0),
        insuranceEmployeeFixed: Number(pCfg.insuranceEmployeeFixed || 0),
        otherDeductionsFixed: Number(pCfg.otherDeductionsFixed || 0),
      };
    }
    return null;
  },

  _calculatePayrollDetails: async (userId, comp, start, end) => {
    const [times, unpaidDays, benefits, perksTotal] = await Promise.all([
      payrollService._aggregateTimesheets(userId, start, end),
      payrollService._aggregateUnpaidLeaveDays(userId, start, end),
      payrollService._aggregateBenefits(userId, start, end),
      payrollService._aggregatePerks(userId, start, end),
    ]);

    const workingDays = payrollService._businessDaysInRange(start, end);
    const basic = Number(comp.basicSalary || 0);
    const hourlyRate = workingDays > 0 ? (basic / (workingDays * 8)) : 0;
    const overtimeRate = hourlyRate * Number(comp.overtimeMultiplier || 1.5);
    const overtimePay = Number(times.overtime || 0) * overtimeRate;
    const unpaidDeduction = (basic / workingDays) * (unpaidDays || 0);

    const gross = basic + Number(comp.allowances || 0) + Number(comp.bonus || 0) + overtimePay + Number(perksTotal || 0) - unpaidDeduction;
    const pensionEmployee = basic * Number(comp.pensionEmployeePct ?? 0.07);
    const totalDeductions = pensionEmployee + Number(comp.taxFixed || 0) + Number(comp.insuranceEmployeeFixed || 0) + Number(comp.otherDeductionsFixed || 0) + Number(benefits.employee || 0);
    const net = gross - totalDeductions;

    return {
      basicSalary: basic,
      allowances: Number(comp.allowances || 0),
      bonus: Number(comp.bonus || 0),
      overtimePay,
      unpaidDeduction,
      perks: Number(perksTotal || 0),
      grossEarnings: gross,
      deductions: totalDeductions,
      netSalary: net,
      breakdown: {
        pensionEmployee,
        tax: Number(comp.taxFixed || 0),
        insuranceEmp: Number(comp.insuranceEmployeeFixed || 0),
        overtimeHours: Number(times.overtime || 0),
        workingDays,
        unpaidDays,
        benefitsEmployee: Number(benefits.employee || 0),
        benefitsEmployer: Number(benefits.employer || 0),
      },
    };
  },

  _businessDaysInRange: (start, end) => {
    let days = 0;
    const d = new Date(start);
    while (d <= end) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) days += 1;
      d.setDate(d.getDate() + 1);
    }
    return Math.max(days, 1);
  },

  _aggregateTimesheets: async (userId, start, end) => {
    const rows = await prisma.timesheet.findMany({
      where: { employeeId: userId, date: { gte: start, lte: end } },
      select: { hoursWorked: true, overtimeHours: true },
    });
    return rows.reduce((acc, r) => ({
      hours: acc.hours + (r.hoursWorked || 0),
      overtime: acc.overtime + (r.overtimeHours || 0),
    }), { hours: 0, overtime: 0 });
  },

  _aggregateUnpaidLeaveDays: async (userId, start, end) => {
    const leaves = await prisma.leave.findMany({
      where: {
        employeeId: userId,
        status: 'Approved',
        OR: [{ startDate: { gte: start, lte: end } }, { endDate: { gte: start, lte: end } }],
      },
      include: { leaveType: true },
    });
    const unpaidLeaveDays = leaves
      .filter((l) => l.leaveType && l.leaveType.isPaid === false)
      .reduce((s, l) => s + (l.days || 0), 0);

    const attendanceAbsences = await prisma.attendance.findMany({
      where: { employeeId: userId, date: { gte: start, lte: end }, status: 'absent' }
    });

    const unexplainedAbsences = attendanceAbsences.filter(att => {
      return !leaves.some(l => {
        const attTime = new Date(att.date).getTime();
        return attTime >= new Date(l.startDate).getTime() && attTime <= new Date(l.endDate).getTime();
      });
    }).length;

    return unpaidLeaveDays + unexplainedAbsences;
  },

  _aggregateBenefits: async (userId, start, end) => {
    const benefits = await prisma.benefit.findMany({
      where: {
        employeeId: userId,
        status: 'Active',
        effectiveDate: { lte: end },
        OR: [{ expiryDate: null }, { expiryDate: { gte: start } }],
      },
      select: { employeeContribution: true, companyContribution: true },
    });
    return benefits.reduce(
      (acc, b) => ({
        employee: acc.employee + Number(b.employeeContribution || 0),
        employer: acc.employer + Number(b.companyContribution || 0),
      }),
      { employee: 0, employer: 0 }
    );
  },

  _aggregatePerks: async (userId, start, end) => {
    const perks = await prisma.perk.findMany({
      where: {
        employeeId: userId,
        status: 'Active',
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      select: { value: true },
    });
    return perks.reduce((s, p) => s + Number(p.value || 0), 0);
  }
};

module.exports = payrollService;
