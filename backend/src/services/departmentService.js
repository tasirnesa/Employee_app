const departmentRepository = require('../repositories/departmentRepository');

const departmentService = {
  getDepartments: async (id = null) => {
    if (id) return await departmentRepository.findById(id);
    return await departmentRepository.findAll();
  },

  createDepartment: async (data) => {
    const { name, managerId } = data;
    if (!name) throw new Error('Department name is required');
    return await departmentRepository.create({
      name,
      managerId: managerId ? parseInt(managerId) : null
    });
  },

  updateDepartment: async (id, data) => {
    const { name, managerId } = data;
    return await departmentRepository.update(id, {
      name,
      managerId: managerId ? parseInt(managerId) : null
    });
  },

  deleteDepartment: async (id) => {
    const usersCount = await departmentRepository.countUsers(id);
    if (usersCount > 0) {
      throw new Error(`Cannot delete department with ${usersCount} users. Please reassign users first.`);
    }
    return await departmentRepository.delete(id);
  }
};

module.exports = departmentService;
