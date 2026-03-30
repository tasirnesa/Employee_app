const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.get('/:goalId', goalController.getGoalProgressLogs);
router.post('/', goalController.recordKeyResultProgress);

module.exports = router;
