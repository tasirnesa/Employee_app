const attendanceService = require('../../../src/services/attendanceService');
const attendanceRepository = require('../../../src/repositories/attendanceRepository');
const leaveRepository = require('../../../src/repositories/leaveRepository');

jest.mock('../../../src/repositories/attendanceRepository');
jest.mock('../../../src/repositories/leaveRepository');

describe('attendanceService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should calculate summary correctly', async () => {
      const mockRecords = [
        { status: 'present', hoursWorked: 8 },
        { status: 'present', hoursWorked: 8 },
        { status: 'absent', hoursWorked: 0 },
        { status: 'late', hoursWorked: 7 },
        { status: 'half-day', hoursWorked: 4 },
      ];
      attendanceRepository.findAll.mockResolvedValue(mockRecords);

      const result = await attendanceService.getSummary(1);

      expect(result.totalDays).toBe(5);
      expect(result.presentDays).toBe(2);
      expect(result.absentDays).toBe(1);
      expect(result.lateDays).toBe(1);
      expect(result.halfDays).toBe(1);
      expect(result.totalHours).toBe(27);
    });
  });

  describe('checkIn', () => {
    it('should throw error if already checked in today', async () => {
      attendanceRepository.findLatestRecord.mockResolvedValue({ checkInTime: new Date() });

      await expect(attendanceService.checkIn(1))
        .rejects.toThrow('Already checked in today');
    });

    it('should create a new attendance record if not checked in', async () => {
      attendanceRepository.findLatestRecord.mockResolvedValue(null);
      const mockCreated = { id: 101, employeeId: 1, status: 'present' };
      attendanceRepository.create.mockResolvedValue(mockCreated);

      const result = await attendanceService.checkIn(1);

      expect(result).toEqual(mockCreated);
      expect(attendanceRepository.create).toHaveBeenCalled();
    });
  });

  describe('checkOut', () => {
    it('should throw error if no check-in record found', async () => {
      attendanceRepository.findLatestRecord.mockResolvedValue(null);

      await expect(attendanceService.checkOut(1))
        .rejects.toThrow('No check-in record found for today');
    });

    it('should update record with check-out time and calculated hours', async () => {
      const checkInTime = new Date();
      checkInTime.setHours(checkInTime.getHours() - 8);
      
      attendanceRepository.findLatestRecord.mockResolvedValue({ id: 50, checkInTime });
      attendanceRepository.update.mockImplementation((id, data) => Promise.resolve({ id, ...data }));

      const result = await attendanceService.checkOut(1);

      expect(result.hoursWorked).toBeCloseTo(8, 1);
      expect(attendanceRepository.update).toHaveBeenCalled();
    });
  });

  describe('manualPulse', () => {
    it('should throw error if on approved leave', async () => {
      const date = '2024-05-20';
      leaveRepository.findOverlapping.mockResolvedValue([
        { status: 'Approved', leaveType: { name: 'Annual' } }
      ]);

      await expect(attendanceService.manualPulse({ employeeId: 1, date }))
        .rejects.toThrow('On leave: Annual');
    });

    it('should create record if not on leave', async () => {
      const date = '2024-05-20';
      leaveRepository.findOverlapping.mockResolvedValue([]);
      attendanceRepository.create.mockResolvedValue({ id: 200 });

      const result = await attendanceService.manualPulse({ employeeId: 1, date, status: 'present' });

      expect(result.id).toBe(200);
      expect(attendanceRepository.create).toHaveBeenCalled();
    });
  });
});
