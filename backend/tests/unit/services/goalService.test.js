const goalService = require('../../../src/services/goalService');
const goalRepository = require('../../../src/repositories/goalRepository');
const prisma = require('../../../src/config/prisma');

jest.mock('../../../src/repositories/goalRepository');
jest.mock('../../../src/config/prisma', () => ({
  notification: { create: jest.fn() },
}));

describe('goalService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should throw error if objective is missing', async () => {
      await expect(goalService.createGoal({}))
        .rejects.toThrow('objective is required');
    });

    it('should calculate average progress from keyResults if progress is null', async () => {
      const data = {
        objective: 'Test Goal',
        keyResult: [
          { title: 'KR1', progress: 50 },
          { title: 'KR2', progress: 100 }
        ]
      };
      goalRepository.create.mockImplementation((d) => Promise.resolve({ id: 1, ...d }));

      const result = await goalService.createGoal(data, 123);

      expect(result.progress).toBe(75);
      expect(goalRepository.create).toHaveBeenCalled();
    });

    it('should notify assigned user if activatedBy is present', async () => {
      const data = { objective: 'Test Goal', activatedBy: 456 };
      goalRepository.create.mockResolvedValue({ id: 1, ...data });
      prisma.notification.create.mockResolvedValue({});

      await goalService.createGoal(data, 123);

      expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ userId: 456 })
      }));
    });
  });

  describe('recordKeyResultProgress', () => {
    it('should update goal and create progress log within transaction', async () => {
      const goalId = 1;
      const keyIndex = 0;
      const progress = 80;
      const notedById = 123;

      const mockGoal = {
        gid: goalId,
        keyResult: [{ title: 'KR1', progress: 0 }],
        progress: 0
      };

      const mockTx = {
        goal: {
          findUnique: jest.fn().mockResolvedValue(mockGoal),
          update: jest.fn().mockImplementation((d) => Promise.resolve({ gid: goalId, ...d.data })),
        },
        keyResultProgress: {
          create: jest.fn().mockResolvedValue({ id: 999 }),
        }
      };

      goalRepository.executeTransaction.mockImplementation(async (cb) => {
        return await cb(mockTx);
      });

      const result = await goalService.recordKeyResultProgress(goalId, keyIndex, progress, notedById);

      expect(result.updatedGoal.progress).toBe(80);
      expect(result.updatedGoal.keyResult[0].progress).toBe(80);
      expect(mockTx.keyResultProgress.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { goalId: 1, keyIndex: 0, progress: 80, notedBy: 123 }
      }));
    });
  });

  describe('_calculateAverageProgress', () => {
    it('should return 0 for empty array', () => {
      expect(goalService._calculateAverageProgress([])).toBe(0);
    });

    it('should return 100 if all KRs are 100', () => {
      expect(goalService._calculateAverageProgress([{ progress: 100 }, { progress: 100 }])).toBe(100);
    });

    it('should return 50 if one is 0 and one is 100', () => {
      expect(goalService._calculateAverageProgress([{ progress: 0 }, { progress: 100 }])).toBe(50);
    });
  });
});
