const prisma = require('../config/prisma');

const attendanceRepository = {
  findAll: async (where = {}) => {
    return await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  },

  findById: async (id) => {
    return await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
    });
  },

  findLatestRecord: async (employeeId, date, checkOutTime = undefined) => {
    const where = {
      employeeId: parseInt(employeeId),
      date: date,
    };
    if (checkOutTime !== undefined) where.checkOutTime = checkOutTime;
    
    return await prisma.attendance.findFirst({
      where,
    });
  },

  create: async (data) => {
    return await prisma.attendance.create({ data });
  },

  update: async (id, data) => {
    return await prisma.attendance.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  delete: async (id) => {
    return await prisma.attendance.delete({
      where: { id: parseInt(id) },
    });
  },
};

module.exports = attendanceRepository;
