const benefitRepository = require('../repositories/benefitRepository');
const communicationService = require('./communicationService');
const employeeRepository = require('../repositories/employeeRepository');

const benefitService = {
  // --- Benefits logic ---
  getBenefits: async (employeeId = null, benefitType = null) => {
    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (benefitType) where.benefitType = benefitType;
    return await benefitRepository.findAllBenefits(where);
  },

  createBenefit: async (data) => {
    const benefit = await benefitRepository.createBenefit({
      ...data,
      employeeId: parseInt(data.employeeId),
      monthlyCost: parseFloat(data.monthlyCost),
      employeeContribution: parseFloat(data.employeeContribution),
      companyContribution: parseFloat(data.companyContribution),
      effectiveDate: new Date(data.effectiveDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      status: data.status || 'Active'
    });

    // Notify Employee
    try {
      await communicationService.notify(
        data.employeeId,
        'New Benefit Assigned',
        `You have been assigned a new benefit: ${data.benefitName || data.type || 'Benefits Package'}.`,
        'SUCCESS',
        '/benefits'
      );
    } catch (e) {
      console.warn('Failed to notify employee of new benefit', e.message);
    }

    return benefit;
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
    const perk = await benefitRepository.createPerk({
      ...data,
      employeeId: parseInt(data.employeeId),
      value: parseFloat(data.value) || 0,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status || 'Active'
    });

    // Notify Employee
    try {
      await communicationService.notify(
        data.employeeId,
        'New Perk Assigned',
        `You have been assigned a new perk: ${data.perkName || data.type || 'Company Perk'}.`,
        'SUCCESS',
        '/benefits'
      );
    } catch (e) {
      console.warn('Failed to notify employee of new perk', e.message);
    }

    return perk;
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
