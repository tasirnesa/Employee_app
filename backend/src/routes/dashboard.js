const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/actions', dashboardController.getActions);
router.get('/stats', dashboardController.getStats);
router.get('/today-attendance', dashboardController.getTodayAttendance);
router.get('/people-events', dashboardController.getPeopleEvents);

module.exports = router;
