const benefitService = require('../services/benefitService');
const asyncHandler = require('../utils/asyncHandler');

const benefitController = {
  // --- Benefits ---
  getBenefits: asyncHandler(async (req, res) => {
    const benefits = await benefitService.getBenefits();
    res.json(benefits);
  }),

  getEmployeeBenefits: asyncHandler(async (req, res) => {
    const benefits = await benefitService.getBenefits(req.params.employeeId);
    res.json(benefits);
  }),

  getBenefitsByType: asyncHandler(async (req, res) => {
    const benefits = await benefitService.getBenefits(null, req.params.benefitType);
    res.json(benefits);
  }),

  createBenefit: asyncHandler(async (req, res) => {
    const benefit = await benefitService.createBenefit(req.body);
    res.status(201).json(benefit);
  }),

  updateBenefit: asyncHandler(async (req, res) => {
    const benefit = await benefitService.updateBenefit(req.params.id, req.body);
    res.json(benefit);
  }),

  deleteBenefit: asyncHandler(async (req, res) => {
    await benefitService.deleteBenefit(req.params.id);
    res.json({ message: 'Benefit deleted successfully' });
  }),

  // --- Perks ---
  getPerks: asyncHandler(async (req, res) => {
    const perks = await benefitService.getPerks();
    res.json(perks);
  }),

  getEmployeePerks: asyncHandler(async (req, res) => {
    const perks = await benefitService.getPerks(req.params.employeeId);
    res.json(perks);
  }),

  getPerksByType: asyncHandler(async (req, res) => {
    const perks = await benefitService.getPerks(null, req.params.perkType);
    res.json(perks);
  }),

  createPerk: asyncHandler(async (req, res) => {
    const perk = await benefitService.createPerk(req.body);
    res.status(201).json(perk);
  }),

  updatePerk: asyncHandler(async (req, res) => {
    const perk = await benefitService.updatePerk(req.params.id, req.body);
    res.json(perk);
  }),

  deletePerk: asyncHandler(async (req, res) => {
    await benefitService.deletePerk(req.params.id);
    res.json({ message: 'Perk deleted successfully' });
  })
};

module.exports = benefitController;
