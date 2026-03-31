const offboardingService = require('../services/offboardingService');
const asyncHandler = require('../utils/asyncHandler');

const offboardingController = {
  getOffboardings: asyncHandler(async (req, res) => {
    const list = await offboardingService.getOffboardingList(req.query);
    res.json(list);
  }),

  getOffboarding: asyncHandler(async (req, res) => {
    const details = await offboardingService.getOffboardingDetails(req.params.id);
    res.json(details);
  }),

  initiate: asyncHandler(async (req, res) => {
    const record = await offboardingService.initiateOffboarding(req.body);
    res.status(201).json(record);
  }),

  update: asyncHandler(async (req, res) => {
    const updated = await offboardingService.updateOffboarding(req.params.id, req.body);
    res.json(updated);
  }),

  completeTask: asyncHandler(async (req, res) => {
    const task = await offboardingService.completeTask(req.params.taskId, req.user.id);
    res.json(task);
  }),

  finalize: asyncHandler(async (req, res) => {
    const result = await offboardingService.finalizeOffboarding(req.params.id);
    res.json(result);
  })
};

module.exports = offboardingController;
