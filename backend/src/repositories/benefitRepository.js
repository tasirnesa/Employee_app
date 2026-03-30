const prisma = require('../config/prisma');

const benefitRepository = {
  // --- Benefits ---
  findAllBenefits: async (where = {}) => {
    return await prisma.benefit.findMany({
      where,
      include: { employee: { select: { id: true, fullName: true, userName: true } } },
      orderBy: { effectiveDate: 'desc' }
    });
  },

  findBenefitById: async (id) => {
    return await prisma.benefit.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  createBenefit: async (data) => {
    return await prisma.benefit.create({
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  updateBenefit: async (id, data) => {
    return await prisma.benefit.update({
      where: { id: parseInt(id) },
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  deleteBenefit: async (id) => {
    return await prisma.benefit.delete({ where: { id: parseInt(id) } });
  },

  // --- Perks ---
  findAllPerks: async (where = {}) => {
    return await prisma.perk.findMany({
      where,
      include: { employee: { select: { id: true, fullName: true, userName: true } } },
      orderBy: { startDate: 'desc' }
    });
  },

  findPerkById: async (id) => {
    return await prisma.perk.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  createPerk: async (data) => {
    return await prisma.perk.create({
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  updatePerk: async (id, data) => {
    return await prisma.perk.update({
      where: { id: parseInt(id) },
      data,
      include: { employee: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  deletePerk: async (id) => {
    return await prisma.perk.delete({ where: { id: parseInt(id) } });
  }
};

module.exports = benefitRepository;
