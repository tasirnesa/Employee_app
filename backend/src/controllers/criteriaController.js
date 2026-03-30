const criteriaService = require('../services/criteriaService');
const asyncHandler = require('../utils/asyncHandler');

const criteriaController = {
  getAllCriteria: asyncHandler(async (req, res) => {
    const criteria = await criteriaService.getCriteria();
    res.json(criteria);
  }),

  getCriteriaById: asyncHandler(async (req, res) => {
    const criteria = await criteriaService.getCriteria(req.params.id);
    if (!criteria) {
      const error = new Error('Criteria not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(criteria);
  }),

  createCriteria: asyncHandler(async (req, res) => {
    const created = await criteriaService.createCriteria(req.body, req.user?.id);
    res.status(201).json(created);
  }),

  bulkCreateCriteria: asyncHandler(async (req, res) => {
    const result = await criteriaService.bulkCreateCriteria(req.body, req.user?.id);
    res.status(201).json({ count: result.count });
  }),

  updateCriteria: asyncHandler(async (req, res) => {
    const updated = await criteriaService.updateCriteria(req.params.id, req.body);
    res.json(updated);
  }),

  deleteCriteria: asyncHandler(async (req, res) => {
    await criteriaService.deleteCriteria(req.params.id);
    res.json({ message: 'Criteria deleted successfully' });
  }),

  authorizeCriteria: asyncHandler(async (req, res) => {
    const updated = await criteriaService.authorizeCriteria(req.params.id, req.user?.id, req.user?.role);
    res.json({ message: 'Criteria authorized successfully', criteria: updated });
  })
};

module.exports = criteriaController;
