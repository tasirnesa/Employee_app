const onboardingService = require('../services/onboardingService');
const asyncHandler = require('../utils/asyncHandler');

const onboardingController = {
  completeWizard: asyncHandler(async (req, res) => {
    const result = await onboardingService.completeWizard(req.body, req.user.id);
    res.status(201).json(result);
  }),

  getOnboarding: asyncHandler(async (req, res) => {
    const result = await onboardingService.getOnboardingByEmployeeId(req.params.employeeId);
    if (!result) return res.status(404).json({ message: 'Onboarding record not found' });
    res.json(result);
  }),

  updateOnboarding: asyncHandler(async (req, res) => {
    const result = await onboardingService.updateOnboarding(req.params.id, req.body);
    res.json(result);
  }),

  // Task Management
  createTask: asyncHandler(async (req, res) => {
    const result = await onboardingService.createTask(req.params.id, req.body);
    res.status(201).json(result);
  }),

  updateTask: asyncHandler(async (req, res) => {
    const result = await onboardingService.updateTask(req.params.taskId, req.body);
    res.json(result);
  }),

  deleteTask: asyncHandler(async (req, res) => {
    await onboardingService.deleteTask(req.params.taskId);
    res.status(204).send();
  }),

  // Document Management
  createDocument: asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    let fileUrl = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const result = await onboardingService.createDocument(req.params.id, {
      title,
      description,
      fileUrl,
      status: fileUrl ? 'Uploaded' : 'Pending',
      uploadedAt: fileUrl ? new Date() : null
    });
    res.status(201).json(result);
  }),

  uploadDocumentFile: asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await onboardingService.updateDocument(req.params.docId, {
      fileUrl,
      status: 'Uploaded',
      uploadedAt: new Date()
    });
    res.json(result);
  }),

  verifyDocument: asyncHandler(async (req, res) => {
    const result = await onboardingService.updateDocument(req.params.docId, {
      status: req.body.status || 'Verified', // Verified or Rejected
      verifiedAt: new Date(),
      verifiedBy: req.user.id
    });
    res.json(result);
  }),

  deleteDocument: asyncHandler(async (req, res) => {
    await onboardingService.deleteDocument(req.params.docId);
    res.status(204).send();
  }),

  // Training Management
  assignTraining: asyncHandler(async (req, res) => {
    const result = await onboardingService.assignTraining(req.params.id, req.body);
    res.status(201).json(result);
  }),

  updateTrainingStatus: asyncHandler(async (req, res) => {
    const result = await onboardingService.updateTrainingStatus(req.params.trainingId, req.body);
    res.json(result);
  }),

  deleteTraining: asyncHandler(async (req, res) => {
    await onboardingService.deleteTraining(req.params.trainingId);
    res.status(204).send();
  })
};

module.exports = onboardingController;
