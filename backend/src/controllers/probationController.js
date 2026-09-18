const probationService = require('../services/probationService');
const asyncHandler = require('../utils/asyncHandler');

const probationController = {
  getProbationDetail: asyncHandler(async (req, res) => {
    const result = await probationService.getProbationByOnboardingId(req.params.onboardingId);
    if (!result) return res.status(404).json({ message: 'Probation record not found' });
    res.json(result);
  }),

  getAllProbations: asyncHandler(async (req, res) => {
    const result = await probationService.getAllProbations();
    res.json(result);
  }),

  updateProbation: asyncHandler(async (req, res) => {
    const result = await probationService.updateProbation(req.params.id, req.body);
    res.json(result);
  }),

  evaluate: asyncHandler(async (req, res) => {
    const { status, feedback, evaluation } = req.body;
    // persist evaluation text if provided
    const result = await probationService.evaluateProbation(req.params.id, status, feedback, evaluation);
    res.json(result);
  }),

  initProbation: asyncHandler(async (req, res) => {
    const { onboardingId } = req.body;
    if (!onboardingId) return res.status(400).json({ message: 'onboardingId is required' });

    // Check it doesn't already exist
    const existing = await probationService.getProbationByOnboardingId(onboardingId);
    if (existing) return res.status(409).json({ message: 'Probation period already exists for this onboarding' });

    // Default: 90-day probation from today
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const result = await probationService.createProbation(onboardingId, { startDate, endDate, status: 'Active' });
    res.status(201).json(result);
  }),
};

module.exports = probationController;
