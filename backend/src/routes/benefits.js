const express = require('express');
const router = express.Router();
const benefitController = require('../controllers/benefitController');

// --- Benefits ---
router.get('/benefits', benefitController.getBenefits);
router.get('/benefits/employee/:employeeId', benefitController.getEmployeeBenefits);
router.get('/benefits/type/:benefitType', benefitController.getBenefitsByType);
router.post('/benefits', benefitController.createBenefit);
router.put('/benefits/:id', benefitController.updateBenefit);
router.delete('/benefits/:id', benefitController.deleteBenefit);

// --- Perks ---
router.get('/perks', benefitController.getPerks);
router.get('/perks/employee/:employeeId', benefitController.getEmployeePerks);
router.get('/perks/type/:perkType', benefitController.getPerksByType);
router.post('/perks', benefitController.createPerk);
router.put('/perks/:id', benefitController.updatePerk);
router.delete('/perks/:id', benefitController.deletePerk);

module.exports = router;
