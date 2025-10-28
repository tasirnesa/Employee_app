const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireRoles } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Get all positions
router.get('/', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        reportsToPosition: {
          select: {
            id: true,
            name: true
          }
        },
        subordinates: true,
        users: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: {
        level: 'asc'
      }
    });
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get position by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const position = await prisma.position.findUnique({
      where: { id: parseInt(id) },
      include: {
        reportsToPosition: true,
        subordinates: true,
        users: true
      }
    });
    
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.json(position);
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({ error: 'Failed to fetch position' });
  }
});

// Create new position
router.post('/', requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, level, reportsTo } = req.body;
    
    if (!name || !level) {
      return res.status(400).json({ error: 'Name and level are required' });
    }
    
    const position = await prisma.position.create({
      data: {
        name,
        level: parseInt(level),
        reportsTo: reportsTo ? parseInt(reportsTo) : null
      },
      include: {
        reportsToPosition: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.status(201).json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// Update position
router.put('/:id', requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, reportsTo } = req.body;
    
    const position = await prisma.position.update({
      where: { id: parseInt(id) },
      data: {
        name,
        level: level ? parseInt(level) : undefined,
        reportsTo: reportsTo ? parseInt(reportsTo) : null
      },
      include: {
        reportsToPosition: true,
        subordinates: true,
        users: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });
    
    res.json(position);
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ error: 'Failed to update position' });
  }
});

// Delete position
router.delete('/:id', requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are users with this position
    const usersCount = await prisma.user.count({
      where: {
        positionId: parseInt(id)
      }
    });
    
    if (usersCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete position with ${usersCount} users. Please reassign users first.` 
      });
    }
    
    // Check if there are subordinates
    const subordinatesCount = await prisma.position.count({
      where: {
        reportsTo: parseInt(id)
      }
    });
    
    if (subordinatesCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete position with ${subordinatesCount} subordinate positions. Please reassign subordinates first.` 
      });
    }
    
    await prisma.position.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ error: 'Failed to delete position' });
  }
});

module.exports = router;

