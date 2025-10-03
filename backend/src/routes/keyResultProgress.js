const express = require('express');
const { prisma } = require('../prisma/client');

const router = express.Router();

// List progress logs for a goal
router.get('/:goalId', async (req, res) => {
  try {
    const gid = parseInt(req.params.goalId);
    if (Number.isNaN(gid)) return res.status(400).json({ error: 'Invalid goalId' });
    const [goal, logs] = await Promise.all([
      prisma.goal.findUnique({ where: { gid } }),
      prisma.keyResultProgress.findMany({ where: { goalId: gid }, orderBy: [{ keyIndex: 'asc' }, { notedAt: 'desc' }] }),
    ]);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json({ goal, logs });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Record progress for a single key result and roll up to goal progress
router.post('/', async (req, res) => {
  try {
    const { goalId, keyIndex, progress } = req.body || {};

    const gid = parseInt(goalId);
    const idx = parseInt(keyIndex);
    const pct = Math.max(0, Math.min(100, Number(progress)));
    // Always trust the authenticated user for notedBy to avoid FK issues
    const notedById = parseInt(req.user?.id);

    if (Number.isNaN(gid)) return res.status(400).json({ error: 'Invalid goalId' });
    if (Number.isNaN(idx)) return res.status(400).json({ error: 'Invalid keyIndex' });
    if (Number.isNaN(pct)) return res.status(400).json({ error: 'Invalid progress' });
    if (Number.isNaN(notedById)) return res.status(400).json({ error: 'Invalid notedBy' });

    const result = await prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findUnique({ where: { gid } });
      if (!goal) {
        const err = new Error('Goal not found');
        err.status = 404;
        throw err;
      }

      const keyResultArray = Array.isArray(goal.keyResult)
        ? [...goal.keyResult]
        : goal.keyResult == null
          ? []
          : [goal.keyResult];

      if (!Array.isArray(keyResultArray)) {
        // Normalize to an array if somehow not an array
        keyResultArray = [];
      }
      if (idx < 0) {
        const err = new Error('keyIndex must be >= 0');
        err.status = 400;
        throw err;
      }
      // Auto-extend the array with placeholder KRs if needed
      while (keyResultArray.length <= idx) {
        keyResultArray.push({ title: '', progress: 0 });
      }

      // Normalize entry to object with title/progress
      const existing = keyResultArray[idx];
      let nextEntry;
      if (existing && typeof existing === 'object') {
        nextEntry = { ...existing, progress: pct };
      } else {
        nextEntry = { title: existing || '', progress: pct };
      }
      keyResultArray[idx] = nextEntry;

      // Compute rolled up objective progress as AVERAGE of KR progresses (0 for missing), 0..100
      const values = keyResultArray.map((kr) => {
        if (kr && typeof kr === 'object' && kr.progress != null) {
          return Math.max(0, Math.min(100, Number(kr.progress) || 0));
        }
        return 0;
      });
      const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
      const rolledUp = Math.max(0, Math.min(100, avg));

      const updatedGoal = await tx.goal.update({
        where: { gid },
        data: { keyResult: keyResultArray, progress: rolledUp },
      });

      const log = await tx.keyResultProgress.create({
        data: {
          goalId: gid,
          keyIndex: idx,
          progress: pct,
          notedBy: notedById,
        },
      });

      return { updatedGoal, log };
    });

    res.status(201).json(result);
  } catch (error) {
    // Map common errors
    const status = error && error.status ? error.status : 500;
    const message = (error && error.message) || 'Server error';
    if (message.includes('Foreign key') || message.includes('violates foreign key')) {
      return res.status(400).json({ error: 'Invalid notedBy or goal relation' });
    }
    res.status(status).json({ error: status === 500 ? 'Server error' : 'Bad request', details: message });
  }
});

module.exports = router;


