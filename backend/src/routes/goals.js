const express = require('express');
const { prisma } = require('../prisma/client');

const router = express.Router();

// List goals; if userId provided, filter by that user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { activatedBy: parseInt(userId) } : {};
    const goals = await prisma.goal.findMany({ where, orderBy: { gid: 'desc' } });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update goal progress (0..100)
router.patch('/:gid/progress', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid);
    const { progress } = req.body || {};
    if (Number.isNaN(gid)) return res.status(400).json({ error: 'Invalid gid' });
    if (progress == null || Number.isNaN(Number(progress))) return res.status(400).json({ error: 'progress is required (0..100)' });
    const updated = await prisma.goal.update({ where: { gid }, data: { progress: Math.max(0, Math.min(100, Number(progress))) } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;


