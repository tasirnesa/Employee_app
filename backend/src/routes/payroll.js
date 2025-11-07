const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma/client');
const fs = require('fs');
const path = require('path');

// Get all payslips
router.get('/payslips', async (req, res) => {
  try {
    const payslips = await prisma.payslip.findMany({
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: {
        generatedDate: 'desc'
      }
    });

    res.json(payslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// Get payslips for specific employee
router.get('/payslips/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const payslips = await prisma.payslip.findMany({
      where: {
        employeeId: parseInt(employeeId)
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: {
        generatedDate: 'desc'
      }
    });

    res.json(payslips);
  } catch (error) {
    console.error('Error fetching employee payslips:', error);
    res.status(500).json({ error: 'Failed to fetch employee payslips' });
  }
});

// Create new payslip
router.post('/payslips', async (req, res) => {
  try {
    console.log('Received payslip request:', req.body);
    const { employeeId, period, basicSalary, allowances, deductions, status } = req.body;
    
    console.log('Parsed data:', { employeeId, period, basicSalary, allowances, deductions, status });
    
    // Validate required fields
    if (!employeeId || !period || basicSalary === undefined || allowances === undefined || deductions === undefined) {
      return res.status(400).json({ error: 'Missing required fields: employeeId, period, basicSalary, allowances, deductions' });
    }
    
    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(employeeId) }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);
    
    console.log('Calculated net salary:', netSalary);
    
    const payslip = await prisma.payslip.create({
      data: {
        employeeId: parseInt(employeeId),
        period,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        deductions: parseFloat(deductions),
        netSalary,
        status: status || 'Generated'
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    console.log('Created payslip:', payslip);
    res.status(201).json(payslip);
  } catch (error) {
    console.error('Error creating payslip:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create payslip', details: error.message });
  }
});

// Update payslip
router.put('/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { period, basicSalary, allowances, deductions, status, paidDate } = req.body;
    
    const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);
    
    const payslip = await prisma.payslip.update({
      where: { id: parseInt(id) },
      data: {
        period,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        deductions: parseFloat(deductions),
        netSalary,
        status,
        paidDate: paidDate ? new Date(paidDate) : null
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.json(payslip);
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ error: 'Failed to update payslip' });
  }
});

// Delete payslip
router.delete('/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.payslip.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ error: 'Failed to delete payslip' });
  }
});

// Get all compensations
router.get('/compensations', async (req, res) => {
  try {
    const compensations = await prisma.compensation.findMany({
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    res.json(compensations);
  } catch (error) {
    console.error('Error fetching compensations:', error);
    res.status(500).json({ error: 'Failed to fetch compensations' });
  }
});

// Get compensations for specific employee
router.get('/compensations/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const compensations = await prisma.compensation.findMany({
      where: {
        employeeId: parseInt(employeeId)
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    res.json(compensations);
  } catch (error) {
    console.error('Error fetching employee compensations:', error);
    res.status(500).json({ error: 'Failed to fetch employee compensations' });
  }
});

// Create new compensation
router.post('/compensations', async (req, res) => {
  try {
    const { employeeId, position, basicSalary, allowances, bonus, effectiveDate, status } = req.body;
    
    // Validate required fields
    if (!employeeId || !position || basicSalary === undefined || allowances === undefined || bonus === undefined || !effectiveDate) {
      return res.status(400).json({ error: 'Missing required fields: employeeId, position, basicSalary, allowances, bonus, effectiveDate' });
    }
    
    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(employeeId) }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const totalCompensation = parseFloat(basicSalary) + parseFloat(allowances) + parseFloat(bonus);
    
    const compensation = await prisma.compensation.create({
      data: {
        employeeId: parseInt(employeeId),
        position,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        bonus: parseFloat(bonus),
        totalCompensation,
        effectiveDate: new Date(effectiveDate),
        status: status || 'Active'
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.status(201).json(compensation);
  } catch (error) {
    console.error('Error creating compensation:', error);
    res.status(500).json({ error: 'Failed to create compensation' });
  }
});

// Update compensation
router.put('/compensations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, basicSalary, allowances, bonus, effectiveDate, status } = req.body;
    
    const totalCompensation = parseFloat(basicSalary) + parseFloat(allowances) + parseFloat(bonus);
    
    const compensation = await prisma.compensation.update({
      where: { id: parseInt(id) },
      data: {
        position,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        bonus: parseFloat(bonus),
        totalCompensation,
        effectiveDate: new Date(effectiveDate),
        status
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.json(compensation);
  } catch (error) {
    console.error('Error updating compensation:', error);
    res.status(500).json({ error: 'Failed to update compensation' });
  }
});

// Delete compensation
router.delete('/compensations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.compensation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Compensation deleted successfully' });
  } catch (error) {
    console.error('Error deleting compensation:', error);
    res.status(500).json({ error: 'Failed to delete compensation' });
  }
});

module.exports = router;

// --- Payroll Run (compute payslips for a month) ---
// Helper utilities
function startOfMonth(periodLabel) {
  // periodLabel: 'YYYY-MM' or null → current month
  if (periodLabel && /^\d{4}-\d{2}$/.test(periodLabel)) {
    const [y, m] = periodLabel.split('-').map((n) => parseInt(n, 10));
    return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function businessDaysInRange(start, end) {
  let days = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
    d.setDate(d.getDate() + 1);
  }
  return Math.max(days, 1);
}

async function getActiveCompensation(prisma, userId, periodEnd) {
  const comp = await prisma.compensation.findFirst({
    where: { employeeId: userId, status: 'Active', effectiveDate: { lte: periodEnd } },
    orderBy: { effectiveDate: 'desc' },
  });
  return comp || null;
}

// Position-based payroll configuration persisted to a JSON file (no DB migration needed)
const CONFIG_FILE = path.join(__dirname, '..', 'payroll.position.config.json');
const SCALE_CONFIG_FILE = path.join(__dirname, '..', 'payroll.scale.config.json');
const SCALE_ASSIGN_FILE = path.join(__dirname, '..', 'payroll.scale.assignments.json');
function loadPositionConfigs() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}
function savePositionConfigs(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

function loadScaleConfigs() {
  try {
    if (!fs.existsSync(SCALE_CONFIG_FILE)) return {};
    const raw = fs.readFileSync(SCALE_CONFIG_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}
function saveScaleConfigs(cfg) {
  fs.writeFileSync(SCALE_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}
function loadScaleAssignments() {
  try {
    if (!fs.existsSync(SCALE_ASSIGN_FILE)) return {};
    const raw = fs.readFileSync(SCALE_ASSIGN_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}
function saveScaleAssignments(map) {
  fs.writeFileSync(SCALE_ASSIGN_FILE, JSON.stringify(map, null, 2), 'utf8');
}

async function aggregateTimesheets(prisma, userId, start, end) {
  const rows = await prisma.timesheet.findMany({
    where: { employeeId: userId, date: { gte: start, lte: end } },
    select: { hoursWorked: true, overtimeHours: true },
  });
  return rows.reduce((acc, r) => ({
    hours: acc.hours + (r.hoursWorked || 0),
    overtime: acc.overtime + (r.overtimeHours || 0),
  }), { hours: 0, overtime: 0 });
}

async function aggregateUnpaidLeaveDays(prisma, userId, start, end) {
  const leaves = await prisma.leave.findMany({
    where: {
      employeeId: userId,
      status: 'Approved',
      OR: [
        { startDate: { gte: start, lte: end } },
        { endDate: { gte: start, lte: end } },
      ],
    },
    include: { leaveType: true },
  });
  // Count only unpaid leave types
  return leaves
    .filter((l) => l.leaveType && l.leaveType.isPaid === false)
    .reduce((s, l) => s + (l.days || 0), 0);
}

async function aggregateBenefits(prisma, userId, start, end) {
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
}

async function aggregatePerks(prisma, userId, start, end) {
  const perks = await prisma.perk.findMany({
    where: {
      employeeId: userId,
      status: 'Active',
      startDate: { lte: end },
      OR: [{ endDate: null }, { endDate: { gte: start } }],
    },
    select: { value: true, frequency: true },
  });
  // Treat all active perks as monthly add-ons for simplicity
  return perks.reduce((s, p) => s + Number(p.value || 0), 0);
}

function computePayroll({ comp, times, unpaidDays, start, end, benefits, perksTotal }) {
  const workingDays = businessDaysInRange(start, end);
  const basic = Number(comp?.basicSalary || 0);
  const allowances = Number(comp?.allowances || 0);
  const bonus = Number(comp?.bonus || 0);
  const hours = Number(times.hours || 0);
  const overtimeHours = Number(times.overtime || 0);
  const hourlyRate = workingDays > 0 ? (basic / (workingDays * 8)) : 0;
  const overtimeMultiplier = Number(comp?.overtimeMultiplier || 1.5);
  const overtimeRate = hourlyRate * overtimeMultiplier;
  const unpaidDeduction = (basic / workingDays) * (unpaidDays || 0);
  const overtimePay = overtimeHours * overtimeRate;

  const taxablePerks = Number(perksTotal || 0); // assume taxable
  const gross = basic + allowances + bonus + overtimePay + taxablePerks - unpaidDeduction;
  // Simple baseline deductions (adjust with real tax/pension rules as needed)
  const pensionEmployeePct = Number(comp?.pensionEmployeePct ?? 0.07); // default 7%
  const pensionEmployee = basic * pensionEmployeePct;
  const tax = Number(comp?.taxFixed || 0); // placeholder
  const insuranceEmp = Number(comp?.insuranceEmployeeFixed || 0);
  const other = Number(comp?.otherDeductionsFixed || 0);
  const benefitsEmployee = Number(benefits?.employee || 0);
  const benefitsEmployer = Number(benefits?.employer || 0);
  const totalDeductions = pensionEmployee + tax + insuranceEmp + other + benefitsEmployee;
  const net = gross - totalDeductions;

  return {
    basicSalary: basic,
    allowances,
    bonus,
    overtimePay,
    unpaidDeduction,
    perks: taxablePerks,
    grossEarnings: gross,
    deductions: totalDeductions,
    netSalary: net,
    breakdown: {
      pensionEmployee,
      tax,
      insuranceEmp,
      overtimeHours,
      workingDays,
      unpaidDays,
      benefitsEmployee,
      benefitsEmployer,
    },
  };
}

router.post('/run', async (req, res) => {
  try {
    const periodLabel = req.body?.period || null; // 'YYYY-MM'
    const start = startOfMonth(periodLabel);
    const end = endOfMonth(start);

    const users = await prisma.user.findMany({ select: { id: true, status: true, activeStatus: true, positionId: true } });
    const posCfg = loadPositionConfigs();
    const scaleCfg = loadScaleConfigs();
    const scaleAssign = loadScaleAssignments();
    const results = [];
    for (const u of users) {
      // skip inactive/locked users
      const isActive = String(u.status).toLowerCase() === 'true' && String(u.activeStatus).toLowerCase() === 'true';
      if (!isActive) continue;

      let comp = await getActiveCompensation(prisma, u.id, end);
      // If no per-employee compensation, try scale assignment first
      if (!comp) {
        const scaleKey = scaleAssign[String(u.id)] || null;
        if (scaleKey) {
          const sCfg = scaleCfg[String(scaleKey)] || null;
          if (sCfg) {
            comp = {
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
        }
      }
      // Fallback to position defaults
      if (!comp && u.positionId) {
        const pCfg = posCfg[String(u.positionId)] || null;
        if (pCfg) {
          comp = {
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
      }
      if (!comp) continue; // still nothing

      const times = await aggregateTimesheets(prisma, u.id, start, end);
      const unpaidDays = await aggregateUnpaidLeaveDays(prisma, u.id, start, end);
      const benefits = await aggregateBenefits(prisma, u.id, start, end);
      const perksTotal = await aggregatePerks(prisma, u.id, start, end);
      const calc = computePayroll({ comp, times, unpaidDays, start, end, benefits, perksTotal });

      const payslip = await prisma.payslip.upsert({
        where: { id: 0 }, // prisma needs unique; emulate by find first then update/create
        update: {},
        create: {
          employeeId: u.id,
          period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
          basicSalary: calc.basicSalary,
          allowances: calc.allowances,
          deductions: calc.deductions,
          netSalary: calc.netSalary,
          status: 'Generated',
        },
      });
      // Upsert workaround: check if existing then update
      if (!payslip?.id) {
        const existing = await prisma.payslip.findFirst({ where: { employeeId: u.id, period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}` } });
        if (existing) {
          const updated = await prisma.payslip.update({
            where: { id: existing.id },
            data: {
              basicSalary: calc.basicSalary,
              allowances: calc.allowances,
              deductions: calc.deductions,
              netSalary: calc.netSalary,
              status: 'Generated',
            },
          });
          results.push({ userId: u.id, payslip: updated, calc });
        } else {
          const created = await prisma.payslip.create({
            data: {
              employeeId: u.id,
              period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
              basicSalary: calc.basicSalary,
              allowances: calc.allowances,
              deductions: calc.deductions,
              netSalary: calc.netSalary,
              status: 'Generated',
            },
          });
          results.push({ userId: u.id, payslip: created, calc });
        }
      } else {
        results.push({ userId: u.id, payslip, calc });
      }
    }
    return res.status(200).json({ period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`, count: results.length, results });
  } catch (error) {
    console.error('Payroll run error:', error);
    return res.status(500).json({ error: 'Failed to run payroll', details: error.message });
  }
});

// Preview calculation for a single employee/period (does not create a payslip)
router.post('/preview', async (req, res) => {
  try {
    const { employeeId, period } = req.body || {};
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });
    const start = startOfMonth(period || null);
    const end = endOfMonth(start);
    const u = await prisma.user.findUnique({ where: { id: parseInt(employeeId) }, select: { id: true, positionId: true, status: true, activeStatus: true } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    const isActive = String(u.status).toLowerCase() === 'true' && String(u.activeStatus).toLowerCase() === 'true';
    if (!isActive) return res.status(400).json({ error: 'User inactive' });
    const posCfg = loadPositionConfigs();
    let comp = await getActiveCompensation(prisma, u.id, end);
    if (!comp && u.positionId) {
      const pCfg = posCfg[String(u.positionId)] || null;
      if (pCfg) {
        comp = {
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
    }
    if (!comp) return res.status(400).json({ error: 'No compensation found' });

    const times = await aggregateTimesheets(prisma, u.id, start, end);
    const unpaidDays = await aggregateUnpaidLeaveDays(prisma, u.id, start, end);
    const benefits = await aggregateBenefits(prisma, u.id, start, end);
    const perksTotal = await aggregatePerks(prisma, u.id, start, end);
    const calc = computePayroll({ comp, times, unpaidDays, start, end, benefits, perksTotal });
    return res.json({ period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`, calc });
  } catch (e) {
    console.error('Payroll preview error:', e);
    return res.status(500).json({ error: 'Failed to preview', details: e.message });
  }
});

// --- Position Payroll Config Endpoints ---
// GET all position configs
router.get('/position-config', async (req, res) => {
  const cfg = loadPositionConfigs();
  return res.json(cfg);
});

// --- Scale Payroll Config Endpoints ---
// Get all scales
router.get('/scale-config', async (req, res) => {
  return res.json(loadScaleConfigs());
});
// Get one scale
router.get('/scale-config/:scaleKey', async (req, res) => {
  const cfg = loadScaleConfigs();
  return res.json(cfg[String(req.params.scaleKey)] || null);
});
// Create/update scale
// Body: { label, basicSalary, allowances, bonus, overtimeMultiplier, pensionEmployeePct, taxFixed, insuranceEmployeeFixed, otherDeductionsFixed }
router.put('/scale-config/:scaleKey', async (req, res) => {
  try {
    const key = String(req.params.scaleKey);
    const existing = loadScaleConfigs();
    existing[key] = {
      label: req.body?.label || existing[key]?.label || key,
      basicSalary: Number(req.body?.basicSalary || 0),
      allowances: Number(req.body?.allowances || 0),
      bonus: Number(req.body?.bonus || 0),
      overtimeMultiplier: Number(req.body?.overtimeMultiplier || 1.5),
      pensionEmployeePct: req.body?.pensionEmployeePct != null ? Number(req.body?.pensionEmployeePct) : 0.07,
      taxFixed: Number(req.body?.taxFixed || 0),
      insuranceEmployeeFixed: Number(req.body?.insuranceEmployeeFixed || 0),
      otherDeductionsFixed: Number(req.body?.otherDeductionsFixed || 0),
      updatedAt: new Date().toISOString(),
    };
    saveScaleConfigs(existing);
    return res.json(existing[key]);
  } catch (e) {
    console.error('Failed to save scale config:', e);
    return res.status(500).json({ error: 'Failed to save scale config' });
  }
});

// Assign a scale to a user
router.put('/scale-assignment/:userId', async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const { scaleKey } = req.body || {};
    if (!scaleKey) return res.status(400).json({ error: 'scaleKey is required' });
    const users = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!users) return res.status(404).json({ error: 'User not found' });
    const cfg = loadScaleConfigs();
    if (!cfg[String(scaleKey)]) return res.status(400).json({ error: 'Scale not found' });
    const map = loadScaleAssignments();
    map[userId] = String(scaleKey);
    saveScaleAssignments(map);
    return res.json({ userId: parseInt(userId), scaleKey });
  } catch (e) {
    console.error('Failed to assign scale:', e);
    return res.status(500).json({ error: 'Failed to assign scale' });
  }
});

// Get assigned scale for user
router.get('/scale-assignment/:userId', async (req, res) => {
  const map = loadScaleAssignments();
  const userId = String(req.params.userId);
  return res.json({ userId: parseInt(userId), scaleKey: map[userId] || null });
});

// GET config for a position
router.get('/position-config/:positionId', async (req, res) => {
  const cfg = loadPositionConfigs();
  const data = cfg[String(req.params.positionId)] || null;
  return res.json(data);
});

// PUT config for a position (create/update)
// Body: { positionName, basicSalary, allowances, bonus, overtimeMultiplier, pensionEmployeePct, taxFixed, insuranceEmployeeFixed, otherDeductionsFixed }
router.put('/position-config/:positionId', async (req, res) => {
  try {
    const positionId = String(req.params.positionId);
    const existing = loadPositionConfigs();
    existing[positionId] = {
      positionName: req.body?.positionName || existing[positionId]?.positionName || '',
      basicSalary: Number(req.body?.basicSalary || 0),
      allowances: Number(req.body?.allowances || 0),
      bonus: Number(req.body?.bonus || 0),
      overtimeMultiplier: Number(req.body?.overtimeMultiplier || 1.5),
      pensionEmployeePct: req.body?.pensionEmployeePct != null ? Number(req.body?.pensionEmployeePct) : 0.07,
      taxFixed: Number(req.body?.taxFixed || 0),
      insuranceEmployeeFixed: Number(req.body?.insuranceEmployeeFixed || 0),
      otherDeductionsFixed: Number(req.body?.otherDeductionsFixed || 0),
      updatedAt: new Date().toISOString(),
    };
    savePositionConfigs(existing);
    return res.json(existing[positionId]);
  } catch (e) {
    console.error('Failed to save position config:', e);
    return res.status(500).json({ error: 'Failed to save config' });
  }
});
