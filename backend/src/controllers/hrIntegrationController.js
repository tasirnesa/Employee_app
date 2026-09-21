const asyncHandler = require('../utils/asyncHandler');
const hrIntegrationService = require('../services/hrIntegrationService');

const hrIntegrationController = {
  getConfig: asyncHandler(async (req, res) => {
    res.json(hrIntegrationService.loadConfig());
  }),

  getMeritProposals: asyncHandler(async (req, res) => {
    const isEmployee = req.user.role === 'Employee';
    const filters = {
      status: req.query.status,
      employeeId: isEmployee ? req.user.id : req.query.employeeId,
    };
    const proposals = await hrIntegrationService.getMeritProposals(filters);
    res.json(proposals);
  }),

  approveMeritProposal: asyncHandler(async (req, res) => {
    const result = await hrIntegrationService.approveMeritProposal(
      req.params.id,
      req.user.id,
      { applyToCompensation: req.body.applyToCompensation !== false }
    );
    res.json(result);
  }),

  rejectMeritProposal: asyncHandler(async (req, res) => {
    const result = await hrIntegrationService.rejectMeritProposal(
      req.params.id,
      req.user.id,
      req.body.reviewNotes || ''
    );
    res.json(result);
  }),

  getEmployeeSummary: asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const isEmployee = req.user.role === 'Employee';
    if (isEmployee && userId !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const summary = await hrIntegrationService.getEmployeeHrSummary(userId);
    res.json(summary);
  }),
};

module.exports = hrIntegrationController;
