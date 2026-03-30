const prisma = require('../config/prisma');

const evaluationRepository = {
  findAll: async () => {
    return await prisma.evaluation.findMany({
      include: {
        evaluator: { select: { fullName: true } },
        evaluatee: { select: { fullName: true } },
      },
    });
  },

  findById: async (evaluationId) => {
    return await prisma.evaluation.findUnique({
      where: { evaluationID: parseInt(evaluationId) },
      include: {
        evaluator: { select: { fullName: true, id: true } },
        evaluatee: { select: { fullName: true, id: true } },
      },
    });
  },

  findResultsByEvaluationId: async (evaluationId) => {
    return await prisma.evaluationResult.findMany({
      where: { evaluationID: parseInt(evaluationId) },
      include: { criteria: { select: { title: true, description: true, criteriaID: true } } },
      orderBy: { resultID: 'asc' },
    });
  },

  findResultsByEvaluateeId: async (evaluateeId) => {
    return await prisma.evaluationResult.findMany({
      where: { evaluation: { evaluateeID: parseInt(evaluateeId) } },
      select: { score: true },
    });
  },

  create: async (data) => {
    return await prisma.evaluation.create({ data });
  },

  createManyResults: async (results) => {
    return await prisma.evaluationResult.createMany({ data: results });
  },

  // --- Sessions ---
  findAllSessions: async () => {
    return await prisma.evaluationSession.findMany();
  },

  findSessionById: async (id) => {
    return await prisma.evaluationSession.findUnique({ where: { sessionID: parseInt(id) } });
  }
};

module.exports = evaluationRepository;
