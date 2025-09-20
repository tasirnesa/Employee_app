const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma/client');

router.get('/', async (req, res) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        evaluator: { select: { fullName: true } },
        evaluatee: { select: { fullName: true } },
      },
    });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;


