const prisma = require('../config/prisma');

const userRepository = {
  findAll: async () => {
    return await prisma.user.findMany();
  },

  findById: async (id) => {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
  },

  findByUsername: async (username) => {
    return await prisma.user.findUnique({
      where: { userName: username },
    });
  },

  update: async (id, data) => {
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  delete: async (id) => {
    return await prisma.user.delete({
      where: { id: parseInt(id) },
    });
  },

  create: async (data) => {
    return await prisma.user.create({
      data,
    });
  },
};

module.exports = userRepository;
