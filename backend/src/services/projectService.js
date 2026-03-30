const projectRepository = require('../repositories/projectRepository');
const userRepository = require('../repositories/userRepository');

const projectService = {
  // --- Project logic ---
  getProjects: async (id = null) => {
    if (id) return await projectRepository.findProjectById(id);
    return await projectRepository.findAllProjects();
  },

  createProject: async (data) => {
    const { name, startDate, managerId } = data;
    if (!name || !startDate || !managerId) throw new Error('Missing required fields');

    const manager = await userRepository.findById(managerId);
    if (!manager) throw new Error('Manager not found');

    return await projectRepository.createProject({
      ...data,
      startDate: new Date(startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      managerId: parseInt(managerId),
      status: data.status || 'Active'
    });
  },

  updateProject: async (id, data) => {
    const updateData = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.managerId) updateData.managerId = parseInt(data.managerId);

    return await projectRepository.updateProject(id, updateData);
  },

  deleteProject: async (id) => {
    return await projectRepository.deleteProject(id);
  },

  // --- Timesheet logic ---
  getTimesheets: async (filters = {}) => {
    const where = {};
    if (filters.employeeId) where.employeeId = parseInt(filters.employeeId);
    if (filters.projectId) where.projectId = parseInt(filters.projectId);
    
    if (filters.id) return await projectRepository.findTimesheetById(filters.id);
    return await projectRepository.findAllTimesheets(where);
  },

  createTimesheet: async (data) => {
    const { employeeId, taskDescription, date, startTime, endTime } = data;
    if (!employeeId || !taskDescription || !date || !startTime || !endTime) {
      throw new Error('Missing required fields');
    }

    const employee = await userRepository.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const hoursWorked = projectService._calculateHours(startTime, endTime);

    return await projectRepository.createTimesheet({
      ...data,
      employeeId: parseInt(employeeId),
      projectId: data.projectId ? parseInt(data.projectId) : null,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      hoursWorked,
      overtimeHours: parseFloat(data.overtimeHours) || 0,
      status: 'Pending'
    });
  },

  updateTimesheet: async (id, data) => {
    const updateData = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    
    if (updateData.startTime && updateData.endTime) {
      updateData.hoursWorked = projectService._calculateHours(updateData.startTime, updateData.endTime);
    }

    if (data.projectId !== undefined) updateData.projectId = data.projectId ? parseInt(data.projectId) : null;
    if (data.overtimeHours !== undefined) updateData.overtimeHours = parseFloat(data.overtimeHours);

    return await projectRepository.updateTimesheet(id, updateData);
  },

  approveTimesheet: async (id, approvedById) => {
    return await projectRepository.updateTimesheet(id, {
      status: 'Approved',
      approvedBy: parseInt(approvedById),
      approvedAt: new Date()
    });
  },

  rejectTimesheet: async (id, notes) => {
    return await projectRepository.updateTimesheet(id, {
      status: 'Rejected',
      notes: notes || 'Rejected by manager'
    });
  },

  deleteTimesheet: async (id) => {
    return await projectRepository.deleteTimesheet(id);
  },

  // --- Internal Helpers ---
  _calculateHours: (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return (e - s) / (1000 * 60 * 60);
  }
};

module.exports = projectService;
