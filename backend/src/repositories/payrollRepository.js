const prisma = require('../config/prisma');

const payrollRepository = {
  // --- Payslips ---
  findAllPayslips: async (where = {}) => {
    return await prisma.payslip.findMany({
      where,
      include: { employee: { select: { id: true, fullName: true, userName: true } } },
      orderBy: { generatedDate: 'desc' }
    });
  },

  findPayslipById: async (id) => {
    return await prisma.payslip.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  findPayslipByPeriod: async (employeeId, period) => {
    return await prisma.payslip.findFirst({
      where: { employeeId: parseInt(employeeId), period }
    });
  },

  createPayslip: async (data) => {
    return await prisma.payslip.create({
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  updatePayslip: async (id, data) => {
    return await prisma.payslip.update({
      where: { id: parseInt(id) },
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  deletePayslip: async (id) => {
    return await prisma.payslip.delete({ where: { id: parseInt(id) } });
  },

  // --- Compensations ---
  findAllCompensations: async (where = {}) => {
    return await prisma.compensation.findMany({
      where,
      include: { employee: { select: { id: true, fullName: true, userName: true } } },
      orderBy: { effectiveDate: 'desc' }
    });
  },

  findActiveCompensation: async (userId, periodEnd) => {
    return await prisma.compensation.findFirst({
      where: { employeeId: userId, status: 'Active', effectiveDate: { lte: periodEnd } },
      orderBy: { effectiveDate: 'desc' },
    });
  },

  createCompensation: async (data) => {
    return await prisma.compensation.create({
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  updateCompensation: async (id, data) => {
    return await prisma.compensation.update({
      where: { id: parseInt(id) },
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  deleteCompensation: async (id) => {
    return await prisma.compensation.delete({ where: { id: parseInt(id) } });
  },
};

module.exports = payrollRepository;
