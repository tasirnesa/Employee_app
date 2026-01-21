const express = require('express');
const { prisma } = require('../prisma/client');
const router = express.Router();

// Get all leave types (including inactive for management)
router.get('/', async (req, res) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(leaveTypes);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ error: 'Failed to fetch leave types' });
  }
});

// Get leave type by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await prisma.leaveType.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found' });
    }

    res.json(leaveType);
  } catch (error) {
    console.error('Error fetching leave type:', error);
    res.status(500).json({ error: 'Failed to fetch leave type' });
  }
});

// Create new leave type
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      maxDays,
      isPaid,
      isActive
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        description,
        maxDays: maxDays ? parseInt(maxDays) : null,
        isPaid: isPaid !== undefined ? isPaid : true,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(leaveType);
  } catch (error) {
    console.error('Error creating leave type:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Leave type with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create leave type' });
    }
  }
});

// Update leave type
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      maxDays,
      isPaid,
      isActive
    } = req.body;

    const leaveType = await prisma.leaveType.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name,
        description,
        maxDays: maxDays ? parseInt(maxDays) : null,
        isPaid,
        isActive
      }
    });

    res.json(leaveType);
  } catch (error) {
    console.error('Error updating leave type:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Leave type with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update leave type' });
    }
  }
});

// Delete leave type
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any leaves using this type
    const leavesCount = await prisma.leave.count({
      where: {
        leaveTypeId: parseInt(id)
      }
    });

    if (leavesCount > 0) {
      return res.status(400).json({ error: 'Cannot delete leave type that is being used by existing leave requests' });
    }

    await prisma.leaveType.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ message: 'Leave type deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave type:', error);
    res.status(500).json({ error: 'Failed to delete leave type' });
  }
});

module.exports = router;
