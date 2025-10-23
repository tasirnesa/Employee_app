const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all timesheets
router.get('/', async (req, res) => {
  try {
    const timesheets = await prisma.timesheet.findMany({
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
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
        date: 'desc'
      }
    });
    res.json(timesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

// Get timesheets for specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const timesheets = await prisma.timesheet.findMany({
      where: {
        employeeId: parseInt(employeeId)
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
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
        date: 'desc'
      }
    });
    res.json(timesheets);
  } catch (error) {
    console.error('Error fetching employee timesheets:', error);
    res.status(500).json({ error: 'Failed to fetch employee timesheets' });
  }
});

// Get timesheet by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const timesheet = await prisma.timesheet.findUnique({
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
        project: {
          select: {
            id: true,
            name: true
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
    
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }
    
    res.json(timesheet);
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    res.status(500).json({ error: 'Failed to fetch timesheet' });
  }
});

// Create new timesheet
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      projectId,
      taskDescription,
      date,
      startTime,
      endTime,
      overtimeHours,
      notes
    } = req.body;
    
    // Validate required fields
    if (!employeeId || !taskDescription || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(employeeId) }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Calculate hours worked
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hoursWorked = (end - start) / (1000 * 60 * 60);
    
    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId: parseInt(employeeId),
        projectId: projectId ? parseInt(projectId) : null,
        taskDescription,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        hoursWorked,
        overtimeHours: parseFloat(overtimeHours) || 0,
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.status(201).json(timesheet);
  } catch (error) {
    console.error('Error creating timesheet:', error);
    res.status(500).json({ error: 'Failed to create timesheet' });
  }
});

// Update timesheet
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      projectId,
      taskDescription,
      date,
      startTime,
      endTime,
      overtimeHours,
      notes
    } = req.body;
    
    // Calculate hours worked if times are provided
    let hoursWorked = undefined;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      hoursWorked = (end - start) / (1000 * 60 * 60);
    }
    
    const timesheet = await prisma.timesheet.update({
      where: {
        id: parseInt(id)
      },
      data: {
        projectId: projectId ? parseInt(projectId) : null,
        taskDescription,
        date: date ? new Date(date) : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        hoursWorked,
        overtimeHours: overtimeHours !== undefined ? parseFloat(overtimeHours) : undefined,
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
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
    
    res.json(timesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    res.status(500).json({ error: 'Failed to update timesheet' });
  }
});

// Approve timesheet
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    if (!approvedBy) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }
    
    const timesheet = await prisma.timesheet.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'Approved',
        approvedBy: parseInt(approvedBy),
        approvedAt: new Date()
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
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
    
    res.json(timesheet);
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ error: 'Failed to approve timesheet' });
  }
});

// Reject timesheet
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const timesheet = await prisma.timesheet.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'Rejected',
        notes: notes || 'Rejected by manager'
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json(timesheet);
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    res.status(500).json({ error: 'Failed to reject timesheet' });
  }
});

// Delete timesheet
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.timesheet.delete({
      where: {
        id: parseInt(id)
      }
    });
    
    res.json({ message: 'Timesheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    res.status(500).json({ error: 'Failed to delete timesheet' });
  }
});

module.exports = router;
