const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const onboardingController = require('../controllers/onboardingController');
const { authenticateToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

// Configure multer storage
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `onboard-doc-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// Hiring Wizard
router.post('/wizard', authenticateToken, authorize(PERMISSIONS.EMPLOYEE_CREATE), onboardingController.completeWizard);

// Onboarding Dashboard/Detail
router.get('/:employeeId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_VIEW), onboardingController.getOnboarding);
router.patch('/:id', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.updateOnboarding);

// Tasks
router.post('/:id/tasks', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.createTask);
router.patch('/tasks/:taskId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.updateTask);
router.delete('/tasks/:taskId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.deleteTask);

// Documents
// POST with optional file
router.post('/:id/documents', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), upload.single('file'), onboardingController.createDocument);
// PATCH to upload file for an existing record
router.patch('/documents/:docId/upload', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), upload.single('file'), onboardingController.uploadDocumentFile);
// PATCH to verify
router.patch('/documents/:docId/verify', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.verifyDocument);
router.delete('/documents/:docId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.deleteDocument);

// Trainings
router.post('/:id/trainings', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.assignTraining);
router.patch('/trainings/:trainingId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.updateTrainingStatus);
router.delete('/trainings/:trainingId', authenticateToken, authorize(PERMISSIONS.ONBOARDING_MANAGE), onboardingController.deleteTraining);

module.exports = router;
