const verificationService = require('../services/verificationService');
const asyncHandler = require('../utils/asyncHandler');

const verificationController = {
  getVerifications: asyncHandler(async (req, res) => {
    const result = await verificationService.getVerifications(req.params.onboardingId);
    res.json(result);
  }),

  createVerification: asyncHandler(async (req, res) => {
    const result = await verificationService.createVerification(req.params.onboardingId, req.body);
    res.status(201).json(result);
  }),

  updateVerification: asyncHandler(async (req, res) => {
    const result = await verificationService.updateVerification(req.params.id, {
      ...req.body,
      verifiedBy: req.user.id
    });
    res.json(result);
  }),

  deleteVerification: asyncHandler(async (req, res) => {
    await verificationService.deleteVerification(req.params.id);
    res.status(204).send();
  }),

  initializeDefaults: asyncHandler(async (req, res) => {
    await verificationService.initializeDefaults(req.params.onboardingId);
    res.status(201).json({ message: 'Default verifications initialized' });
  })
};

module.exports = verificationController;
