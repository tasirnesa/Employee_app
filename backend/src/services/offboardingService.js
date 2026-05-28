const offboardingRepository = require('../repositories/offboardingRepository');
const employeeRepository = require('../repositories/employeeRepository');
const communicationService = require('./communicationService');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');

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
    const { employeeId, plannedLastDate, ...offboardingData } = data;
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

    const finalData = {
      ...offboardingData,
      employeeId: parseInt(employeeId),
      status: 'InProgress'
    };

    if (plannedLastDate) {
      finalData.plannedLastDate = new Date(plannedLastDate);
    }

    const record = await offboardingRepository.create(finalData, defaultTasks);

    // Notify relevant parties
    try {
      // 1. Notify the Employee
      if (employee.userId) {
        await communicationService.notify(
          employee.userId,
          'Offboarding Initiated',
          'A separation process has been initiated for you. Please check your tasks and documentation.',
          'WARNING',
          '/offboarding'
        );
      }
      
      // 2. Notify Admins
      const admins = await userRepository.findManyByRole('Admin');
      for (const admin of admins) {
        await communicationService.notify(
          admin.id,
          'Offboarding Process Started',
          `Offboarding initiated for ${employee.firstName} ${employee.lastName}.`,
          'INFO',
          '/offboarding'
        );
      }
    } catch (e) {
      console.warn('Failed to notify parties of offboarding initiation', e.message);
    }

    return record;
  },

  updateOffboarding: async (id, data) => {
    const updateData = { ...data };
    if (updateData.plannedLastDate) {
      updateData.plannedLastDate = new Date(updateData.plannedLastDate);
    }
    if (updateData.actualLastDate) {
      updateData.actualLastDate = new Date(updateData.actualLastDate);
    }
    return await offboardingRepository.update(id, updateData);
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

    await offboardingRepository.update(id, { status: 'Completed', actualLastDate: new Date() });
    await employeeRepository.update(offboarding.employeeId, { isActive: false });

    // Notify Admins of completion
    try {
      const admins = await userRepository.findManyByRole('Admin');
      for (const admin of admins) {
        await communicationService.notify(
          admin.id,
          'Offboarding Completed',
          `Offboarding finalized and employee record deactivated for ${offboarding.employee.firstName} ${offboarding.employee.lastName}.`,
          'SUCCESS',
          '/offboarding'
        );
      }
    } catch (e) {
      console.warn('Failed to notify admins of offboarding completion', e.message);
    }

    return { message: 'Offboarding finalized and employee deactivated' };
  }
};

module.exports = offboardingService;
