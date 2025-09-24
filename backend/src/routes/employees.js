const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma/client');
const bcrypt = require('bcrypt');

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
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId, gender, age, birthDate, profileImageUrl, username, password } = req.body;
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
      gender: gender || null,
      age: age == null ? null : parseInt(age),
      birthDate: birthDate ? new Date(birthDate) : null,
      profileImageUrl: profileImageUrl || null,
      isActive: isActive == null ? true : Boolean(isActive),
      userId: userId != null && !Number.isNaN(parseInt(userId)) ? parseInt(userId) : null,
    };
    // Optionally create linked user if username/password provided
    if (!data.userId && username && password) {
      let userName = String(username).trim().toLowerCase();
      const exists = await prisma.user.findFirst({ where: { userName } });
      if (exists) return res.status(409).json({ error: 'Username already exists' });
      const hashed = await bcrypt.hash(password, 10);
      const createdUser = await prisma.user.create({
        data: {
          fullName: `${firstName} ${lastName}`.trim(),
          userName,
          password: hashed,
          gender: gender || null,
          age: age == null ? null : parseInt(age),
          role: 'Employee',
          status: 'true',
          locked: 'false',
          isFirstLogin: 'true',
          activeStatus: 'true',
          createdDate: new Date(),
          createdBy: req.user?.id || 1,
        },
      });
      data.userId = createdUser.id;
    }
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
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId, gender, age, birthDate, profileImageUrl, username, password } = req.body;
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
        gender: gender === undefined ? existing.gender : gender,
        age: age === undefined ? existing.age : (age == null ? null : parseInt(age)),
        birthDate: birthDate === undefined ? existing.birthDate : (birthDate ? new Date(birthDate) : null),
        profileImageUrl: profileImageUrl === undefined ? existing.profileImageUrl : profileImageUrl,
        isActive: isActive === undefined ? existing.isActive : Boolean(isActive),
        userId: userId === undefined ? existing.userId : (userId != null ? parseInt(userId) : null),
      },
    });
    // Optionally create or update linked user credentials
    if (username || password) {
      if (!updated.userId) {
        if (!username || !password) {
          return res.status(400).json({ error: 'Both username and password required to create linked user' });
        }
        const existsUser = await prisma.user.findFirst({ where: { userName: String(username).trim().toLowerCase() } });
        if (existsUser) return res.status(409).json({ error: 'Username already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const createdUser = await prisma.user.create({
          data: {
            fullName: `${updated.firstName} ${updated.lastName}`.trim(),
            userName: String(username).trim().toLowerCase(),
            password: hashed,
            gender: updated.gender || null,
            age: updated.age == null ? null : Number(updated.age),
            role: 'Employee',
            status: 'true',
            locked: 'false',
            isFirstLogin: 'true',
            activeStatus: 'true',
            createdDate: new Date(),
            createdBy: req.user?.id || 1,
          },
        });
        await prisma.employee.update({ where: { id }, data: { userId: createdUser.id } });
      } else {
        const userIdLinked = updated.userId;
        const dataUser = {};
        if (username) dataUser.userName = String(username).trim().toLowerCase();
        if (password) dataUser.password = await bcrypt.hash(password, 10);
        if (Object.keys(dataUser).length) {
          await prisma.user.update({ where: { id: userIdLinked }, data: dataUser });
        }
      }
    }
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


