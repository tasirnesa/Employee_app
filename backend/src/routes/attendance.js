const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get attendance records for an employee
router.get('/employee/:employeeId', async (req, res) => {
  
  try {
    const { employeeId } = req.params;
    const records = await prisma.attendance.findMany({
      where: {
        employeeId: parseInt(employeeId),
      },
      orderBy: {
        date: 'desc',
      },
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const records = await prisma.attendance.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

router.get('/summary/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const records = await prisma.attendance.findMany({
      where: {
        employeeId: parseInt(employeeId),
      },
    });
    
    const summary = {
      employeeId: parseInt(employeeId),
      totalDays: records.length,
      presentDays: records.filter(r => r.status === 'present').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      lateDays: records.filter(r => r.status === 'late').length,
      halfDays: records.filter(r => r.status === 'half-day').length,
      totalHours: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

router.post('/check-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: today,
        checkInTime: {
          not: null,
        },
      },
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    
    const record = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        date: today,
        checkInTime: new Date(),
        status: 'present',
      },
    });
    
    res.json(record);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

router.post('/check-out', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const record = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: today,
        checkInTime: {
          not: null,
        },
        checkOutTime: null,
      },
    });
    
    if (!record) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }
    
    const checkInTime = new Date(record.checkInTime);
    const checkOutTime = new Date();
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    const updatedRecord = await prisma.attendance.update({
      where: {
        id: record.id,
      },
      data: {
        checkOutTime: checkOutTime,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      },
    });
    
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ error: 'Failed to check out' });
  }
});

// Add attendance record
router.post('/', async (req, res) => {
  console.log('POST /api/attendance called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  try {
    const data = req.body;
    console.log('Processing data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.employeeId || !data.date) {
      console.log('Missing required fields:', { employeeId: data.employeeId, date: data.date });
      return res.status(400).json({ error: 'Missing required fields: employeeId and date' });
    }
    
    const record = await prisma.attendance.create({
      data: {
        employeeId: parseInt(data.employeeId),
        date: new Date(data.date),
        checkInTime: data.checkInTime ? new Date(`${data.date}T${data.checkInTime}:00`) : null,
        checkOutTime: data.checkOutTime ? new Date(`${data.date}T${data.checkOutTime}:00`) : null,
        hoursWorked: data.hoursWorked ? parseFloat(data.hoursWorked) : null,
        status: data.status,
        timeType: data.timeType,
        notes: data.notes,
      },
    });
    console.log('Attendance record created:', JSON.stringify(record, null, 2));
    res.json(record);
  } catch (error) {
    console.error('Error adding attendance record:', error);
    res.status(500).json({ error: 'Failed to add attendance record', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
  
    let hoursWorked = data.hoursWorked;
    if (data.checkInTime && data.checkOutTime) {
      const checkInTime = new Date(data.checkInTime);
      const checkOutTime = new Date(data.checkOutTime);
      hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      hoursWorked = parseFloat(hoursWorked.toFixed(2));
    }
    
    const record = await prisma.attendance.update({
      where: {
        id: parseInt(id),
      },
      data: {
        employeeId: data.employeeId ? parseInt(data.employeeId) : undefined,
        date: data.date ? new Date(data.date) : undefined,
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
        hoursWorked: hoursWorked,
        status: data.status,
        timeType: data.timeType,
        notes: data.notes,
      },
    });
    res.json(record);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

module.exports = router;