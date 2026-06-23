const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

const ACTIVE_USER_FILTER = {
  OR: [
    { activeStatus: 'true' },
    { activeStatus: 'active' },
    { activeStatus: 'Active' },
  ],
};

const isAdminRole = (role) => role === 'Admin' || role === 'SuperAdmin';
const isManagerRole = (role) => role === 'Manager';

const activeSessionWhere = {
  startDate: { lte: new Date() },
  endDate: { gte: new Date() },
};

const dashboardController = {
  getActions: asyncHandler(async (req, res) => {
    const userId = parseInt(req.user.id);
    const userRole = req.user.role;

    const results = {
      pendingLeaves: [],
      activeSessions: [],
      pendingGoals: [],
      unreadCount: 0,
    };

    // 1. Pending Leaves
    try {
      if (isAdminRole(userRole)) {
        const leaves = await prisma.leave.findMany({
          where: { status: 'Pending' },
          include: { employee: { select: { fullName: true } }, leaveType: true },
          take: 5,
          orderBy: { appliedDate: 'desc' },
        });
        results.pendingLeaves = leaves.map((l) => ({
          id: l.id,
          type: 'LEAVE',
          title: `Leave Request: ${l.employee ? l.employee.fullName : 'Employee'}`,
          subtitle: `${l.leaveType ? l.leaveType.name : 'Unknown'} (${l.days} days)`,
          link: '/leave-management',
        }));
      } else if (isManagerRole(userRole)) {
        const teamMembers = await prisma.user.findMany({
          where: { managerId: userId },
          select: { id: true },
        });
        const teamIds = teamMembers.map((m) => m.id);
        const leaves = await prisma.leave.findMany({
          where: { status: 'Pending', employeeId: { in: teamIds.length ? teamIds : [-1] } },
          include: { employee: { select: { fullName: true } }, leaveType: true },
          take: 5,
          orderBy: { appliedDate: 'desc' },
        });
        results.pendingLeaves = leaves.map((l) => ({
          id: l.id,
          type: 'LEAVE',
          title: `Leave Request: ${l.employee ? l.employee.fullName : 'Employee'}`,
          subtitle: `${l.leaveType ? l.leaveType.name : 'Unknown'} (${l.days} days)`,
          link: '/leave-management',
        }));
      } else {
        const leaves = await prisma.leave.findMany({
          where: { employeeId: userId, status: 'Pending' },
          include: { leaveType: true },
          take: 3,
          orderBy: { appliedDate: 'desc' },
        });
        results.pendingLeaves = leaves.map((l) => ({
          id: l.id,
          type: 'LEAVE',
          title: 'Your Leave Request',
          subtitle: `Status: Pending - ${l.leaveType ? l.leaveType.name : 'Unknown'}`,
          link: '/leave-management',
        }));
      }
    } catch (error) {
      console.error('[Dashboard API] Error fetching leaves:', error.message);
    }

    // 2. Active Evaluation Sessions
    try {
      const sessions = await prisma.evaluationSession.findMany({
        where: activeSessionWhere,
        take: 3,
        orderBy: { endDate: 'asc' },
      });
      results.activeSessions = sessions.map((s) => ({
        id: s.sessionID,
        type: 'EVALUATION',
        title: s.title,
        subtitle: `Ends ${new Date(s.endDate).toLocaleDateString()}`,
        link: '/evaluations/view',
      }));
    } catch (error) {
      console.error('[Dashboard API] Error fetching sessions:', error.message);
    }

    // 3. Pending Goals
    try {
      const goals = await prisma.goal.findMany({
        where: { activatedBy: userId, status: { not: 'Completed' } },
        take: 5,
        orderBy: { duedate: 'asc' },
      });
      results.pendingGoals = goals.map((g) => ({
        id: g.gid,
        type: 'GOAL',
        title: g.objective,
        subtitle: `Progress: ${g.progress || 0}%`,
        link: '/goals',
      }));
    } catch (error) {
      console.error('[Dashboard API] Error fetching goals:', error.message);
    }

    // 4. Unread Notifications
    try {
      results.unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      console.error('[Dashboard API] Error fetching notifications:', error.message);
    }

    res.json(results);
  }),

  getStats: asyncHandler(async (req, res) => {
    const userId = parseInt(req.user.id);
    const userRole = req.user.role;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const stats = {
      role: userRole,
      activeEvaluations: 0,
      pendingLeaves: 0,
      attendanceRate: 0,
      evaluationCompletionRate: 0,
      openCandidates: 0,
      headcountGrowthPercent: 0,
      headcountByDepartment: [],
      newHiresThisMonth: 0,
      unreadNotifications: 0,
    };

    try {
      stats.activeEvaluations = await prisma.evaluationSession.count({ where: activeSessionWhere });

      // Attendance rate (current month)
      const monthAttendance = await prisma.attendance.findMany({
        where: { date: { gte: startOfMonth } },
        select: { status: true },
      });
      if (monthAttendance.length) {
        const present = monthAttendance.filter((a) =>
          ['Present', 'present', 'On Time', 'Late'].includes(a.status)
        ).length;
        stats.attendanceRate = Math.round((present / monthAttendance.length) * 100);
      }

      // Evaluation completion rate for active sessions
      const activeSessions = await prisma.evaluationSession.findMany({
        where: activeSessionWhere,
        select: { sessionID: true },
      });
      const sessionIds = activeSessions.map((s) => s.sessionID);
      if (sessionIds.length) {
        const totalEvals = await prisma.evaluation.count({
          where: { sessionID: { in: sessionIds } },
        });
        const completedEvals = await prisma.evaluation.count({
          where: {
            sessionID: { in: sessionIds },
            results: { some: {} },
          },
        });
        stats.evaluationCompletionRate = totalEvals
          ? Math.round((completedEvals / totalEvals) * 100)
          : 0;
      }

      // Open recruitment pipeline
      stats.openCandidates = await prisma.candidate.count({
        where: { status: { notIn: ['Hired', 'Rejected'] } },
      });

      // Headcount growth (last 30 days vs prior 30 days)
      const recentHires = await prisma.user.count({
        where: { ...ACTIVE_USER_FILTER, createdDate: { gte: thirtyDaysAgo } },
      });
      const priorHires = await prisma.user.count({
        where: {
          ...ACTIVE_USER_FILTER,
          createdDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      });
      stats.newHiresThisMonth = await prisma.user.count({
        where: { ...ACTIVE_USER_FILTER, createdDate: { gte: startOfMonth } },
      });
      stats.headcountGrowthPercent = priorHires
        ? Math.round(((recentHires - priorHires) / priorHires) * 100)
        : recentHires > 0
          ? 100
          : 0;

      // Department breakdown
      const departments = await prisma.department.findMany({
        select: {
          name: true,
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
      });
      stats.headcountByDepartment = departments
        .map((d) => ({ name: d.name, count: d._count.users }))
        .filter((d) => d.count > 0);

      stats.unreadNotifications = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      if (isAdminRole(userRole)) {
        stats.totalEmployees = await prisma.user.count({ where: ACTIVE_USER_FILTER });
        stats.pendingLeaves = await prisma.leave.count({ where: { status: 'Pending' } });

        const compensations = await prisma.compensation.findMany({
          where: { status: 'Active' },
          select: { basicSalary: true, allowances: true },
        });
        const totalAmount = compensations.reduce(
          (sum, c) => sum + Number(c.basicSalary) + Number(c.allowances),
          0
        );
        stats.monthlyPayroll = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(totalAmount);
      } else if (isManagerRole(userRole)) {
        stats.teamSize = await prisma.user.count({
          where: { managerId: userId, ...ACTIVE_USER_FILTER },
        });
        const teamMembers = await prisma.user.findMany({
          where: { managerId: userId },
          select: { id: true },
        });
        const teamIds = teamMembers.map((m) => m.id);
        stats.pendingLeaves = await prisma.leave.count({
          where: {
            status: 'Pending',
            employeeId: { in: teamIds.length ? teamIds : [-1] },
          },
        });
      } else {
        const myGoals = await prisma.goal.findMany({
          where: { activatedBy: userId, status: { not: 'Completed' } },
          select: { progress: true },
        });
        stats.myGoalsCount = myGoals.length;
        stats.myGoalsAvgProgress = myGoals.length
          ? Math.round(myGoals.reduce((s, g) => s + (g.progress || 0), 0) / myGoals.length)
          : 0;
        stats.myPendingLeaves = await prisma.leave.count({
          where: { employeeId: userId, status: 'Pending' },
        });
        stats.pendingLeaves = stats.myPendingLeaves;
      }
    } catch (error) {
      console.error('[Dashboard API] Error fetching stats:', error.message);
    }

    res.json(stats);
  }),
};

module.exports = dashboardController;
