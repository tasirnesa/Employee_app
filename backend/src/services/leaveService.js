const leaveRepository = require('../repositories/leaveRepository');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');

const startOfYear = (d = new Date()) => new Date(d.getFullYear(), 0, 1);

const leaveService = {
  getLeaves: async (user) => {
    const role = user.role || '';
    let where = {};
    if (role === 'Employee') {
      where = { employeeId: user.id };
    } else if (role === 'Manager') {
      const dbUser = await userRepository.findById(user.id);
      const myDeptId = dbUser?.departmentId || null;
      if (myDeptId) {
        const deptUsers = await prisma.user.findMany({ where: { departmentId: myDeptId }, select: { id: true } });
        where = { employeeId: { in: deptUsers.map(u => u.id) } };
      } else {
        where = { employeeId: -1 };
      }
    }
    return await leaveRepository.findAll(where);
  },

  getLeavesByEmployee: async (employeeId) => {
    return await leaveRepository.findAll({ employeeId: parseInt(employeeId) });
  },

  getUsage: async (employeeId) => {
    const agg = await leaveRepository.aggregateApprovedDays(employeeId, startOfYear());
    return { employeeId: parseInt(employeeId), usedDaysYear: Number(agg._sum.days || 0) };
  },

  getLeaveById: async (id) => {
    const leave = await leaveRepository.findById(id);
    if (!leave) throw new Error('Leave not found');
    return leave;
  },

  createLeaveRequest: async (leaveData) => {
    const { employeeId, leaveTypeId, startDate, endDate, reason, comments } = leaveData;
    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) throw new Error('Missing required fields');

    const employee = await userRepository.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const leaveType = await prisma.leaveType.findUnique({ where: { id: parseInt(leaveTypeId) } });
    if (!leaveType) throw new Error('Leave type not found');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (leaveType.maxDays && days > leaveType.maxDays) throw new Error(`Exceeds max days (${leaveType.maxDays})`);

    const overlaps = await leaveRepository.findOverlapping(employeeId, start, end);
    if (overlaps.some(l => l.status === 'Approved')) throw new Error('Overlaps with an approved leave');

    const leave = await leaveRepository.create({
      employeeId: parseInt(employeeId),
      leaveTypeId: parseInt(leaveTypeId),
      startDate: start,
      endDate: end,
      days,
      reason,
      comments
    });

    // Notify manager
    if (employee.managerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: employee.managerId,
            title: 'New Leave Request',
            message: `${employee.fullName} has requested ${days} days of ${leaveType.name} leave.`,
            type: 'INFO',
            link: '/leave-management'
          }
        });
      } catch (e) {
        console.warn('Notification failed', e.message);
      }
    }
    return leave;
  },

  updateLeaveRequest: async (id, leaveData) => {
    const current = await leaveRepository.findById(id);
    if (!current) throw new Error('Leave not found');

    const { startDate, endDate, leaveTypeId, reason, comments } = leaveData;
    let days = undefined;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const overlaps = await leaveRepository.findOverlapping(current.employeeId, start, end);
      if (overlaps.some(l => l.status === 'Approved' && l.id !== parseInt(id))) throw new Error('Overlaps with an approved leave');
    }

    const updated = await leaveRepository.update(id, {
      leaveTypeId: leaveTypeId ? parseInt(leaveTypeId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      days,
      reason,
      comments
    });

    const usage = await leaveService.getUsage(updated.employeeId);
    return { ...updated, ...usage };
  },

  processApproval: async (id, status, approverId, comments) => {
    const approver = await userRepository.findById(approverId);
    const role = approver?.role || '';
    const isAdmin = role === 'Admin' || role === 'SuperAdmin';
    const isManager = role === 'Manager';

    if (!approver || (!isAdmin && !isManager)) throw new Error('Unauthorized');

    const leave = await leaveRepository.findById(id);
    if (!leave) throw new Error('Leave not found');

    if (!isAdmin) {
      if (!leave.employee?.departmentId) throw new Error('Employee has no department');
      const dept = await prisma.department.findUnique({ where: { id: leave.employee.departmentId } });
      if (!dept || dept.managerId !== approverId) throw new Error('Unauthorized');
    }

    const updated = await leaveRepository.update(id, {
      status,
      approvedBy: approverId,
      approvedAt: new Date(),
      comments: comments || (status === 'Rejected' ? 'Rejected by manager' : undefined)
    });

    try {
      await prisma.notification.create({
        data: {
          userId: updated.employeeId,
          title: `Leave ${status}`,
          message: `Your leave request has been ${status.toLowerCase()} by ${approver.fullName}.`,
          type: status === 'Approved' ? 'SUCCESS' : 'WARNING',
          link: '/leave-management'
        }
      });
    } catch (e) {
      console.warn('Notification failed', e.message);
    }

    const usage = await leaveService.getUsage(updated.employeeId);
    return { ...updated, ...usage };
  },

  deleteLeave: async (id) => {
    return await leaveRepository.delete(id);
  },

  // --- Leave Types logic ---
  getLeaveTypes: async (id = null) => {
    if (id) return await leaveRepository.findTypeById(id);
    return await leaveRepository.findAllTypes();
  },

  createLeaveType: async (data) => {
    if (!data.name) throw new Error('Name is required');
    return await leaveRepository.createType({
      name: data.name,
      description: data.description,
      maxDays: data.maxDays ? parseInt(data.maxDays) : null,
      isPaid: data.isPaid !== undefined ? data.isPaid : true,
      isActive: data.isActive !== undefined ? data.isActive : true
    });
  },

  updateLeaveType: async (id, data) => {
    return await leaveRepository.updateType(id, {
      name: data.name,
      description: data.description,
      maxDays: data.maxDays ? parseInt(data.maxDays) : null,
      isPaid: data.isPaid,
      isActive: data.isActive
    });
  },

  deleteLeaveType: async (id) => {
    const usage = await leaveRepository.countLeavesByType(id);
    if (usage > 0) throw new Error('Cannot delete leave type that is being used by existing leave requests');
    return await leaveRepository.deleteType(id);
  }
};

module.exports = leaveService;
