const recruitmentService = require('../services/recruitmentService');
const asyncHandler = require('../utils/asyncHandler');

const recruitmentController = {
  getCandidates: asyncHandler(async (req, res) => {
    const candidates = await recruitmentService.getCandidates(req.query);
    res.json(candidates);
  }),

  getCandidatesByStatus: asyncHandler(async (req, res) => {
    const candidates = await recruitmentService.getCandidates({ status: req.params.status });
    res.json(candidates);
  }),

  getCandidateById: asyncHandler(async (req, res) => {
    const candidate = await recruitmentService.getCandidateById(req.params.id);
    if (!candidate) {
      const error = new Error('Candidate not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(candidate);
  }),

  createCandidate: asyncHandler(async (req, res) => {
    const candidate = await recruitmentService.createCandidate(req.body);
    res.status(201).json(candidate);
  }),

  updateCandidate: asyncHandler(async (req, res) => {
    const candidate = await recruitmentService.updateCandidate(req.params.id, req.body);
    res.json(candidate);
  }),

  updateCandidateStatus: asyncHandler(async (req, res) => {
    const candidate = await recruitmentService.updateCandidateStatus(req.params.id, req.body);
    res.json(candidate);
  }),

  deleteCandidate: asyncHandler(async (req, res) => {
    await recruitmentService.deleteCandidate(req.params.id);
    res.json({ message: 'Candidate deleted successfully' });
  }),

  searchCandidates: asyncHandler(async (req, res) => {
    const candidates = await recruitmentService.getCandidates(req.query);
    res.json(candidates);
  })
};

module.exports = recruitmentController;
