const evaluationService = require('../services/evaluationService');
const asyncHandler = require('../utils/asyncHandler');

const evaluationController = {
  getEvaluations: asyncHandler(async (req, res) => {
    const evaluations = await evaluationService.getAllEvaluations();
    res.json(evaluations);
  }),

  getEvaluationDetails: asyncHandler(async (req, res) => {
    const details = await evaluationService.getEvaluationDetails(req.params.evaluationId);
    res.json(details);
  }),

  getMySummary: asyncHandler(async (req, res) => {
    const summary = await evaluationService.getUserSummary(req.user.id);
    res.json(summary);
  }),

  createEvaluation: asyncHandler(async (req, res) => {
    const created = await evaluationService.createEvaluation(req.body, req.user?.id);
    res.status(201).json(created);
  }),

  getAllResults: asyncHandler(async (req, res) => {
    const results = await evaluationService.getAllResults(req.user);
    res.json(results);
  }),

  getSessions: asyncHandler(async (req, res) => {
    const sessions = await evaluationService.getSessions();
    res.json(sessions);
  })
};

module.exports = evaluationController;
