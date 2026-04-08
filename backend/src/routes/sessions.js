const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.get('/', evaluationController.getSessions);
router.get('/stats', evaluationController.getSessionStats);
router.put('/:id/status', evaluationController.updateSessionStatus);

module.exports = router;
