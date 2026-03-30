const prisma = require('../config/prisma');

const projectRepository = {
  // --- Projects ---
  findAllProjects: async () => {
    return await prisma.project.findMany({
      include: {
        manager: { select: { id: true, fullName: true, userName: true } },
        timesheets: { select: { id: true, hoursWorked: true, date: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findProjectById: async (id) => {
    return await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        manager: { select: { id: true, fullName: true, userName: true } },
        timesheets: {
          include: { employee: { select: { id: true, fullName: true, userName: true } } },
          orderBy: { date: 'desc' }
        }
      }
    });
  },

  createProject: async (data) => {
    return await prisma.project.create({
      data,
      include: { manager: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  updateProject: async (id, data) => {
    return await prisma.project.update({
      where: { id: parseInt(id) },
      data,
      include: { manager: { select: { id: true, fullName: true, userName: true } } }
    });
  },

  deleteProject: async (id) => {
    return await prisma.project.delete({ where: { id: parseInt(id) } });
  },

  // --- Timesheets ---
  findAllTimesheets: async (where = {}) => {
    return await prisma.timesheet.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        project: { select: { id: true, name: true } },
        approver: { select: { id: true, fullName: true } }
      },
      orderBy: { date: 'desc' }
    });
  },

  findTimesheetById: async (id) => {
    return await prisma.timesheet.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        project: { select: { id: true, name: true } },
        approver: { select: { id: true, fullName: true } }
      }
    });
  },

  createTimesheet: async (data) => {
    return await prisma.timesheet.create({
      data,
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        project: { select: { id: true, name: true } }
      }
    });
  },

  updateTimesheet: async (id, data) => {
    return await prisma.timesheet.update({
      where: { id: parseInt(id) },
      data,
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        project: { select: { id: true, name: true } },
        approver: { select: { id: true, fullName: true } }
      }
    });
  },

  deleteTimesheet: async (id) => {
    return await prisma.timesheet.delete({ where: { id: parseInt(id) } });
  }
};

module.exports = projectRepository;
