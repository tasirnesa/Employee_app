const goalService = require('../services/goalService');
const asyncHandler = require('../utils/asyncHandler');

const goalController = {
  getGoals: asyncHandler(async (req, res) => {
    const goals = await goalService.getGoals(req.query.userId);
    res.json(goals);
  }),

  createGoal: asyncHandler(async (req, res) => {
    const created = await goalService.createGoal(req.body, req.user?.id);
    res.status(201).json(created);
  }),

  updateGoal: asyncHandler(async (req, res) => {
    const updated = await goalService.updateGoal(req.params.gid, req.body);
    res.json(updated);
  }),

  deleteGoal: asyncHandler(async (req, res) => {
    await goalService.deleteGoal(req.params.gid);
    res.status(204).end();
  }),

  updateProgress: asyncHandler(async (req, res) => {
    const updated = await goalService.updateGoal(req.params.gid, { progress: req.body.progress });
    res.json(updated);
  }),

  // --- Key Result Progress ---
  getGoalProgressLogs: asyncHandler(async (req, res) => {
    const result = await goalService.getGoalWithLogs(req.params.goalId);
    if (!result) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(result);
  }),

  recordKeyResultProgress: asyncHandler(async (req, res) => {
    const { goalId, keyIndex, progress } = req.body;
    const result = await goalService.recordKeyResultProgress(goalId, keyIndex, progress, req.user?.id);
    res.status(201).json(result);
  })
};

module.exports = goalController;
