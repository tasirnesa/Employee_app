const probationService = require('../services/probationService');
const asyncHandler = require('../utils/asyncHandler');

const probationController = {
  getProbationDetail: asyncHandler(async (req, res) => {
    const result = await probationService.getProbationByOnboardingId(req.params.onboardingId);
    if (!result) return res.status(404).json({ message: 'Probation record not found' });
    res.json(result);
  }),

  updateProbation: asyncHandler(async (req, res) => {
    const result = await probationService.updateProbation(req.params.id, req.body);
    res.json(result);
  }),

  evaluate: asyncHandler(async (req, res) => {
    const { status, feedback } = req.body;
    const result = await probationService.evaluateProbation(req.params.id, status, feedback);
    res.json(result);
  })
};

module.exports = probationController;
