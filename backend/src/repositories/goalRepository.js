const prisma = require('../config/prisma');

const goalRepository = {
  findAll: async (where = {}) => {
    return await prisma.goal.findMany({ where, orderBy: { gid: 'desc' } });
  },

  findById: async (gid) => {
    return await prisma.goal.findUnique({ where: { gid: parseInt(gid) } });
  },

  create: async (data) => {
    return await prisma.goal.create({ data });
  },

  update: async (gid, data) => {
    return await prisma.goal.update({ where: { gid: parseInt(gid) }, data });
  },

  delete: async (gid) => {
    return await prisma.goal.delete({ where: { gid: parseInt(gid) } });
  },

  // --- Key Result Progress ---
  findProgressLogs: async (goalId) => {
    return await prisma.keyResultProgress.findMany({
      where: { goalId: parseInt(goalId) },
      orderBy: [{ keyIndex: 'asc' }, { notedAt: 'desc' }]
    });
  },

  createProgressLog: async (data, tx = prisma) => {
    return await tx.keyResultProgress.create({ data });
  },

  // Supporting transactions in service layer
  executeTransaction: async (fn) => {
    return await prisma.$transaction(fn);
  }
};

module.exports = goalRepository;
