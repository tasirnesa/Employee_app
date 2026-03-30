const benefitRepository = require('../repositories/benefitRepository');

const benefitService = {
  // --- Benefits logic ---
  getBenefits: async (employeeId = null, benefitType = null) => {
    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (benefitType) where.benefitType = benefitType;
    return await benefitRepository.findAllBenefits(where);
  },

  createBenefit: async (data) => {
    return await benefitRepository.createBenefit({
      ...data,
      employeeId: parseInt(data.employeeId),
      monthlyCost: parseFloat(data.monthlyCost),
      employeeContribution: parseFloat(data.employeeContribution),
      companyContribution: parseFloat(data.companyContribution),
      effectiveDate: new Date(data.effectiveDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      status: data.status || 'Active'
    });
  },

  updateBenefit: async (id, data) => {
    const updateData = { ...data };
    if (data.effectiveDate) updateData.effectiveDate = new Date(data.effectiveDate);
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.monthlyCost) updateData.monthlyCost = parseFloat(data.monthlyCost);
    if (data.employeeContribution) updateData.employeeContribution = parseFloat(data.employeeContribution);
    if (data.companyContribution) updateData.companyContribution = parseFloat(data.companyContribution);

    return await benefitRepository.updateBenefit(id, updateData);
  },

  deleteBenefit: async (id) => {
    return await benefitRepository.deleteBenefit(id);
  },

  // --- Perks logic ---
  getPerks: async (employeeId = null, perkType = null) => {
    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (perkType) where.perkType = perkType;
    return await benefitRepository.findAllPerks(where);
  },

  createPerk: async (data) => {
    return await benefitRepository.createPerk({
      ...data,
      employeeId: parseInt(data.employeeId),
      value: parseFloat(data.value) || 0,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status || 'Active'
    });
  },

  updatePerk: async (id, data) => {
    const updateData = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.value) updateData.value = parseFloat(data.value);

    return await benefitRepository.updatePerk(id, updateData);
  },

  deletePerk: async (id) => {
    return await benefitRepository.deletePerk(id);
  }
};

module.exports = benefitService;
