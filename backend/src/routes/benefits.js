const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all benefits
router.get('/benefits', async (req, res) => {
  try {
    const benefits = await prisma.benefit.findMany({
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
        effectiveDate: 'desc'
      }
    });

    res.json(benefits);
  } catch (error) {
    console.error('Error fetching benefits:', error);
    res.status(500).json({ error: 'Failed to fetch benefits' });
  }
});

// Get benefits for specific employee
router.get('/benefits/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const benefits = await prisma.benefit.findMany({
      where: {
        employeeId: parseInt(employeeId)
      },
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
        effectiveDate: 'desc'
      }
    });

    res.json(benefits);
  } catch (error) {
    console.error('Error fetching employee benefits:', error);
    res.status(500).json({ error: 'Failed to fetch employee benefits' });
  }
});

// Create new benefit
router.post('/benefits', async (req, res) => {
  try {
    const { 
      employeeId, 
      benefitType, 
      provider, 
      coverage, 
      monthlyCost, 
      employeeContribution, 
      companyContribution, 
      effectiveDate, 
      expiryDate, 
      status, 
      notes 
    } = req.body;
    
    const benefit = await prisma.benefit.create({
      data: {
        employeeId: parseInt(employeeId),
        benefitType,
        provider,
        coverage,
        monthlyCost: parseFloat(monthlyCost),
        employeeContribution: parseFloat(employeeContribution),
        companyContribution: parseFloat(companyContribution),
        effectiveDate: new Date(effectiveDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'Active',
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.status(201).json(benefit);
  } catch (error) {
    console.error('Error creating benefit:', error);
    res.status(500).json({ error: 'Failed to create benefit' });
  }
});

// Update benefit
router.put('/benefits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      benefitType, 
      provider, 
      coverage, 
      monthlyCost, 
      employeeContribution, 
      companyContribution, 
      effectiveDate, 
      expiryDate, 
      status, 
      notes 
    } = req.body;
    
    const benefit = await prisma.benefit.update({
      where: { id: parseInt(id) },
      data: {
        benefitType,
        provider,
        coverage,
        monthlyCost: parseFloat(monthlyCost),
        employeeContribution: parseFloat(employeeContribution),
        companyContribution: parseFloat(companyContribution),
        effectiveDate: new Date(effectiveDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.json(benefit);
  } catch (error) {
    console.error('Error updating benefit:', error);
    res.status(500).json({ error: 'Failed to update benefit' });
  }
});

// Delete benefit
router.delete('/benefits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.benefit.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Benefit deleted successfully' });
  } catch (error) {
    console.error('Error deleting benefit:', error);
    res.status(500).json({ error: 'Failed to delete benefit' });
  }
});

// Get all perks
router.get('/perks', async (req, res) => {
  try {
    const perks = await prisma.perk.findMany({
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
        startDate: 'desc'
      }
    });

    res.json(perks);
  } catch (error) {
    console.error('Error fetching perks:', error);
    res.status(500).json({ error: 'Failed to fetch perks' });
  }
});

// Get perks for specific employee
router.get('/perks/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const perks = await prisma.perk.findMany({
      where: {
        employeeId: parseInt(employeeId)
      },
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
        startDate: 'desc'
      }
    });

    res.json(perks);
  } catch (error) {
    console.error('Error fetching employee perks:', error);
    res.status(500).json({ error: 'Failed to fetch employee perks' });
  }
});

// Create new perk
router.post('/perks', async (req, res) => {
  try {
    const { 
      employeeId, 
      perkType, 
      description, 
      value, 
      frequency, 
      status, 
      startDate, 
      endDate 
    } = req.body;
    
    const perk = await prisma.perk.create({
      data: {
        employeeId: parseInt(employeeId),
        perkType,
        description,
        value: parseFloat(value) || 0,
        frequency,
        status: status || 'Active',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.status(201).json(perk);
  } catch (error) {
    console.error('Error creating perk:', error);
    res.status(500).json({ error: 'Failed to create perk' });
  }
});

// Update perk
router.put('/perks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      perkType, 
      description, 
      value, 
      frequency, 
      status, 
      startDate, 
      endDate 
    } = req.body;
    
    const perk = await prisma.perk.update({
      where: { id: parseInt(id) },
      data: {
        perkType,
        description,
        value: parseFloat(value) || 0,
        frequency,
        status,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        }
      }
    });

    res.json(perk);
  } catch (error) {
    console.error('Error updating perk:', error);
    res.status(500).json({ error: 'Failed to update perk' });
  }
});

// Delete perk
router.delete('/perks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.perk.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Perk deleted successfully' });
  } catch (error) {
    console.error('Error deleting perk:', error);
    res.status(500).json({ error: 'Failed to delete perk' });
  }
});

// Get benefits by type
router.get('/benefits/type/:benefitType', async (req, res) => {
  try {
    const { benefitType } = req.params;
    const benefits = await prisma.benefit.findMany({
      where: { benefitType },
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
        effectiveDate: 'desc'
      }
    });

    res.json(benefits);
  } catch (error) {
    console.error('Error fetching benefits by type:', error);
    res.status(500).json({ error: 'Failed to fetch benefits by type' });
  }
});

// Get perks by type
router.get('/perks/type/:perkType', async (req, res) => {
  try {
    const { perkType } = req.params;
    const perks = await prisma.perk.findMany({
      where: { perkType },
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
        startDate: 'desc'
      }
    });

    res.json(perks);
  } catch (error) {
    console.error('Error fetching perks by type:', error);
    res.status(500).json({ error: 'Failed to fetch perks by type' });
  }
});

module.exports = router;
