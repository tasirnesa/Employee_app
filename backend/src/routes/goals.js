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

// Create goal
router.post('/', async (req, res) => {
  try {
    const tokenUserId = req.user?.id; // if auth middleware adds user
    const {
      objective,
      keyResult,
      priority,
      status,
      progress,
      duedate,
      category,
      activatedBy,
    } = req.body || {};

    if (!objective) return res.status(400).json({ error: 'objective is required' });

    // Compute progress as TOTAL of keyResult percentages (capped to 100) if not provided
    let computedProgress = progress;
    if ((computedProgress == null || Number.isNaN(Number(computedProgress))) && Array.isArray(keyResult)) {
      const krWithPerc = keyResult.filter((kr) => kr && typeof kr === 'object' && kr.progress != null);
      if (krWithPerc.length) {
        const total = Math.round(
          krWithPerc.reduce((sum, kr) => sum + Math.max(0, Math.min(100, Number(kr.progress) || 0)), 0)
        );
        computedProgress = Math.min(100, total);
      }
    }

    const created = await prisma.goal.create({
      data: {
        objective,
        keyResult: keyResult ?? [],
        priority: priority || null,
        status: status || null,
        progress: computedProgress != null ? Math.max(0, Math.min(100, Number(computedProgress))) : 0,
        duedate: duedate ? new Date(duedate) : null,
        category: category || null,
        activatedBy: activatedBy ? parseInt(activatedBy) : tokenUserId || null,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update goal fully/partially
router.put('/:gid', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid);
    if (Number.isNaN(gid)) return res.status(400).json({ error: 'Invalid gid' });
    const {
      objective,
      keyResult,
      priority,
      status,
      progress,
      duedate,
      category,
    } = req.body || {};

    let data = {};
    if (objective != null) data.objective = objective;
    if (keyResult != null) data.keyResult = keyResult;
    if (priority != null) data.priority = priority;
    if (status != null) data.status = status;
    if (category != null) data.category = category;
    if (duedate != null) data.duedate = duedate ? new Date(duedate) : null;

    // Derive progress as TOTAL from keyResult if not explicitly provided but keyResult provided
    let nextProgress = progress;
    if (nextProgress == null && Array.isArray(keyResult)) {
      const krWithPerc = keyResult.filter((kr) => kr && typeof kr === 'object' && kr.progress != null);
      if (krWithPerc.length) {
        const total = Math.round(
          krWithPerc.reduce((sum, kr) => sum + Math.max(0, Math.min(100, Number(kr.progress) || 0)), 0)
        );
        nextProgress = Math.min(100, total);
      }
    }
    if (nextProgress != null) data.progress = Math.max(0, Math.min(100, Number(nextProgress)));

    const updated = await prisma.goal.update({ where: { gid }, data });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete goal
router.delete('/:gid', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid);
    if (Number.isNaN(gid)) return res.status(400).json({ error: 'Invalid gid' });
    await prisma.goal.delete({ where: { gid } });
    res.status(204).end();
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


