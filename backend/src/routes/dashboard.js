const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/actions', dashboardController.getActions);

module.exports = router;
