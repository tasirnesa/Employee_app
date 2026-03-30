const prisma = require('../config/prisma');

const positionRepository = {
  findAll: async () => {
    return await prisma.position.findMany({
      include: {
        reportsToPosition: { select: { id: true, name: true } },
        subordinates: true,
        users: { select: { id: true, fullName: true, userName: true } }
      },
      orderBy: { level: 'asc' }
    });
  },

  findById: async (id) => {
    return await prisma.position.findUnique({
      where: { id: parseInt(id) },
      include: { reportsToPosition: true, subordinates: true, users: true }
    });
  },

  create: async (data) => {
    return await prisma.position.create({
      data,
      include: { reportsToPosition: { select: { id: true, name: true } } }
    });
  },

  update: async (id, data) => {
    return await prisma.position.update({
      where: { id: parseInt(id) },
      data,
      include: {
        reportsToPosition: true, subordinates: true,
        users: { select: { id: true, fullName: true, userName: true } }
      }
    });
  },

  delete: async (id) => {
    return await prisma.position.delete({ where: { id: parseInt(id) } });
  },

  countUsers: async (id) => {
    return await prisma.user.count({ where: { positionId: parseInt(id) } });
  },

  countSubordinates: async (id) => {
    return await prisma.position.count({ where: { reportsTo: parseInt(id) } });
  }
};

module.exports = positionRepository;
