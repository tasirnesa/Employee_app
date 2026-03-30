const prisma = require('../config/prisma');

const criteriaRepository = {
  findAll: async () => {
    return await prisma.evaluationCriteria.findMany({
      include: { creator: { select: { fullName: true } } },
      orderBy: { criteriaID: 'desc' },
    });
  },

  findById: async (id) => {
    return await prisma.evaluationCriteria.findUnique({
      where: { criteriaID: parseInt(id) },
      include: { creator: { select: { fullName: true } } },
    });
  },

  create: async (data) => {
    return await prisma.evaluationCriteria.create({ data });
  },

  createMany: async (data) => {
    return await prisma.evaluationCriteria.createMany({ data });
  },

  update: async (id, data) => {
    return await prisma.evaluationCriteria.update({
      where: { criteriaID: parseInt(id) },
      data,
    });
  },

  delete: async (id) => {
    return await prisma.evaluationCriteria.delete({
      where: { criteriaID: parseInt(id) },
    });
  },

  countUsage: async (id) => {
    return await prisma.evaluation.count({
      where: {
        OR: [
          { criteriaID: parseInt(id) },
          { criteriaIDs: { has: parseInt(id) } }
        ]
      }
    });
  }
};

module.exports = criteriaRepository;
