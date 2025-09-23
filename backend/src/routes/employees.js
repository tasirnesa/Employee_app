const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma/client');

// List employees with optional query: isActive=true/false
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    const employees = await prisma.employee.findMany({ where, orderBy: { id: 'desc' } });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get one employee
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, email are required' });
    }
    const data = {
      firstName,
      lastName,
      email,
      phone: phone || null,
      department: department || null,
      position: position || null,
      hireDate: hireDate ? new Date(hireDate) : null,
      isActive: isActive == null ? true : Boolean(isActive),
      userId: userId != null && !Number.isNaN(parseInt(userId)) ? parseInt(userId) : null,
    };
    const created = await prisma.employee.create({ data });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId } = req.body;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone === undefined ? existing.phone : phone,
        department: department === undefined ? existing.department : department,
        position: position === undefined ? existing.position : position,
        hireDate: hireDate === undefined ? existing.hireDate : (hireDate ? new Date(hireDate) : null),
        isActive: isActive === undefined ? existing.isActive : Boolean(isActive),
        userId: userId === undefined ? existing.userId : (userId != null ? parseInt(userId) : null),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Activate / Deactivate
router.patch('/:id/activate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: true } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.patch('/:id/deactivate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: false } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;


