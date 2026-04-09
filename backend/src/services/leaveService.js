const leaveRepository = require('../repositories/leaveRepository');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');
const emailService = require('./emailService');

const startOfYear = (d = new Date()) => new Date(d.getFullYear(), 0, 1);
const endOfYear = (d = new Date()) => new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

const _calculateBusinessDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const leaveService = {
  getLeaves: async (user) => {
    const role = user.role || '';
    let where = {};
    if (role === 'Employee') {
      where = { employeeId: user.id };
    } else if (role === 'Manager') {
      const dbUser = await userRepository.findById(user.id);
      const myDeptId = dbUser?.departmentId || null;
      
      where = {
        OR: [
          { employeeId: user.id }, // Own leaves
          { employee: { managerId: user.id } }, // Direct reports
          { employee: { department: { managerId: user.id } } } // Department reports
        ]
      };
    }
    return await leaveRepository.findAll(where);
  },

  getLeavesByEmployee: async (employeeId) => {
    return await leaveRepository.findAll({ employeeId: parseInt(employeeId) });
  },

  getUsage: async (employeeId, leaveTypeId = null) => {
    const where = { employeeId: parseInt(employeeId), status: 'Approved', startDate: { gte: startOfYear() } };
    if (leaveTypeId) where.leaveTypeId = parseInt(leaveTypeId);
    
    const records = await prisma.leave.findMany({ where });
    const usedDays = records.reduce((sum, r) => sum + (r.days || 0), 0);
    
    return { 
      employeeId: parseInt(employeeId), 
      leaveTypeId: leaveTypeId ? parseInt(leaveTypeId) : null,
      usedDaysYear: usedDays 
    };
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
    
    let days = _calculateBusinessDays(start, end);
    if (leaveData.isHalfDay) {
      days = 0.5;
    }

    if (leaveType.maxDays && days > leaveType.maxDays) throw new Error(`Exceeds max days (${leaveType.maxDays})`);

    const usage = await leaveService.getUsage(employeeId, leaveTypeId);
    if (leaveType.maxDays && (usage.usedDaysYear + days) > leaveType.maxDays) {
      throw new Error(`Insufficient leave balance. Used: ${usage.usedDaysYear}, Remaining: ${leaveType.maxDays - usage.usedDaysYear}`);
    }

    const overlaps = await leaveRepository.findOverlapping(employeeId, start, end);
    if (overlaps.some(l => l.status === 'Approved')) throw new Error('Overlaps with an approved leave');

    const leave = await leaveRepository.create({
      employeeId: parseInt(employeeId),
      leaveTypeId: parseInt(leaveTypeId),
      startDate: start,
      endDate: end,
      days,
      reason: reason || '',
      comments: comments || '',
      handoverId: leaveData.handoverId ? parseInt(leaveData.handoverId) : null,
      emergencyContact: leaveData.emergencyContact || null,
      isHalfDay: !!leaveData.isHalfDay,
      halfDayPeriod: leaveData.halfDayPeriod || null,
      attachmentUrl: leaveData.attachmentUrl || null
    });

    // --- Notifications ---
    // 1. Notify Manager
    const employeeWithManager = await userRepository.findById(employeeId, true);
    if (employeeWithManager?.managerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: employeeWithManager.managerId,
            title: 'New Leave Request',
            message: `${employeeWithManager.fullName} has requested ${days} days of ${leaveType.name} leave.`,
            type: 'INFO',
            link: '/leave-management'
          }
        });

        if (employeeWithManager.manager?.email) {
            await emailService.sendEmail({
                to: employeeWithManager.manager.email,
                subject: 'New Leave Request Notification',
                text: `${employeeWithManager.fullName} has requested ${days} days of ${leaveType.name} leave starting from ${new Date(startDate).toLocaleDateString()}.`,
                html: `<p>${employeeWithManager.fullName} has requested <strong>${days}</strong> days of <strong>${leaveType.name}</strong> leave.</p><p>Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>`
            });
        }
      } catch (e) {
        console.warn('Manager notification failed', e.message);
      }
    }

    // 2. Notify Handover Person
    if (leaveData.handoverId) {
        try {
            const handoverUser = await userRepository.findById(leaveData.handoverId);
            if (handoverUser) {
                await prisma.notification.create({
                    data: {
                        userId: handoverUser.id,
                        title: 'Leave Handover Assigned',
                        message: `You have been assigned as a handover person for ${employeeWithManager.fullName}'s leave (${leaveType.name}) from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
                        type: 'INFO',
                        link: '/leave-management'
                    }
                });
            }
        } catch (e) {
            console.warn('Handover notification failed', e.message);
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

    // Self-approval prevention
    if (leave.employeeId === approverId) {
      throw new Error('Self-approval is not permitted. Please contact your manager or HR.');
    }

    if (!isAdmin) {
      const isDirectManager = leave.employee?.managerId === approverId;
      
      let isDeptManager = false;
      if (leave.employee?.departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: leave.employee.departmentId } });
        isDeptManager = dept?.managerId === approverId;
      }

      if (!isDirectManager && !isDeptManager) {
        throw new Error('Unauthorized: You are not the direct manager or department head for this employee.');
      }
    }

    const updated = await leaveRepository.update(id, {
      status,
      approvedBy: approverId,
      approvedAt: new Date(),
      comments: comments || (status === 'Rejected' ? 'Rejected by manager' : undefined)
    });

    // --- Create Attendance Records for Approved Leave ---
    if (status === 'Approved') {
        try {
            const start = new Date(updated.startDate);
            const end = new Date(updated.endDate);
            const cur = new Date(start);

            while (cur <= end) {
                // Only mark business days (Mon-Fri)
                const dayOfWeek = cur.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const recordDate = new Date(cur);
                    recordDate.setHours(0, 0, 0, 0);

                    const existing = await prisma.attendance.findFirst({
                        where: { employeeId: updated.employeeId, date: recordDate }
                    });

                    if (existing) {
                        await prisma.attendance.update({
                            where: { id: existing.id },
                            data: { status: 'on-leave', notes: `Automatic: Approved ${updated.leaveType.name}` }
                        });
                    } else {
                        await prisma.attendance.create({
                            data: {
                                employeeId: updated.employeeId,
                                date: recordDate,
                                status: 'on-leave',
                                notes: `Automatic: Approved ${updated.leaveType.name}`
                            }
                        });
                    }
                }
                cur.setDate(cur.getDate() + 1);
            }
        } catch (e) {
            console.warn('Attendance generation failed', e.message);
        }
    }

    // --- Notifications ---
    try {
      const emp = await prisma.employee.findUnique({
        where: { id: updated.employeeId },
        include: { user: true }
      });

      if (emp && emp.userId) {
        await prisma.notification.create({
          data: {
            userId: emp.userId,
            title: `Leave ${status}`,
            message: `Your leave request has been ${status.toLowerCase()} by ${approver.fullName}.`,
            type: status === 'Approved' ? 'SUCCESS' : 'WARNING',
            link: '/leave-management'
          }
        });

        const targetEmail = emp.email || emp.user?.email;
        if (targetEmail) {
          await emailService.sendLeaveStatusEmail(
            { id: emp.userId, fullName: `${emp.firstName} ${emp.lastName}`, email: targetEmail }, 
            updated, 
            status
          );
        }
      } else {
        console.warn(`[Leave Service] Skip notification: No user linked to employee ID ${updated.employeeId}`);
      }
    } catch (e) {
      console.warn('Notification processing failed', e.message);
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
