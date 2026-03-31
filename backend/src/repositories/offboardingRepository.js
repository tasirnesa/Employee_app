const prisma = require('../config/prisma');

const offboardingRepository = {
  findAll: async (where = {}) => {
    return await prisma.offboarding.findMany({
      where,
      include: {
        employee: true,
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id) => {
    return await prisma.offboarding.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: true,
        tasks: true
      }
    });
  },

  findByEmployeeId: async (employeeId) => {
    return await prisma.offboarding.findFirst({
      where: { employeeId: parseInt(employeeId) },
      include: { tasks: true }
    });
  },

  create: async (data, tasks = []) => {
    return await prisma.offboarding.create({
      data: {
        ...data,
        tasks: {
          create: tasks
        }
      },
      include: { tasks: true }
    });
  },

  update: async (id, data) => {
    return await prisma.offboarding.update({
      where: { id: parseInt(id) },
      data
    });
  },

  updateTask: async (taskId, data) => {
    return await prisma.offboardingTask.update({
      where: { id: parseInt(taskId) },
      data
    });
  },

  getTaskById: async (taskId) => {
    return await prisma.offboardingTask.findUnique({
      where: { id: parseInt(taskId) }
    });
  }
};

module.exports = offboardingRepository;
