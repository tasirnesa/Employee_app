const express = require('express');
const bcrypt = require('bcrypt');
const { prisma } = require('../prisma/client');

const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

    const {
      fullName,
      userName,
      password,
      gender,
      age,
      role,
      status,
      locked,
      isFirstLogin,
      activeStatus,
    } = req.body || {};

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (userName !== undefined) updateData.userName = userName;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age == null ? null : parseInt(age);
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = String(status);
    if (locked !== undefined) updateData.locked = String(locked);
    if (isFirstLogin !== undefined) updateData.isFirstLogin = String(isFirstLogin);
    if (activeStatus !== undefined) updateData.activeStatus = String(activeStatus);

    const updated = await prisma.user.update({ where: { id }, data: updateData });
    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// PUT /api/users/:id/authorize
router.put('/:id/authorize', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: 'true',
        activeStatus: 'true',
        locked: 'false',
        isFirstLogin: 'false',
      },
    });
    res.json({ message: 'User authorized', user: updated });
  } catch (error) {
    console.error('Authorize user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;


