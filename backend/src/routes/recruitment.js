const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');

// Candidates
router.get('/candidates', recruitmentController.getCandidates);
router.get('/candidates/search', recruitmentController.searchCandidates);
router.get('/candidates/status/:status', recruitmentController.getCandidatesByStatus);
router.get('/candidates/:id', recruitmentController.getCandidateById);
router.post('/candidates', recruitmentController.createCandidate);
router.put('/candidates/:id', recruitmentController.updateCandidate);
router.patch('/candidates/:id/status', recruitmentController.updateCandidateStatus);
router.delete('/candidates/:id', recruitmentController.deleteCandidate);

module.exports = router;
