const evaluationService = require('../services/evaluationService');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');

const evaluationController = {
  getEvaluations: asyncHandler(async (req, res) => {
    const evaluations = await evaluationService.getAllEvaluations();
    res.json(evaluations);
  }),

  getEvaluationDetails: asyncHandler(async (req, res) => {
    const details = await evaluationService.getEvaluationDetails(req.params.evaluationId);
    res.json(details);
  }),

  getMySummary: asyncHandler(async (req, res) => {
    const summary = await evaluationService.getUserSummary(req.user.id);
    res.json(summary);
  }),

  createEvaluation: asyncHandler(async (req, res) => {
    const created = await evaluationService.createEvaluation(req.body, req.user?.id);
    res.status(201).json(created);
  }),

  getAllResults: asyncHandler(async (req, res) => {
    const results = await evaluationService.getAllResults(req.user);
    res.json(results);
  }),

  getSessions: asyncHandler(async (req, res) => {
    const sessions = await evaluationService.getSessions();
    res.json(sessions);
  }),

  getSessionStats: asyncHandler(async (req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate week range (Monday start)
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diffToMonday = (day + 6) % 7;
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [todayCount, weekCount, pendingCount, meetingsCount] = await Promise.all([
      prisma.evaluationSession.count({
        where: {
          startDate: { lte: now },
          endDate: { gte: today }
        }
      }),
      prisma.evaluationSession.count({
        where: {
          OR: [
            { startDate: { gte: weekStart, lt: weekEnd } },
            { endDate: { gte: weekStart, lt: weekEnd } }
          ]
        }
      }),
      prisma.evaluationSession.count({
        where: {
          endDate: { gt: now }
        }
      }),
      prisma.evaluationSession.count({
        where: {
          title: { contains: 'meeting', mode: 'insensitive' }
        }
      })
    ]);

    res.json({
      today: todayCount,
      thisWeek: weekCount,
      pending: pendingCount,
      meetings: meetingsCount
    });
  }),

  updateSessionStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, startDate, endDate } = req.body;

    const updated = await prisma.evaluationSession.update({
      where: { sessionID: parseInt(id) },
      data: {
        type: status, // Using 'type' as status per current convention ('on'/'off')
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    });

    res.json(updated);
  })
};

module.exports = evaluationController;
