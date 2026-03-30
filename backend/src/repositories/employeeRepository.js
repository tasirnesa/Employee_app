const prisma = require('../config/prisma');

const employeeRepository = {
  findAll: async (where = {}) => {
    return await prisma.employee.findMany({
      where,
      orderBy: { id: 'desc' },
    });
  },

  findById: async (id) => {
    return await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });
  },

  findByEmail: async (email) => {
    return await prisma.employee.findUnique({
      where: { email },
    });
  },

  create: async (data) => {
    return await prisma.employee.create({ data });
  },

  update: async (id, data) => {
    return await prisma.employee.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  delete: async (id) => {
    return await prisma.employee.delete({
      where: { id: parseInt(id) },
    });
  },
};

module.exports = employeeRepository;
