const payrollService = require('../../../src/services/payrollService');
const payrollRepository = require('../../../src/repositories/payrollRepository');
const userRepository = require('../../../src/repositories/userRepository');
const prisma = require('../../../src/config/prisma');
const fs = require('fs');

jest.mock('../../../src/repositories/payrollRepository');
jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/config/prisma', () => ({
  timesheet: { findMany: jest.fn() },
  leave: { findMany: jest.fn() },
  benefit: { findMany: jest.fn() },
  perk: { findMany: jest.fn() },
  attendance: { findMany: jest.fn() },
}));
jest.mock('fs');

describe('payrollService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPayslips', () => {
    it('should call payrollRepository.findAllPayslips with correct filter', async () => {
      const mockPayslips = [{ id: 1, amount: 1000 }];
      payrollRepository.findAllPayslips.mockResolvedValue(mockPayslips);

      const result = await payrollService.getPayslips(123);

      expect(payrollRepository.findAllPayslips).toHaveBeenCalledWith({ employeeId: 123 });
      expect(result).toEqual(mockPayslips);
    });

    it('should call payrollRepository.findAllPayslips with empty filter if no ID provided', async () => {
      await payrollService.getPayslips();
      expect(payrollRepository.findAllPayslips).toHaveBeenCalledWith({});
    });
  });

  describe('createManualPayslip', () => {
    it('should throw error if employee does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(payrollService.createManualPayslip({ employeeId: 999 }))
        .rejects.toThrow('Employee not found');
    });

    it('should calculate net salary correctly and create payslip', async () => {
      userRepository.findById.mockResolvedValue({ id: 1 });
      const data = {
        employeeId: 1,
        period: '2024-01',
        basicSalary: 5000,
        allowances: 1000,
        deductions: 500,
        status: 'Generated'
      };
      payrollRepository.createPayslip.mockResolvedValue({ id: 10, ...data, netSalary: 5500 });

      const result = await payrollService.createManualPayslip(data);

      expect(payrollRepository.createPayslip).toHaveBeenCalledWith({
        employeeId: 1,
        period: '2024-01',
        basicSalary: 5000,
        allowances: 1000,
        deductions: 500,
        netSalary: 5500,
        status: 'Generated'
      });
      expect(result.netSalary).toBe(5500);
    });
  });

  describe('_calculatePayrollDetails', () => {
    it('should calculate payroll components correctly', async () => {
      // Mock components that _calculatePayrollDetails uses internally
      // Note: Since they are private/internal methods of the same object, 
      // we might need to spy on them or mock their dependencies.
      
      // Mock dependencies of internal helpers
      prisma.timesheet.findMany.mockResolvedValue([{ hoursWorked: 160, overtimeHours: 10 }]);
      prisma.leave.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.benefit.findMany.mockResolvedValue([{ employeeContribution: 100, companyContribution: 200 }]);
      prisma.perk.findMany.mockResolvedValue([{ value: 50 }]);

      const comp = {
        basicSalary: 4000,
        allowances: 500,
        bonus: 200,
        overtimeMultiplier: 1.5,
        pensionEmployeePct: 0.07,
        taxFixed: 300,
        insuranceEmployeeFixed: 50,
        otherDeductionsFixed: 20
      };
      
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 31);

      const result = await payrollService._calculatePayrollDetails(1, comp, start, end);

      // Business days in Jan 2024: 23
      // hourly = 4000 / (23 * 8) = 21.739
      // overtimePay = 10 * (21.739 * 1.5) = 326.086
      // gross = 4000 + 500 + 200 + 326.086 + 50 = 5076.086
      // pension = 4000 * 0.07 = 280
      // deductions = 280 + 300 + 50 + 20 + 100 = 750
      // net = 5076.086 - 750 = 4326.086

      expect(result.basicSalary).toBe(4000);
      expect(result.grossEarnings).toBeCloseTo(5076.086);
      expect(result.deductions).toBe(750);
      expect(result.netSalary).toBeCloseTo(4326.086);
    });
  });
});
