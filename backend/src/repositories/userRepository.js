const prisma = require('../config/prisma');

const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  userName: true,
  gender: true,
  age: true,
  status: true,
  role: true,
  locked: true,
  isFirstLogin: true,
  activeStatus: true,
  email: true,
  createdDate: true,
  createdBy: true,
  departmentId: true,
  positionId: true,
  managerId: true,
};

const userRepository = {
  findAll: async () => {
    return await prisma.user.findMany({
      select: SAFE_USER_SELECT
    });
  },

  findById: async (id, includeManager = false) => {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        ...SAFE_USER_SELECT,
        manager: includeManager ? { select: SAFE_USER_SELECT } : false,
      }
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

  findByEmail: async (email) => {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  findByResetToken: async (token) => {
    return await prisma.user.findFirst({
      where: { 
        resetToken: token,
        resetTokenExpiry: { gte: new Date() }
      },
    });
  },
};

module.exports = userRepository;
