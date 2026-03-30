const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.put('/:gid', goalController.updateGoal);
router.patch('/:gid/progress', goalController.updateProgress);
router.delete('/:gid', goalController.deleteGoal);

module.exports = router;
