const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.get('/', evaluationController.getEvaluations);
router.get('/my-summary', evaluationController.getMySummary);
router.get('/all-results', evaluationController.getAllResults);
router.get('/:evaluationId/details', evaluationController.getEvaluationDetails);
router.post('/', evaluationController.createEvaluation);

module.exports = router;
