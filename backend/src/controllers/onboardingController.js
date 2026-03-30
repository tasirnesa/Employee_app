const onboardingService = require('../services/onboardingService');
const asyncHandler = require('../utils/asyncHandler');

const onboardingController = {
  completeWizard: asyncHandler(async (req, res) => {
    const result = await onboardingService.completeWizard(req.body, req.user.id);
    res.status(201).json(result);
  })
};

module.exports = onboardingController;
