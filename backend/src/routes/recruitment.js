const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all candidates
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: {
        appliedDate: 'desc'
      }
    });

    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
router.get('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Create new candidate
router.post('/candidates', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      position, 
      experience, 
      education, 
      skills, 
      status,
      resumeUrl,
      interviewDate,
      notes 
    } = req.body;
    
    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        position,
        experience: parseInt(experience),
        education,
        skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
        status: status || 'Applied',
        resumeUrl,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        notes
      }
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create candidate' });
    }
  }
});

// Update candidate
router.put('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      position, 
      experience, 
      education, 
      skills, 
      status,
      resumeUrl,
      interviewDate,
      notes 
    } = req.body;
    
    const candidate = await prisma.candidate.update({
      where: { id: parseInt(id) },
      data: {
        firstName,
        lastName,
        email,
        phone,
        position,
        experience: parseInt(experience),
        education,
        skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
        status,
        resumeUrl,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        notes
      }
    });

    res.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update candidate' });
    }
  }
});

// Delete candidate
router.delete('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.candidate.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// Update candidate status
router.patch('/candidates/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interviewDate, notes } = req.body;
    
    const candidate = await prisma.candidate.update({
      where: { id: parseInt(id) },
      data: {
        status,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        notes
      }
    });

    res.json(candidate);
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ error: 'Failed to update candidate status' });
  }
});

// Get candidates by status
router.get('/candidates/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const candidates = await prisma.candidate.findMany({
      where: { status },
      orderBy: {
        appliedDate: 'desc'
      }
    });

    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates by status:', error);
    res.status(500).json({ error: 'Failed to fetch candidates by status' });
  }
});

// Search candidates
router.get('/candidates/search', async (req, res) => {
  try {
    const { q, position, status } = req.query;
    
    let whereClause = {};
    
    if (q) {
      whereClause.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } }
      ];
    }
    
    if (position) {
      whereClause.position = { contains: position, mode: 'insensitive' };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      orderBy: {
        appliedDate: 'desc'
      }
    });

    res.json(candidates);
  } catch (error) {
    console.error('Error searching candidates:', error);
    res.status(500).json({ error: 'Failed to search candidates' });
  }
});

module.exports = router;
