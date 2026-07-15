const prisma = require('../config/prisma');

const probationService = {
  getProbationByOnboardingId: async (onboardingId) => {
    return await prisma.probationPeriod.findUnique({
      where: { onboardingId: parseInt(onboardingId) }
    });
  },

  getAllProbations: async () => {
    return await prisma.probationPeriod.findMany({
      include: {
        onboarding: {
          include: {
            employee: true
          }
        }
      }
    });
  },

  createProbation: async (onboardingId, data) => {
    return await prisma.probationPeriod.create({
      data: {
        ...data,
        onboardingId: parseInt(onboardingId)
      }
    });
  },

  updateProbation: async (id, data) => {
    const processedData = { ...data };
    if (data.startDate) processedData.startDate = new Date(data.startDate);
    if (data.endDate) processedData.endDate = new Date(data.endDate);
    if (data.notifiedAt) processedData.notifiedAt = new Date(data.notifiedAt);

    return await prisma.probationPeriod.update({
      where: { id: parseInt(id) },
      data: processedData
    });
  },

  evaluateProbation: async (id, status, feedback) => {
    return await prisma.probationPeriod.update({
      where: { id: parseInt(id) },
      data: {
        status,
        feedback,
        evaluation: `Evaluated as ${status} on ${new Date().toLocaleDateString()}`
      }
    });
  }
};

module.exports = probationService;
