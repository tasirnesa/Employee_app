const assetService = require('../services/assetService');
const asyncHandler = require('../utils/asyncHandler');

const assetController = {
  assignAsset: asyncHandler(async (req, res) => {
    const result = await assetService.assignAsset(req.params.employeeId, req.body);
    res.status(201).json(result);
  }),

  getEmployeeAssets: asyncHandler(async (req, res) => {
    const result = await assetService.getEmployeeAssets(req.params.employeeId);
    res.json(result);
  }),

  updateAsset: asyncHandler(async (req, res) => {
    const result = await assetService.updateAssetStatus(req.params.id, req.body);
    res.json(result);
  }),

  deleteAsset: asyncHandler(async (req, res) => {
    await assetService.deleteAsset(req.params.id);
    res.status(204).send();
  })
};

module.exports = assetController;
