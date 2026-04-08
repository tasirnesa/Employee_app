const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

const dashboardController = {
  getActions: asyncHandler(async (req, res) => {
    const userId = parseInt(req.user.id);
    const userRole = req.user.role;

    const results = {
      pendingLeaves: [],
      activeSessions: [],
      pendingGoals: [],
      unreadCount: 0
    };

    // 1. Pending Leaves
    try {
      if (userRole === 'Admin' || userRole === 'Manager') {
        const leaves = await prisma.leave.findMany({
          where: { status: 'Pending' },
          include: { employee: { select: { fullName: true } }, leaveType: true },
          take: 5,
          orderBy: { appliedDate: 'desc' }
        });
        results.pendingLeaves = leaves.map(l => ({
          id: l.id,
          type: 'LEAVE',
          title: `Leave Request: ${l.employee ? l.employee.fullName : 'Employee'}`,
          subtitle: `${l.leaveType ? l.leaveType.name : 'Unknown'} (${l.days} days)`,
          link: '/leaves'
        }));
      } else {
        const leaves = await prisma.leave.findMany({
          where: { employeeId: userId, status: 'Pending' },
          include: { leaveType: true },
          take: 3,
          orderBy: { appliedDate: 'desc' }
        });
        results.pendingLeaves = leaves.map(l => ({
          id: l.id,
          type: 'LEAVE',
          title: 'Your Leave Request',
          subtitle: `Status: Pending - ${l.leaveType ? l.leaveType.name : 'Unknown'}`,
          link: '/leaves'
        }));
      }
    } catch (error) {
      console.error('[Dashboard API] Error fetching leaves:', error.message);
    }

    // 2. Active Evaluation Sessions
    try {
      const sessions = await prisma.evaluationSession.findMany({
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        take: 3,
        orderBy: { endDate: 'asc' }
      });
      results.activeSessions = sessions.map(s => ({
        id: s.sessionID,
        type: 'EVALUATION',
        title: s.title,
        subtitle: `Ends ${new Date(s.endDate).toLocaleDateString()}`,
        link: '/evaluations'
      }));
    } catch (error) {
      console.error('[Dashboard API] Error fetching sessions:', error.message);
    }

    // 3. Pending Goals
    try {
      const goals = await prisma.goal.findMany({
        where: { activatedBy: userId, status: { not: 'Completed' } },
        take: 3,
        orderBy: { duedate: 'asc' }
      });
      results.pendingGoals = goals.map(g => ({
        id: g.gid,
        type: 'GOAL',
        title: g.objective,
        subtitle: `Progress: ${g.progress || 0}%`,
        link: '/goals'
      }));
    } catch (error) {
      console.error('[Dashboard API] Error fetching goals:', error.message);
    }

    // 4. Unread Notifications
    try {
      results.unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });
    } catch (error) {
      console.error('[Dashboard API] Error fetching notifications:', error.message);
    }

    res.json(results);
  })
};

module.exports = dashboardController;
