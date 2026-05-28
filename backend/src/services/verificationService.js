const prisma = require('../config/prisma');

const verificationService = {
  createVerification: async (onboardingId, data) => {
    return await prisma.onboardingVerification.create({
      data: {
        ...data,
        onboardingId: parseInt(onboardingId)
      }
    });
  },

  getVerifications: async (onboardingId) => {
    return await prisma.onboardingVerification.findMany({
      where: { onboardingId: parseInt(onboardingId) },
      orderBy: { type: 'asc' }
    });
  },

  updateVerification: async (id, data) => {
    const updateData = { ...data };
    if (data.status === 'Verified' && !data.verifiedAt) {
      updateData.verifiedAt = new Date();
    }
    return await prisma.onboardingVerification.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  },

  deleteVerification: async (id) => {
    return await prisma.onboardingVerification.delete({
      where: { id: parseInt(id) }
    });
  },

  initializeDefaults: async (onboardingId) => {
    const defaults = [
      { type: 'Identity', status: 'Pending', notes: 'Verify National ID or Passport' },
      { type: 'Background', status: 'Pending', notes: 'Educational and experience verification' },
      { type: 'Criminal', status: 'Pending', notes: 'Police clearance certificate' },
      { type: 'Medical', status: 'Pending', notes: 'Health fitness certificate' },
      { type: 'Reference', status: 'Pending', notes: 'Contact previous employers' }
    ];

    return await prisma.onboardingVerification.createMany({
      data: defaults.map(d => ({ ...d, onboardingId: parseInt(onboardingId) }))
    });
  }
};

module.exports = verificationService;
