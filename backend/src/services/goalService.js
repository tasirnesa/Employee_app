const goalRepository = require('../repositories/goalRepository');
const prisma = require('../config/prisma'); // still needed for tx if not fully encapsulated

const goalService = {
  getGoals: async (userId = null) => {
    const where = userId ? { activatedBy: parseInt(userId) } : {};
    return await goalRepository.findAll(where);
  },

  getGoalWithLogs: async (goalId) => {
    const [goal, logs] = await Promise.all([
      goalRepository.findById(goalId),
      goalRepository.findProgressLogs(goalId)
    ]);
    if (!goal) return null;
    return { goal, logs };
  },

  createGoal: async (data, tokenUserId) => {
    if (!data.objective) throw new Error('objective is required');
    
    let computedProgress = data.progress;
    if ((computedProgress == null || isNaN(Number(computedProgress))) && Array.isArray(data.keyResult)) {
      computedProgress = goalService._calculateAverageProgress(data.keyResult);
    }

    const created = await goalRepository.create({
      ...data,
      keyResult: data.keyResult ?? [],
      progress: computedProgress != null ? Math.max(0, Math.min(100, Number(computedProgress))) : 0,
      duedate: data.duedate ? new Date(data.duedate) : null,
      activatedBy: data.activatedBy ? parseInt(data.activatedBy) : tokenUserId || null,
    });

    if (created.activatedBy) {
      await goalService._notifyAssignedUser(created);
    }

    return created;
  },

  updateGoal: async (gid, data) => {
    const updateData = { ...data };
    if (data.duedate !== undefined) updateData.duedate = data.duedate ? new Date(data.duedate) : null;

    if (data.progress == null && Array.isArray(data.keyResult)) {
      updateData.progress = goalService._calculateAverageProgress(data.keyResult);
    }
    if (updateData.progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, Number(updateData.progress)));
    }

    return await goalRepository.update(gid, updateData);
  },

  deleteGoal: async (gid) => {
    return await goalRepository.delete(gid);
  },

  recordKeyResultProgress: async (goalId, keyIndex, progress, notedById) => {
    const gid = parseInt(goalId);
    const idx = parseInt(keyIndex);
    const pct = Math.max(0, Math.min(100, Number(progress)));

    return await goalRepository.executeTransaction(async (tx) => {
      const goal = await tx.goal.findUnique({ where: { gid } });
      if (!goal) {
        const err = new Error('Goal not found');
        err.status = 404;
        throw err;
      }

      let keyResultArray = Array.isArray(goal.keyResult) ? [...goal.keyResult] : [];
      while (keyResultArray.length <= idx) {
        keyResultArray.push({ title: '', progress: 0 });
      }

      const existing = keyResultArray[idx];
      keyResultArray[idx] = (existing && typeof existing === 'object') 
        ? { ...existing, progress: pct } 
        : { title: existing || '', progress: pct };

      const rolledUp = goalService._calculateAverageProgress(keyResultArray);

      const updatedGoal = await tx.goal.update({
        where: { gid },
        data: { keyResult: keyResultArray, progress: rolledUp },
      });

      const log = await tx.keyResultProgress.create({
        data: { goalId: gid, keyIndex: idx, progress: pct, notedBy: notedById },
      });

      return { updatedGoal, log };
    });
  },

  // --- Helpers ---
  _calculateAverageProgress: (keyResultArray) => {
    const values = keyResultArray.map((kr) => {
      if (kr && typeof kr === 'object' && kr.progress != null) {
        return Math.max(0, Math.min(100, Number(kr.progress) || 0));
      }
      return 0;
    });
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  },

  _notifyAssignedUser: async (goal) => {
    try {
      await prisma.notification.create({
        data: {
          userId: goal.activatedBy,
          title: 'New Goal Assigned',
          message: `A new goal has been assigned to you: "${goal.objective}".`,
          type: 'INFO',
          link: '/goals'
        }
      });
    } catch (err) {
      console.warn('Notification failed:', err.message);
    }
  }
};

module.exports = goalService;
