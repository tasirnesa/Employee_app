const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all leaves
router.get('/', async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({
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
    
    res.json(leave);
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({ error: 'Failed to update leave' });
  }
});

// Approve leave
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, comments } = req.body;
    
    if (!approvedBy) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }
    
    const leave = await prisma.leave.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'Approved',
        approvedBy: parseInt(approvedBy),
        approvedAt: new Date(),
        comments: comments || leave.comments
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
    
    res.json(leave);
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
    
    const leave = await prisma.leave.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'Rejected',
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
