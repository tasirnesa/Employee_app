const express = require('express');
const { prisma } = require('../prisma/client');

const router = express.Router();

// GET /api/criteria
router.get('/', async (req, res) => {
  try {
    const criteria = await prisma.evaluationCriteria.findMany({
      include: { creator: { select: { fullName: true } } },
      orderBy: { criteriaID: 'desc' },
    });
    const enriched = criteria.map(c => ({
      ...c,
      creatorName: c.creator?.fullName || null,
    }));
    res.json(enriched);
  } catch (error) {
    console.error('Fetch criteria error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/criteria (single)
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    const created = await prisma.evaluationCriteria.create({
      data: {
        title: String(title).trim(),
        description: description == null || String(description).trim() === '' ? null : String(description),
        createdDate: new Date(),
        createdBy: req.user?.id || 1,
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    console.error('Create criteria error:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to create criteria', details: error.message });
  }
});

// POST /api/criteria/bulk (array)
router.post('/bulk', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      return res.status(400).json({ error: 'Request body must be a non-empty array' });
    }
    const now = new Date();
    const payload = items
      .map((it) => ({
        title: it.title,
        description: it.description,
      }))
      .filter((it) => it.title && String(it.title).trim() !== '')
      .map((it) => ({
        title: String(it.title).trim(),
        description: it.description == null || String(it.description).trim() === '' ? null : String(it.description),
        createdDate: now,
        createdBy: req.user?.id || 1,
      }));

    if (!payload.length) {
      return res.status(400).json({ error: 'No valid criteria in payload' });
    }

    const result = await prisma.evaluationCriteria.createMany({ data: payload });
    return res.status(201).json({ count: result.count });
  } catch (error) {
    console.error('Bulk create criteria error:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to create criteria in bulk', details: error.message });
  }
});

module.exports = router;


