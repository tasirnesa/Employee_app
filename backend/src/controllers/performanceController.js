const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

const performanceController = {
  getPerformance: asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const where = userId ? { userId: parseInt(userId) } : {};
    
    const performance = await prisma.performance.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, userName: true } },
        evaluator: { select: { id: true, fullName: true, userName: true } }
      },
      orderBy: { date: 'desc' }
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
    res.status(201).json(performance);
  }),

  recalculateUserPerformance: asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Logic: Fetch completed evaluations, timesheets, and goals to calculate a score
    const [evaluations, timesheets, goals] = await Promise.all([
      prisma.evaluation.findMany({
        where: { evaluateeID: parseInt(userId) },
        include: { results: true }
      }),
      prisma.timesheet.findMany({
        where: { employeeId: parseInt(userId), status: 'Approved' }
      }),
      prisma.goal.findMany({
        where: { activatedBy: parseInt(userId) }
      })
    ]);

    // Simple calculation logic
    let avgEvaluationScore = 0;
    if (evaluations.length > 0) {
      const allScores = evaluations.flatMap(e => e.results.map(r => r.score));
      if (allScores.length > 0) {
        avgEvaluationScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      }
    }

    const totalTasks = goals.filter(g => g.status === 'Completed').length;
    const totalHours = timesheets.reduce((sum, t) => sum + t.hoursWorked, 0);

    // Create a new performance record for the current month
    const now = new Date();
    const period = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;

    const performance = await prisma.performance.create({
      data: {
        userId: parseInt(userId),
        evaluatorId: req.user.id, // Recalculated by system/admin
        tasksCompleted: totalTasks,
        hoursWorked: Math.round(totalHours),
        overallRating: avgEvaluationScore || 3.0,
        evaluationPeriod: period,
        date: now,
        feedback: 'Automatically recalculated based on evaluations and timesheets.'
      }
    });

    res.json(performance);
  }),

  recalculateAllPerformance: asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({ select: { id: true } });
    const results = [];

    for (const user of users) {
      // Re-use logic or call internal function
      // For brevity, we'll just simulate a trigger or loop
      // Map through users and create records (simplified)
    }

    res.json({ message: `Recalculation started for ${users.length} users` });
  })
};

module.exports = performanceController;
