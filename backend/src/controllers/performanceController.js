const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const hrIntegrationService = require('../services/hrIntegrationService');

const performanceController = {
  getPerformance: asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const requestingRole = req.user?.role;
    const requestingId   = req.user?.id;

    let where = {};
    if (requestingRole === 'Employee') {
      where = { userId: requestingId };
    } else if (userId) {
      where = { userId: parseInt(userId) };
    }

    const performance = await prisma.performance.findMany({
      where,
      include: {
        user:     { select: { id: true, fullName: true, userName: true } },
        evaluator:{ select: { id: true, fullName: true, userName: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(performance);
  }),

  createPerformance: asyncHandler(async (req, res) => {
    const data = req.body;
    const performance = await prisma.performance.create({
      data: {
        ...data,
        date: new Date(data.date),
      }
    });

    if (performance.overallRating) {
      await hrIntegrationService.syncBenefitsPerksEligibility(
        performance.userId,
        performance.overallRating
      );
    }

    res.status(201).json(performance);
  }),

  recalculateUserPerformance: asyncHandler(async (req, res) => {
    const { userId, sessionId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const performance = await hrIntegrationService.recalculatePerformance(
      parseInt(userId),
      req.user.id,
      { sessionId: sessionId ? parseInt(sessionId) : undefined }
    );

    res.json(performance);
  }),

  recalculateAllPerformance: asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { activeStatus: 'true' },
          { activeStatus: 'Active' },
          { activeStatus: 'active' },
        ],
      },
      select: { id: true },
    });

    const results = [];
    for (const user of users) {
      try {
        await hrIntegrationService.recalculatePerformance(user.id, req.user.id);
        results.push({ userId: user.id, status: 'ok' });
      } catch (err) {
        results.push({ userId: user.id, status: 'error', message: err.message });
      }
    }

    res.json({
      message: `Recalculation complete for ${users.length} users`,
      results,
      succeeded: results.filter(r => r.status === 'ok').length,
      failed: results.filter(r => r.status === 'error').length,
    });
  })
};

module.exports = performanceController;
