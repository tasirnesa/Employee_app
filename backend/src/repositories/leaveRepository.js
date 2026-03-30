const prisma = require('../config/prisma');

const leaveRepository = {
  findAll: async (where = {}) => {
    return await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: { id: true, fullName: true, userName: true, departmentId: true }
        },
        leaveType: {
          select: { id: true, name: true, description: true, maxDays: true, isPaid: true }
        },
        approver: {
          select: { id: true, fullName: true }
        }
      },
      orderBy: { appliedDate: 'desc' }
    });
  },

  findById: async (id) => {
    return await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: { select: { id: true, fullName: true, userName: true, departmentId: true } },
        leaveType: { select: { id: true, name: true, description: true, maxDays: true, isPaid: true } },
        approver: { select: { id: true, fullName: true } }
      }
    });
  },

  findOverlapping: async (employeeId, start, end) => {
    return await prisma.leave.findMany({
      where: {
        employeeId: parseInt(employeeId),
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } }
            ]
          }
        ]
      },
      include: {
        leaveType: { select: { name: true } }
      }
    });
  },

  aggregateApprovedDays: async (employeeId, yearStart) => {
    return await prisma.leave.aggregate({
      _sum: { days: true },
      where: {
        employeeId: parseInt(employeeId),
        status: 'Approved',
        startDate: { gte: yearStart }
      },
    });
  },

  create: async (data) => {
    return await prisma.leave.create({
      data,
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        leaveType: { select: { id: true, name: true, description: true, maxDays: true, isPaid: true } }
      }
    });
  },

  update: async (id, data) => {
    return await prisma.leave.update({
      where: { id: parseInt(id) },
      data,
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        leaveType: { select: { id: true, name: true, description: true, maxDays: true, isPaid: true } },
        approver: { select: { id: true, fullName: true } }
      }
    });
  },

  delete: async (id) => {
    return await prisma.leave.delete({
      where: { id: parseInt(id) },
    });
  },

  // --- Leave Types ---
  findAllTypes: async () => {
    return await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
  },

  findTypeById: async (id) => {
    return await prisma.leaveType.findUnique({ where: { id: parseInt(id) } });
  },

  createType: async (data) => {
    return await prisma.leaveType.create({ data });
  },

  updateType: async (id, data) => {
    return await prisma.leaveType.update({ where: { id: parseInt(id) }, data });
  },

  deleteType: async (id) => {
    return await prisma.leaveType.delete({ where: { id: parseInt(id) } });
  },

  countLeavesByType: async (typeId) => {
    return await prisma.leave.count({ where: { leaveTypeId: parseInt(typeId) } });
  }
};

module.exports = leaveRepository;
