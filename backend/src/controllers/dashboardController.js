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
          link: '/leave-management'
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
          link: '/leave-management'
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
        link: '/evaluations/view'
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
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = {
      totalEmployees: 0,
      activeEvaluations: 0,
      pendingLeaves: 0,
      monthlyPayroll: '$0.00'
    };

    try {
      // 1. Total Employees (Active)
      stats.totalEmployees = await prisma.user.count({
        where: { activeStatus: 'active' }
      });

      // 2. Active Evaluation Sessions
      stats.activeEvaluations = await prisma.evaluationSession.count({
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      // 3. Pending Leaves
      stats.pendingLeaves = await prisma.leave.count({
        where: { status: 'Pending' }
      });

      // 4. Monthly Payroll (Sum of active compensations)
      const compensations = await prisma.compensation.findMany({
        where: { status: 'Active' },
        select: { basicSalary: true, allowances: true }
      });

      const totalAmount = compensations.reduce((sum, c) => {
        return sum + Number(c.basicSalary) + Number(c.allowances);
      }, 0);

      stats.monthlyPayroll = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(totalAmount);

    } catch (error) {
      console.error('[Dashboard API] Error fetching stats:', error.message);
    }

    res.json(stats);
  })
};

module.exports = dashboardController;
