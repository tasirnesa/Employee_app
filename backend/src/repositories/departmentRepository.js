const prisma = require('../config/prisma');

const departmentRepository = {
  findAll: async () => {
    return await prisma.department.findMany({
      include: {
        manager: { select: { id: true, fullName: true, userName: true } },
        users: { select: { id: true, fullName: true, userName: true } }
      },
      orderBy: { name: 'asc' }
    });
  },

  findById: async (id) => {
    return await prisma.department.findUnique({
      where: { id: parseInt(id) },
      include: { manager: true, users: true }
    });
  },

  create: async (data) => {
    return await prisma.department.create({
      data,
      include: { manager: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  update: async (id, data) => {
    return await prisma.department.update({
      where: { id: parseInt(id) },
      data,
      include: {
        manager: { select: { id: true, fullName: true, userName: true } },
        users: { select: { id: true, fullName: true, userName: true } }
      }
    });
  },

  delete: async (id) => {
    return await prisma.department.delete({ where: { id: parseInt(id) } });
  },

  countUsers: async (id) => {
    return await prisma.user.count({ where: { departmentId: parseInt(id) } });
  }
};

module.exports = departmentRepository;
