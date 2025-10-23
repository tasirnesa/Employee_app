const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        timesheets: {
          select: {
            id: true,
            hoursWorked: true,
            date: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        timesheets: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                userName: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      managerId
    } = req.body;
    
    // Validate required fields
    if (!name || !startDate || !managerId) {
      return res.status(400).json({ error: 'Missing required fields: name, startDate, managerId' });
    }
    
    // Check if manager exists
    const manager = await prisma.user.findUnique({
      where: { id: parseInt(managerId) }
    });
    
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'Active',
        managerId: parseInt(managerId)
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
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      managerId
    } = req.body;
    
    const project = await prisma.project.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        managerId: managerId ? parseInt(managerId) : undefined
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
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: {
        id: parseInt(id)
      }
    });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
