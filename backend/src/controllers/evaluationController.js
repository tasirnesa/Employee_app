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

  createSession: asyncHandler(async (req, res) => {
    const { title, startDate, endDate, department } = req.body;
    
    if (!title || !startDate || !endDate) {
      const err = new Error('Title, Start Date, and End Date are required');
      err.statusCode = 400;
      throw err;
    }

    // Default to 'off' status, will be manually turned 'on' in Activate panel
    const sessionType = 'off'; 

    const session = await prisma.evaluationSession.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        department: department || null,
        type: sessionType,
        activatedBy: req.user?.id || 1, // Fallback to sys admin if token id acts up
      }
    });

    res.status(201).json(session);
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
        type: status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    });

    res.json(updated);
  }),

  // ── Session Criteria management ────────────────────────────────────────

  getSessionCriteria: asyncHandler(async (req, res) => {
    const sessionId = parseInt(req.params.id);
    const rows = await prisma.sessionCriteria.findMany({
      where: { sessionID: sessionId },
      include: { criteria: true },
      orderBy: { id: 'asc' },
    });
    res.json(rows);
  }),

  assignCriteriaToSession: asyncHandler(async (req, res) => {
    const sessionId = parseInt(req.params.id);
    // body: { criteriaIds: number[], isRequired?: boolean, weight?: number }
    // OR single: { criteriaId: number, isRequired?: boolean, weight?: number }
    const { criteriaIds, criteriaId, isRequired = true, weight = 1.0 } = req.body;

    const ids = criteriaIds || (criteriaId ? [criteriaId] : []);
    if (!ids.length) {
      return res.status(400).json({ error: 'criteriaIds array or criteriaId is required' });
    }

    // Verify session exists
    const session = await prisma.evaluationSession.findUnique({ where: { sessionID: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Only allow authorized criteria
    const validCriteria = await prisma.evaluationCriteria.findMany({
      where: { criteriaID: { in: ids.map(Number) }, isAuthorized: true },
      select: { criteriaID: true },
    });
    const validIds = validCriteria.map(c => c.criteriaID);
    const skipped = ids.map(Number).filter(id => !validIds.includes(id));

    const created = await Promise.allSettled(
      validIds.map(cId =>
        prisma.sessionCriteria.upsert({
          where:  { sessionID_criteriaID: { sessionID: sessionId, criteriaID: cId } },
          update: { isRequired, weight },
          create: { sessionID: sessionId, criteriaID: cId, isRequired, weight },
        })
      )
    );

    res.json({
      assigned: validIds.length,
      skipped: skipped.length,
      skippedIds: skipped,
      message: skipped.length
        ? `${validIds.length} criteria assigned. ${skipped.length} skipped (not authorized).`
        : `${validIds.length} criteria assigned.`,
    });
  }),

  removeCriteriaFromSession: asyncHandler(async (req, res) => {
    const sessionId  = parseInt(req.params.id);
    const criteriaId = parseInt(req.params.criteriaId);

    await prisma.sessionCriteria.deleteMany({
      where: { sessionID: sessionId, criteriaID: criteriaId },
    });
    res.json({ message: 'Criteria removed from session' });
  }),
};

module.exports = evaluationController;
