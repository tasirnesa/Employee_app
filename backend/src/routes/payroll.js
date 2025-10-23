const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all payslips
router.get('/payslips', async (req, res) => {
  try {
    const payslips = await prisma.payslip.findMany({
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
        generatedDate: 'desc'
      }
    });

    res.json(payslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// Get payslips for specific employee
router.get('/payslips/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const payslips = await prisma.payslip.findMany({
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
        generatedDate: 'desc'
      }
    });

    res.json(payslips);
  } catch (error) {
    console.error('Error fetching employee payslips:', error);
    res.status(500).json({ error: 'Failed to fetch employee payslips' });
  }
});

// Create new payslip
router.post('/payslips', async (req, res) => {
  try {
    const { employeeId, period, basicSalary, allowances, deductions, status } = req.body;
    
    const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);
    
    const payslip = await prisma.payslip.create({
      data: {
        employeeId: parseInt(employeeId),
        period,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        deductions: parseFloat(deductions),
        netSalary,
        status: status || 'Generated'
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

    res.status(201).json(payslip);
  } catch (error) {
    console.error('Error creating payslip:', error);
    res.status(500).json({ error: 'Failed to create payslip' });
  }
});

// Update payslip
router.put('/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { period, basicSalary, allowances, deductions, status, paidDate } = req.body;
    
    const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);
    
    const payslip = await prisma.payslip.update({
      where: { id: parseInt(id) },
      data: {
        period,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        deductions: parseFloat(deductions),
        netSalary,
        status,
        paidDate: paidDate ? new Date(paidDate) : null
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

    res.json(payslip);
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ error: 'Failed to update payslip' });
  }
});

// Delete payslip
router.delete('/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.payslip.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ error: 'Failed to delete payslip' });
  }
});

// Get all compensations
router.get('/compensations', async (req, res) => {
  try {
    const compensations = await prisma.compensation.findMany({
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

    res.json(compensations);
  } catch (error) {
    console.error('Error fetching compensations:', error);
    res.status(500).json({ error: 'Failed to fetch compensations' });
  }
});

// Get compensations for specific employee
router.get('/compensations/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const compensations = await prisma.compensation.findMany({
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

    res.json(compensations);
  } catch (error) {
    console.error('Error fetching employee compensations:', error);
    res.status(500).json({ error: 'Failed to fetch employee compensations' });
  }
});

// Create new compensation
router.post('/compensations', async (req, res) => {
  try {
    const { employeeId, position, basicSalary, allowances, bonus, effectiveDate, status } = req.body;
    
    const totalCompensation = parseFloat(basicSalary) + parseFloat(allowances) + parseFloat(bonus);
    
    const compensation = await prisma.compensation.create({
      data: {
        employeeId: parseInt(employeeId),
        position,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        bonus: parseFloat(bonus),
        totalCompensation,
        effectiveDate: new Date(effectiveDate),
        status: status || 'Active'
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

    res.status(201).json(compensation);
  } catch (error) {
    console.error('Error creating compensation:', error);
    res.status(500).json({ error: 'Failed to create compensation' });
  }
});

// Update compensation
router.put('/compensations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, basicSalary, allowances, bonus, effectiveDate, status } = req.body;
    
    const totalCompensation = parseFloat(basicSalary) + parseFloat(allowances) + parseFloat(bonus);
    
    const compensation = await prisma.compensation.update({
      where: { id: parseInt(id) },
      data: {
        position,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        bonus: parseFloat(bonus),
        totalCompensation,
        effectiveDate: new Date(effectiveDate),
        status
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

    res.json(compensation);
  } catch (error) {
    console.error('Error updating compensation:', error);
    res.status(500).json({ error: 'Failed to update compensation' });
  }
});

// Delete compensation
router.delete('/compensations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.compensation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Compensation deleted successfully' });
  } catch (error) {
    console.error('Error deleting compensation:', error);
    res.status(500).json({ error: 'Failed to delete compensation' });
  }
});

module.exports = router;
