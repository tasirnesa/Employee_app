const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.get('/', evaluationController.getEvaluations);
router.get('/:evaluationId/details', evaluationController.getEvaluationDetails);
router.get('/my-summary', evaluationController.getMySummary);
router.get('/all-results', evaluationController.getAllResults);
router.post('/', evaluationController.createEvaluation);

module.exports = router;
