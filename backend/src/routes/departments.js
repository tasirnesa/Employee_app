const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireRoles } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        users: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
      include: {
        manager: true,
        users: true
      }
    });
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create new department
router.post('/', requireRoles('Admin', 'SuperAdmin'), async (req, res) => {
  try {
    console.log('POST /api/departments - Request received');
    console.log('Request body:', req.body);
    console.log('User from auth:', req.user);
    console.log('User role:', req.user?.role);
    
    const { name, managerId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    const department = await prisma.department.create({
      data: {
        name,
        managerId: managerId ? parseInt(managerId) : null
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });
    
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Department with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create department' });
    }
  }
});

// Update department
router.put('/:id', requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, managerId } = req.body;
    
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name,
        managerId: managerId ? parseInt(managerId) : null
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        users: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });
    
    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Department with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update department' });
    }
  }
});

// Delete department
router.delete('/:id', requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are users in this department
    const usersCount = await prisma.user.count({
      where: {
        departmentId: parseInt(id)
      }
    });
    
    if (usersCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department with ${usersCount} users. Please reassign users first.` 
      });
    }
    
    await prisma.department.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;

