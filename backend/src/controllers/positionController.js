const positionService = require('../services/positionService');
const asyncHandler = require('../utils/asyncHandler');

const positionController = {
  getPositions: asyncHandler(async (req, res) => {
    const positions = await positionService.getPositions();
    res.json(positions);
  }),

  getPositionById: asyncHandler(async (req, res) => {
    const position = await positionService.getPositions(req.params.id);
    if (!position) {
      const error = new Error('Position not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(position);
  }),

  createPosition: asyncHandler(async (req, res) => {
    const position = await positionService.createPosition(req.body);
    res.status(201).json(position);
  }),

  updatePosition: asyncHandler(async (req, res) => {
    const position = await positionService.updatePosition(req.params.id, req.body);
    res.json(position);
  }),

  deletePosition: asyncHandler(async (req, res) => {
    await positionService.deletePosition(req.params.id);
    res.json({ message: 'Position deleted successfully' });
  })
};

module.exports = positionController;
