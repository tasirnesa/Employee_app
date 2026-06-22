const attendanceRepository = require('../repositories/attendanceRepository');
const leaveRepository = require('../repositories/leaveRepository');
const communicationService = require('./communicationService');
const employeeRepository = require('../repositories/employeeRepository');

const _checkIfOnLeave = async (employeeId, date) => {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const overlappingLeaves = await leaveRepository.findOverlapping(employeeId, attendanceDate, attendanceDate) || [];
  const approvedLeave = overlappingLeaves.find(l => l.status === 'Approved');
  
  if (approvedLeave) {
    throw new Error(`Cannot mark attendance: Employee is on approved ${approvedLeave.leaveType.name}${approvedLeave.isHalfDay ? ` (${approvedLeave.halfDayPeriod})` : ''} on this date.`);
  }
};

const attendanceService = {
  getAttendanceForEmployee: async (employeeId) => {
    return await attendanceRepository.findAll({ employeeId: parseInt(employeeId) });
  },

  getAllAttendance: async (startDate, endDate) => {
    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    return await attendanceRepository.findAll(where);
  },

  getSummary: async (employeeId) => {
    const records = await attendanceRepository.findAll({ employeeId: parseInt(employeeId) });
    return {
      employeeId: parseInt(employeeId),
      totalDays: records.length,
      presentDays: records.filter(r => r.status === 'present').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      onLeaveDays: records.filter(r => r.status === 'on-leave').length,
      lateDays: records.filter(r => r.status === 'late').length,
      halfDays: records.filter(r => r.status === 'half-day').length,
      totalHours: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
    };
  },

  checkIn: async (employeeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if employee is on approved leave
    await _checkIfOnLeave(employeeId, today);

    const existing = await attendanceRepository.findLatestRecord(employeeId, today);
    if (existing && existing.checkInTime) {
      throw new Error('Already checked in today');
    }

    return await attendanceRepository.create({
      employeeId: parseInt(employeeId),
      date: today,
      checkInTime: new Date(),
      status: 'present',
    });
  },

  checkOut: async (employeeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await attendanceRepository.findLatestRecord(employeeId, today, null);
    if (!record) {
      throw new Error('No check-in record found for today');
    }

    const checkInTime = new Date(record.checkInTime);
    const checkOutTime = new Date();
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    return await attendanceRepository.update(record.id, {
      checkOutTime,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
    });
  },

  manualPulse: async (data) => {
    if (!data.employeeId || !data.date) {
      throw new Error('Missing required fields: employeeId and date');
    }

    const attendanceDate = new Date(data.date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if employee is on approved leave
    await _checkIfOnLeave(data.employeeId, attendanceDate);

    const record = await attendanceRepository.create({
      employeeId: parseInt(data.employeeId),
      date: new Date(data.date),
      checkInTime: data.checkInTime ? new Date(`${data.date}T${data.checkInTime}:00`) : null,
      checkOutTime: data.checkOutTime ? new Date(`${data.date}T${data.checkOutTime}:00`) : null,
      hoursWorked: data.hoursWorked ? parseFloat(data.hoursWorked) : null,
      status: data.status,
      timeType: data.timeType,
      notes: data.notes,
    });

    // Notify Employee of manual attendance entry
    try {
      if (data.status === 'absent' || data.status === 'late' || data.status === 'half-day' || data.status === 'on-leave') {
        await communicationService.notify(
          data.employeeId,
          'New Attendance Record',
          `A manual attendance record for ${new Date(data.date).toLocaleDateString()} has been created and marked as ${data.status.toUpperCase()}.`,
          (data.status === 'absent' || data.status === 'late') ? 'WARNING' : 'INFO',
          '/attendance'
        );
      }
    } catch (e) {
      console.warn('Failed to notify employee of manual attendance pulse', e.message);
    }

    return record;
  },

  updateAttendance: async (id, data) => {
    const targetId = data.employeeId ? parseInt(data.employeeId) : (await attendanceRepository.findById(id))?.employeeId;
    const targetDate = data.date ? new Date(data.date) : (await attendanceRepository.findById(id))?.date;
    
    if (targetId && targetDate) {
      await _checkIfOnLeave(targetId, targetDate);
    }

    let hoursWorked = data.hoursWorked;
    if (data.checkInTime && data.checkOutTime) {
      const checkInTime = new Date(data.checkInTime);
      const checkOutTime = new Date(data.checkOutTime);
      hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      hoursWorked = parseFloat(hoursWorked.toFixed(2));
    }

    const updatedRecord = await attendanceRepository.update(id, {
      employeeId: data.employeeId ? parseInt(data.employeeId) : undefined,
      date: data.date ? new Date(data.date) : undefined,
      checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
      checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
      hoursWorked,
      status: data.status,
      timeType: data.timeType,
      notes: data.notes,
    });

    // Notify Employee of attendance update
    try {
      if (data.status === 'absent' || data.status === 'late' || data.status === 'half-day' || data.status === 'on-leave') {
        await communicationService.notify(
          targetId,
          'Attendance Status Updated',
          `Your attendance for ${new Date(targetDate).toLocaleDateString()} has been marked as ${data.status.toUpperCase()}.`,
          (data.status === 'absent' || data.status === 'late') ? 'WARNING' : 'INFO',
          '/attendance'
        );
      }
    } catch (e) {
      console.warn('Failed to notify employee of attendance update', e.message);
    }

    return updatedRecord;
  },

  deleteAttendance: async (id) => {
    return await attendanceRepository.delete(id);
  },
};

module.exports = attendanceService;
