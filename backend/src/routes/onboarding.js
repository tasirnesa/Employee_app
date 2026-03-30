const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');

router.post('/wizard', onboardingController.completeWizard);

module.exports = router;
