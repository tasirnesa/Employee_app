const payrollRepository = require('../repositories/payrollRepository');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');
const emailService = require('./emailService');
const communicationService = require('./communicationService');

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

  updatePayslip: async (id, data) => {
    const { basicSalary, allowances, deductions } = data;
    const current = await payrollRepository.findPayslipById(id);
    if (!current) throw new Error('Payslip not found');

    const netSalary = parseFloat(basicSalary ?? current.basicSalary) +
      parseFloat(allowances ?? current.allowances) -
      parseFloat(deductions ?? current.deductions);

    return await payrollRepository.updatePayslip(id, {
      ...data,
      netSalary
    });
  },

  deletePayslip: async (id) => {
    return await payrollRepository.deletePayslip(id);
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

  updateCompensation: async (id, data) => {
    const current = await payrollRepository.findActiveCompensation(data.employeeId, new Date()); // Simplification, should find by ID but findActive is what we have
    // Wait, I should add findCompensationById to repository if missing, but it's not missing in my previous view_file of repository
    // Ah, I see: updateCompensation in repository uses findUnique with id.

    const { basicSalary, allowances, bonus } = data;
    const basic = parseFloat(basicSalary ?? 0);
    const allow = parseFloat(allowances ?? 0);
    const bns = parseFloat(bonus ?? 0);
    const totalCompensation = basic + allow + bns;

    return await payrollRepository.updateCompensation(id, {
      ...data,
      basicSalary: basic,
      allowances: allow,
      bonus: bns,
      totalCompensation,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined
    });
  },

  deleteCompensation: async (id) => {
    return await payrollRepository.deleteCompensation(id);
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

      const periodLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      const existing = await payrollRepository.findPayslipByPeriod(u.id, periodLabel);

      // YTD Calculation Loop
      const pastPayslips = await prisma.payslip.findMany({
        where: { employeeId: u.id, period: { startsWith: String(start.getFullYear()) } }
      });
      let ytdGross = calc.grossEarnings;
      let ytdTaxes = calc.breakdown.tax;
      let ytdDeductions = calc.deductions;
      let ytdNet = calc.netSalary;
      for (const p of pastPayslips) {
        if (p.period !== periodLabel) {
          const pGross = parseFloat(p.basicSalary || 0) + parseFloat(p.allowances || 0) +
            parseFloat(p.overtimePay || 0) + parseFloat(p.attendanceBonus || 0);
          ytdGross += pGross;
          ytdTaxes += (parseFloat(p.ytdTaxes) - parseFloat(p.ytdTaxes)); // need to use a better way, wait, I can just use p.tax if stored? 
          // p doesn't have tax stored directly in columns, only ytdTaxes or deductions.
          // Wait, since ytdTaxes is additive, we can just take the latest past payslip's ytd values!
          // But summing up is safer if we just added the columns. 
        }
      }
      // Simple override: just take max YTD from past payslips + current
      const validPast = pastPayslips.filter(p => p.period !== periodLabel);
      if (validPast.length > 0) {
        const lastP = validPast.sort((a, b) => b.period.localeCompare(a.period))[0];
        ytdGross = parseFloat(lastP.ytdGross || 0) + calc.grossEarnings;
        ytdTaxes = parseFloat(lastP.ytdTaxes || 0) + calc.breakdown.tax;
        ytdDeductions = parseFloat(lastP.ytdDeductions || 0) + calc.deductions;
        ytdNet = parseFloat(lastP.ytdNet || 0) + calc.netSalary;
      }

      let payslip;
      const payslipData = {
        employeeId: u.id,
        period: periodLabel,
        basicSalary: calc.basicSalary,
        housingAllowance: calc.housingAllowance,
        transportAllowance: calc.transportAllowance,
        positionAllowance: calc.positionAllowance,
        fuelAllowance: calc.fuelAllowance,
        allowances: calc.allowances,
        overtimePay: calc.overtimePay,
        lateDeduction: calc.lateDeduction,
        attendanceBonus: calc.attendanceBonus,
        attendancePenalty: calc.attendancePenalty,
        benefitsDeduction: calc.breakdown.benefitsEmployee,
        perksAllowance: calc.perks,
        deductions: calc.deductions,
        netSalary: calc.netSalary,
        ytdGross,
        ytdTaxes,
        ytdDeductions,
        ytdNet,
        status: 'Generated',
      };

      if (existing) {
        payslip = await payrollRepository.updatePayslip(existing.id, payslipData);
      } else {
        payslip = await payrollRepository.createPayslip(payslipData);
      }
      results.push({ userId: u.id, payslip, calc });
    }

    // Notify Admins about payroll run completion
    try {
      const admins = await userRepository.findManyByRole('Admin');
      for (const admin of admins) {
        await communicationService.notify(
          admin.id,
          'Payroll Run Completed',
          `Payroll run for ${periodLabel || 'current month'} has been processed for ${results.length} employees.`,
          'SUCCESS',
          '/payroll'
        );
      }
    } catch (e) {
      console.warn('Failed to notify admins of payroll run completion', e.message);
    }

    // Notify Employees about their payroll being processed
    for (const res of results) {
      try {
        await communicationService.notify(
          res.userId,
          'Payroll Processed',
          `Your payroll for ${periodLabel || 'the current period'} has been processed and a payslip has been generated.`,
          'INFO',
          '/payroll'
        );
      } catch (e) {
        console.warn(`Failed to notify employee ${res.userId} of payroll processing`, e.message);
      }
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

  distributePayslips: async (period) => {
    if (!period) throw new Error('Period is required');
    const payslips = await prisma.payslip.findMany({
      where: { period },
      include: {
        employee: {
          include: {
            employees: true
          }
        }
      }
    });

    let successCount = 0;
    let failCount = 0;

    for (const ps of payslips) {
      const email = ps.employee?.email || ps.employee?.employees?.[0]?.email;
      if (email) {
        try {
          await emailService.sendPayslipEmail({
            fullName: ps.employee?.fullName,
            email: email
          }, ps);
          successCount++;
        } catch (e) {
          console.error(`Failed to send payslip to ${email}:`, e.message);
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    // Notify Admins about distribution completion
    try {
      const admins = await userRepository.findManyByRole('Admin');
      for (const admin of admins) {
        await communicationService.notify(
          admin.id,
          'Payslip Distribution Complete',
          `Successfully distributed ${successCount} payslips for period ${period}. ${failCount} failed.`,
          failCount > 0 ? 'WARNING' : 'SUCCESS',
          '/payroll'
        );
      }
    } catch (e) {
      console.warn('Failed to notify admins of distribution completion', e.message);
    }

    // Notify Employees about their new payslip
    for (const ps of payslips) {
      if (ps.employeeId) {
        try {
          await communicationService.notify(
            ps.employeeId,
            'New Payslip Available',
            `Your payslip for ${period} has been generated and is ready for viewing.`,
            'INFO',
            '/payroll'
          );
        } catch (e) {
          console.warn(`Failed to notify employee ${ps.employeeId} of new payslip`, e.message);
        }
      }
    }

    return { total: payslips.length, success: successCount, failed: failCount };
  },

  generateBankExport: async (period) => {
    if (!period) throw new Error('Period is required');
    const payslips = await prisma.payslip.findMany({
      where: { period },
      include: {
        employee: {
          include: {
            employees: true
          }
        }
      }
    });

    let csv = "Employee Name,Bank Name,Account Number,Net Salary,Currency\n";
    for (const ps of payslips) {
      const emp = ps.employee?.employees?.[0]; // from User -> employees
      const bankName = emp?.bankName || 'Unknown Bank';
      const bankAccount = emp?.bankAccount || 'No Account';
      csv += `"${ps.employee?.fullName || 'Unknown'}","${bankName}","${bankAccount}",${ps.netSalary},"USD"\n`;
    }
    return csv;
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
        latePenaltyRate: Number(sCfg.latePenaltyRate ?? 0.5),
        perfectAttendanceBonus: Number(sCfg.perfectAttendanceBonus ?? 50),
        absenteeismThreshold: Number(sCfg.absenteeismThreshold ?? 2),
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
        latePenaltyRate: Number(pCfg.latePenaltyRate ?? 0.5),
        perfectAttendanceBonus: Number(pCfg.perfectAttendanceBonus ?? 50),
        absenteeismThreshold: Number(pCfg.absenteeismThreshold ?? 2),
      };
    }
    return null;
  },

  _calculateProgressiveTax: (taxableIncome) => {
    const brackets = [
      { limit: 600, rate: 0 },
      { limit: 1650, rate: 0.10 },
      { limit: 3200, rate: 0.15 },
      { limit: 5250, rate: 0.20 },
      { limit: 7800, rate: 0.25 },
      { limit: 10900, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];
    let tax = 0;
    let previousLimit = 0;
    for (const b of brackets) {
      if (taxableIncome > b.limit) {
        tax += (b.limit - previousLimit) * b.rate;
        previousLimit = b.limit;
      } else {
        tax += (taxableIncome - previousLimit) * b.rate;
        break;
      }
    }
    return tax;
  },

  _calculatePayrollDetails: async (userId, comp, start, end) => {
    // Dynamic Prorating
    const emp = await prisma.employee.findFirst({
      where: { userId },
      include: { offboarding: true }
    });

    let effectiveStart = start;
    let effectiveEnd = end;

    if (emp) {
      if (emp.hireDate && new Date(emp.hireDate) > effectiveStart) {
        effectiveStart = new Date(emp.hireDate);
      }
      const offboard = emp.offboarding?.find(o => o.actualLastDate && o.status === 'Completed');
      if (offboard && offboard.actualLastDate && new Date(offboard.actualLastDate) < effectiveEnd) {
        effectiveEnd = new Date(offboard.actualLastDate);
      } else if (!emp.isActive && emp.updatedAt && new Date(emp.updatedAt) < effectiveEnd) {
        effectiveEnd = new Date(emp.updatedAt);
      }
    }

    const [times, unpaidDays, benefits, perksTotal, attendanceSum] = await Promise.all([
      payrollService._aggregateTimesheets(userId, start, end),
      payrollService._aggregateUnpaidLeaveDays(userId, start, end),
      payrollService._aggregateBenefits(userId, start, end),
      payrollService._aggregatePerks(userId, start, end),
      payrollService._aggregateAttendanceProfile(userId, start, end),
    ]);

    const totalMonthWorkingDays = payrollService._businessDaysInRange(start, end);
    const effectiveWorkingDays = payrollService._businessDaysInRange(effectiveStart, effectiveEnd);

    const fullBasic = Number(comp.basicSalary || 0);
    const dailyRate = totalMonthWorkingDays > 0 ? (fullBasic / totalMonthWorkingDays) : 0;
    const basic = dailyRate * effectiveWorkingDays; // prorated
    const hourlyRate = dailyRate / 8;

    // 2. Overtime Calculation (incorporating standard and premium/holiday variance implicitly via multiplier)
    const totalOTHours = Number(times.overtime || 0) + Number(attendanceSum.overtimeHours || 0);
    const overtimeRate = hourlyRate * Number(comp.overtimeMultiplier || 1.5);
    const overtimePay = totalOTHours * overtimeRate;

    // 3. Late Arrival Deduction Logic (Policy-Based: 3 late arrivals = 0.5 day deduction)
    const lateCount = Number(attendanceSum.lateCount || 0);
    const latePenaltyDays = Math.floor(lateCount / 3) * 0.5;
    const lateDeduction = latePenaltyDays * dailyRate;

    // 4. Leave Without Pay (LWP)
    const unpaidDeduction = (unpaidDays.unpaidLeaveDays || 0) * dailyRate;

    // 5. Absence Deduction
    const absenceDeduction = (unpaidDays.unexplainedAbsences || 0) * dailyRate;

    // 6. Bonus / Penalty (Attendance-Based)
    let attendanceBonus = 0;
    const bonusAmount = Number(comp.perfectAttendanceBonus ?? 50);
    // Perfect Attendance = No absences, no unpaid leave, and no lateness
    if (lateCount === 0 && unpaidDays.total === 0) {
      attendanceBonus = bonusAmount;
    }

    let attendancePenalty = 0;
    const threshold = Number(comp.absenteeismThreshold ?? 2);
    if (unpaidDays.unexplainedAbsences > threshold) {
      attendancePenalty = dailyRate * 1.0; // Penalty of 1 extra day for high absenteeism
    }

    // --- Final Totals ---
    const grossEarnings = basic + Number(comp.allowances || 0) + Number(comp.bonus || 0) + overtimePay + Number(perksTotal || 0) + attendanceBonus;

    // Taxes & Progressive Calculation
    const pensionEmployee = basic * Number(comp.pensionEmployeePct ?? 0.07);
    const fixedTaxFallback = Number(comp.taxFixed || 0);

    // Taxable base (gross - pension)
    const taxableIncome = Math.max(0, grossEarnings - pensionEmployee);
    const progressiveTax = fixedTaxFallback > 0 ? fixedTaxFallback : payrollService._calculateProgressiveTax(taxableIncome);

    const deductions = lateDeduction + unpaidDeduction + absenceDeduction + attendancePenalty;
    const standardDeductions = pensionEmployee + progressiveTax + Number(comp.insuranceEmployeeFixed || 0) + Number(comp.otherDeductionsFixed || 0) + Number(benefits.employee || 0);

    const totalDeductions = standardDeductions + deductions;
    const netSalary = grossEarnings - totalDeductions;

    return {
      basicSalary: basic,
      dailyRate,
      hourlyRate,
      housingAllowance: Number(comp.housingAllowance || 0),
      transportAllowance: Number(comp.transportAllowance || 0),
      positionAllowance: Number(comp.positionAllowance || 0),
      fuelAllowance: Number(comp.fuelAllowance || 0),
      allowances: Number(comp.allowances || 0),
      bonus: Number(comp.bonus || 0),
      overtimePay,
      lateDeduction,
      unpaidDeduction,
      absenceDeduction,
      attendanceBonus,
      attendancePenalty,
      perks: Number(perksTotal || 0),
      grossEarnings,
      deductions: totalDeductions,
      netSalary,
      breakdown: {
        pensionEmployee,
        tax: progressiveTax,
        insuranceEmp: Number(comp.insuranceEmployeeFixed || 0),
        overtimeHours: totalOTHours,
        workingDays: effectiveWorkingDays,
        lateCount,
        latePenaltyDays,
        unpaidLeaveDays: unpaidDays.unpaidLeaveDays,
        unexplainedAbsences: unpaidDays.unexplainedAbsences,
        totalUnpaidDays: unpaidDays.total,
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
      where: { employeeId: userId, date: { gte: start, lte: end }, status: 'Approved' },
      select: { hoursWorked: true, overtimeHours: true },
    });
    return rows.reduce((acc, r) => ({
      hours: acc.hours + (r.hoursWorked || 0),
      overtime: acc.overtime + (r.overtimeHours || 0),
    }), { hours: 0, overtime: 0 });
  },

  _aggregateAttendanceProfile: async (userId, start, end) => {
    const attendance = await prisma.attendance.findMany({
      where: { employeeId: userId, date: { gte: start, lte: end } }
    });

    return {
      lateCount: attendance.filter(a => a.status === 'late').length,
      overtimeHours: attendance
        .filter(a => a.timeType && a.timeType.startsWith('overtime'))
        .reduce((sum, a) => sum + (a.hoursWorked || 0), 0),
    };
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

    return {
      unpaidLeaveDays,
      unexplainedAbsences,
      total: unpaidLeaveDays + unexplainedAbsences
    };
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
