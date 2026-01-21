const express = require('express');
const { prisma } = require('../prisma/client');
const router = express.Router();

const startOfYear = (d = new Date()) => new Date(d.getFullYear(), 0, 1);

// Get all leaves
router.get('/', async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    const role = current?.role || '';
    let where = {};
    if (role === 'Employee') {
      where = { employeeId: req.user.id };
    } else if (role === 'Manager') {
      // Manager sees only their department's employees
      const myDeptId = current?.departmentId || null;
      if (myDeptId) {
        const deptUserIds = await prisma.user.findMany({ where: { departmentId: myDeptId }, select: { id: true } });
        where = { employeeId: { in: deptUserIds.map(u => u.id) } };
      } else {
        where = { employeeId: -1 }; // nothing if manager has no department
      }
    } // Admin/SuperAdmin see all

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true,
            departmentId: true,
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        appliedDate: 'desc'
      }
    });
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// Get leaves for specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const leaves = await prisma.leave.findMany({
      where: {
        employeeId: parseInt(employeeId)
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        appliedDate: 'desc'
      }
    });
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    res.status(500).json({ error: 'Failed to fetch employee leaves' });
  }
});

// Usage summary for an employee (current year approved days)
router.get('/usage/:employeeId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (Number.isNaN(employeeId)) return res.status(400).json({ error: 'Invalid employeeId' });
    const usedAgg = await prisma.leave.aggregate({
      _sum: { days: true },
      where: { employeeId, status: 'Approved', startDate: { gte: startOfYear() } },
    });
    const usedDaysYear = Number(usedAgg._sum.days || 0);
    return res.json({ employeeId, usedDaysYear });
  } catch (error) {
    console.error('Error computing leave usage:', error);
    return res.status(500).json({ error: 'Failed to compute usage' });
  }
});

// Get leave by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await prisma.leave.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    res.json(leave);
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({ error: 'Failed to fetch leave' });
  }
});

// Create new leave request
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      reason,
      comments
    } = req.body;

    // Validate required fields
    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(employeeId) }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if leave type exists
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: parseInt(leaveTypeId) }
    });

    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found' });
    }

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check if leave type has max days limit
    if (leaveType.maxDays && days > leaveType.maxDays) {
      return res.status(400).json({ error: `Leave request exceeds maximum allowed days (${leaveType.maxDays})` });
    }

    // Check for overlapping leaves
    const overlappingLeaves = await prisma.leave.findMany({
      where: {
        employeeId: parseInt(employeeId),
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } }
            ]
          }
        ]
      },
      include: {
        leaveType: {
          select: { name: true }
        }
      }
    });

    // Check for approved overlaps (hard block)
    const approvedOverlap = overlappingLeaves.find(l => l.status === 'Approved');
    if (approvedOverlap) {
      return res.status(400).json({
        error: `You already have approved ${approvedOverlap.leaveType.name} from ${new Date(approvedOverlap.startDate).toLocaleDateString()} to ${new Date(approvedOverlap.endDate).toLocaleDateString()}. Cannot request overlapping leave.`
      });
    }

    // Check for pending overlaps (warning but allow)
    const pendingOverlap = overlappingLeaves.find(l => l.status === 'Pending');
    if (pendingOverlap) {
      console.warn(`Employee ${employeeId} has pending leave overlap`);
      // Optionally: return a warning but still allow creation
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId: parseInt(employeeId),
        leaveTypeId: parseInt(leaveTypeId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
        comments
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        }
      }
    });

    // Create notification for manager
    try {
      const managerId = employee.managerId;
      if (managerId) {
        await prisma.notification.create({
          data: {
            userId: managerId,
            title: 'New Leave Request',
            message: `${employee.fullName} has requested ${days} days of ${leaveType.name} leave.`,
            type: 'INFO',
            link: '/leave-management'
          }
        });
      }
    } catch (notifErr) {
      console.warn('Failed to create notification for leave request:', notifErr.message);
    }

    res.status(201).json(leave);
  } catch (error) {
    console.error('Error creating leave:', error);
    res.status(500).json({ error: 'Failed to create leave' });
  }
});

// Update leave
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      leaveTypeId,
      startDate,
      endDate,
      reason,
      comments
    } = req.body;

    // Calculate days if dates are provided
    let days = undefined;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Get current leave to check employeeId
      const currentLeave = await prisma.leave.findUnique({
        where: { id: parseInt(id) }
      });

      if (currentLeave) {
        // Check for overlapping leaves (excluding this leave)
        const overlappingLeaves = await prisma.leave.findMany({
          where: {
            employeeId: currentLeave.employeeId,
            id: { not: parseInt(id) }, // Exclude current leave
            OR: [
              {
                AND: [
                  { startDate: { lte: end } },
                  { endDate: { gte: start } }
                ]
              }
            ]
          },
          include: {
            leaveType: {
              select: { name: true }
            }
          }
        });

        // Check for approved overlaps
        const approvedOverlap = overlappingLeaves.find(l => l.status === 'Approved');
        if (approvedOverlap) {
          return res.status(400).json({
            error: `Cannot update: overlaps with approved ${approvedOverlap.leaveType.name} from ${new Date(approvedOverlap.startDate).toLocaleDateString()} to ${new Date(approvedOverlap.endDate).toLocaleDateString()}.`
          });
        }
      }
    }

    const leave = await prisma.leave.update({
      where: {
        id: parseInt(id)
      },
      data: {
        leaveTypeId: leaveTypeId ? parseInt(leaveTypeId) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        days,
        reason,
        comments
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    // compute used days for this employee in current year (Approved only)
    const usedAgg = await prisma.leave.aggregate({
      _sum: { days: true },
      where: { employeeId: leave.employeeId, status: 'Approved', startDate: { gte: startOfYear() } },
    });
    const usedDaysYear = Number(usedAgg._sum.days || 0);
    res.json({ ...leave, usedDaysYear });
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({ error: 'Failed to update leave' });
  }
});

// Approve leave
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user.id;
    const approver = await prisma.user.findUnique({ where: { id: approverId } });
    const role = approver?.role || '';
    const isAdmin = role === 'Admin' || role === 'SuperAdmin';
    const isManager = role === 'Manager';
    if (!approver || (!isManager && !isAdmin)) {
      return res.status(403).json({ error: 'Only managers or admins can approve leaves' });
    }
    const leaveRecord = await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { id: true, departmentId: true } } },
    });
    if (!leaveRecord) return res.status(404).json({ error: 'Leave not found' });
    if (!isAdmin) {
      if (!leaveRecord.employee?.departmentId) return res.status(403).json({ error: 'Employee has no department' });
      const dept = await prisma.department.findUnique({ where: { id: leaveRecord.employee.departmentId } });
      if (!dept || dept.managerId !== approverId) {
        return res.status(403).json({ error: 'Not authorized to approve this employee\'s leave' });
      }
    }

    const leave = await prisma.leave.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        comments: comments || undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    // compute used days for this employee in current year (Approved only)
    const usedAgg = await prisma.leave.aggregate({
      _sum: { days: true },
      where: { employeeId: leave.employeeId, status: 'Approved', startDate: { gte: startOfYear() } },
    });
    const usedDaysYear = Number(usedAgg._sum.days || 0);

    // Create notification for employee
    try {
      await prisma.notification.create({
        data: {
          userId: leave.employeeId,
          title: 'Leave Approved',
          message: `Your ${leave.leaveType?.name || 'leave'} request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved by ${leave.approver?.fullName || 'a manager'}.`,
          type: 'SUCCESS',
          link: '/leave-management'
        }
      });
    } catch (notifErr) {
      console.warn('Failed to notify employee of leave approval:', notifErr.message);
    }

    res.json({ ...leave, usedDaysYear });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

// Reject leave
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user.id;
    const approver = await prisma.user.findUnique({ where: { id: approverId } });
    const role = approver?.role || '';
    const isAdmin = role === 'Admin' || role === 'SuperAdmin';
    const isManager = role === 'Manager';
    if (!approver || (!isManager && !isAdmin)) {
      return res.status(403).json({ error: 'Only managers or admins can reject leaves' });
    }
    const leaveRecord = await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: { employee: { select: { id: true, departmentId: true } } },
    });
    if (!leaveRecord) return res.status(404).json({ error: 'Leave not found' });
    if (!isAdmin) {
      if (!leaveRecord.employee?.departmentId) return res.status(403).json({ error: 'Employee has no department' });
      const dept = await prisma.department.findUnique({ where: { id: leaveRecord.employee.departmentId } });
      if (!dept || dept.managerId !== approverId) {
        return res.status(403).json({ error: 'Not authorized to reject this employee\'s leave' });
      }
    }

    const leave = await prisma.leave.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'Rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        comments: comments || 'Rejected by manager'
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDays: true,
            isPaid: true
          }
        }
      }
    });

    // Create notification for employee
    try {
      await prisma.notification.create({
        data: {
          userId: leave.employeeId,
          title: 'Leave Rejected',
          message: `Your ${leave.leaveType?.name || 'leave'} request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been rejected by ${approver?.fullName || 'a manager'}. Reason: ${comments || 'No reason provided'}.`,
          type: 'WARNING',
          link: '/leave-management'
        }
      });
    } catch (notifErr) {
      console.warn('Failed to create notification for leave rejection:', notifErr.message);
    }

    res.json(leave);
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({ error: 'Failed to reject leave' });
  }
});

// Delete leave
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.leave.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ message: 'Leave deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({ error: 'Failed to delete leave' });
  }
});

module.exports = router;
