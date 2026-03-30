const express = require('express');
const router = express.Router();
const criteriaController = require('../controllers/criteriaController');

router.get('/', criteriaController.getAllCriteria);
router.get('/:id', criteriaController.getCriteriaById);
router.post('/', criteriaController.createCriteria);
router.post('/bulk', criteriaController.bulkCreateCriteria);
router.put('/:id', criteriaController.updateCriteria);
router.delete('/:id', criteriaController.deleteCriteria);
router.post('/:id/authorize', criteriaController.authorizeCriteria);

module.exports = router;
