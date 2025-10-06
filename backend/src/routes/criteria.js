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

// GET /api/criteria/:id
router.get('/:id', async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id);
    if (isNaN(criteriaId)) {
      return res.status(400).json({ error: 'Invalid criteria ID' });
    }

    const criteria = await prisma.evaluationCriteria.findUnique({
      where: { criteriaID: criteriaId },
      include: { creator: { select: { fullName: true } } },
    });

    if (!criteria) {
      return res.status(404).json({ error: 'Criteria not found' });
    }

    const enriched = {
      ...criteria,
      creatorName: criteria.creator?.fullName || null,
    };

    res.json(enriched);
  } catch (error) {
    console.error('Fetch criteria detail error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// PUT /api/criteria/:id
router.put('/:id', async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id);
    if (isNaN(criteriaId)) {
      return res.status(400).json({ error: 'Invalid criteria ID' });
    }

    const { title, description } = req.body || {};
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if criteria exists
    const existingCriteria = await prisma.evaluationCriteria.findUnique({
      where: { criteriaID: criteriaId },
    });

    if (!existingCriteria) {
      return res.status(404).json({ error: 'Criteria not found' });
    }

    const updated = await prisma.evaluationCriteria.update({
      where: { criteriaID: criteriaId },
      data: {
        title: String(title).trim(),
        description: description == null || String(description).trim() === '' ? null : String(description),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update criteria error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update criteria', details: error.message });
  }
});

// DELETE /api/criteria/:id
router.delete('/:id', async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id);
    if (isNaN(criteriaId)) {
      return res.status(400).json({ error: 'Invalid criteria ID' });
    }

    // Check if criteria exists
    const existingCriteria = await prisma.evaluationCriteria.findUnique({
      where: { criteriaID: criteriaId },
    });

    if (!existingCriteria) {
      return res.status(404).json({ error: 'Criteria not found' });
    }

    // Check if criteria is being used in any evaluations
    const evaluationCount = await prisma.evaluation.count({
      where: {
        OR: [
          { criteriaID: criteriaId },
          { criteriaIDs: { has: criteriaId } }
        ]
      }
    });

    if (evaluationCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete criteria that is being used in evaluations',
        evaluationCount 
      });
    }

    await prisma.evaluationCriteria.delete({
      where: { criteriaID: criteriaId },
    });

    res.json({ message: 'Criteria deleted successfully' });
  } catch (error) {
    console.error('Delete criteria error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete criteria', details: error.message });
  }
});

// POST /api/criteria/:id/authorize
router.post('/:id/authorize', async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id);
    if (isNaN(criteriaId)) {
      return res.status(400).json({ error: 'Invalid criteria ID' });
    }

    // Check if criteria exists
    const existingCriteria = await prisma.evaluationCriteria.findUnique({
      where: { criteriaID: criteriaId },
    });

    if (!existingCriteria) {
      return res.status(404).json({ error: 'Criteria not found' });
    }

    // Check if user has authorization permissions (you can customize this logic)
    const userRole = req.user?.role;
    if (userRole && userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions to authorize criteria' });
    }

    // Update criteria with authorization status
    const updated = await prisma.evaluationCriteria.update({
      where: { criteriaID: criteriaId },
      data: {
        isAuthorized: true,
        authorizedBy: req.user?.id,
        authorizedDate: new Date(),
      },
    });

    res.json({ 
      message: 'Criteria authorized successfully',
      criteria: updated 
    });
  } catch (error) {
    console.error('Authorize criteria error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to authorize criteria', details: error.message });
  }
});

module.exports = router;


