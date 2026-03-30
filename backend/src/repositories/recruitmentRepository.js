const prisma = require('../config/prisma');

const recruitmentRepository = {
  findAllCandidates: async (where = {}) => {
    return await prisma.candidate.findMany({
      where,
      orderBy: { appliedDate: 'desc' }
    });
  },

  findCandidateById: async (id) => {
    return await prisma.candidate.findUnique({
      where: { id: parseInt(id) }
    });
  },

  createCandidate: async (data) => {
    return await prisma.candidate.create({ data });
  },

  updateCandidate: async (id, data) => {
    return await prisma.candidate.update({
      where: { id: parseInt(id) },
      data
    });
  },

  deleteCandidate: async (id) => {
    return await prisma.candidate.delete({
      where: { id: parseInt(id) }
    });
  }
};

module.exports = recruitmentRepository;
