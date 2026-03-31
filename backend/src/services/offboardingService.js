const offboardingRepository = require('../repositories/offboardingRepository');
const employeeRepository = require('../repositories/employeeRepository');

const offboardingService = {
  getOffboardingList: async (where) => {
    return await offboardingRepository.findAll(where);
  },

  getOffboardingDetails: async (id) => {
    const offboarding = await offboardingRepository.findById(id);
    if (!offboarding) throw new Error('Offboarding record not found');
    return offboarding;
  },

  initiateOffboarding: async (data) => {
    const { employeeId, ...offboardingData } = data;
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const existing = await offboardingRepository.findByEmployeeId(employeeId);
    if (existing && existing.status !== 'Cancelled') {
      throw new Error('Offboarding already initiated for this employee');
    }

    const defaultTasks = [
      { title: 'Asset Return', description: 'Collect laptop, phone, keys, etc.' },
      { title: 'Access Revocation', description: 'Revoke email, VPN, and system access.' },
      { title: 'ID Badge Collection', description: 'Collect physical security badge.' },
      { title: 'Exit Interview', description: 'Conduct and document the exit interview.' }
    ];

    return await offboardingRepository.create(
      { ...offboardingData, employeeId: parseInt(employeeId), status: 'InProgress' },
      defaultTasks
    );
  },

  updateOffboarding: async (id, data) => {
    return await offboardingRepository.update(id, data);
  },

  completeTask: async (taskId, userId) => {
    const task = await offboardingRepository.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    return await offboardingRepository.updateTask(taskId, {
      status: 'Completed',
      completedAt: new Date(),
      completedBy: userId
    });
  },

  finalizeOffboarding: async (id) => {
    const offboarding = await offboardingRepository.findById(id);
    if (!offboarding) throw new Error('Offboarding record not found');

    const pendingTasks = offboarding.tasks.filter(t => t.status !== 'Completed');
    if (pendingTasks.length > 0) {
      throw new Error(`Cannot finalize: ${pendingTasks.length} tasks still pending`);
    }

    // Mark as completed and deactivate employee
    await offboardingRepository.update(id, { status: 'Completed', actualLastDate: new Date() });
    await employeeRepository.update(offboarding.employeeId, { isActive: false });

    return { message: 'Offboarding finalized and employee deactivated' };
  }
};

module.exports = offboardingService;
