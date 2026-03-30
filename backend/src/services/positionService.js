const positionRepository = require('../repositories/positionRepository');

const positionService = {
  getPositions: async (id = null) => {
    if (id) return await positionRepository.findById(id);
    return await positionRepository.findAll();
  },

  createPosition: async (data) => {
    const { name, level, reportsTo } = data;
    if (!name || !level) throw new Error('Name and level are required');
    return await positionRepository.create({
      name,
      level: parseInt(level),
      reportsTo: reportsTo ? parseInt(reportsTo) : null
    });
  },

  updatePosition: async (id, data) => {
    const { name, level, reportsTo } = data;
    return await positionRepository.update(id, {
      name,
      level: level ? parseInt(level) : undefined,
      reportsTo: reportsTo ? parseInt(reportsTo) : null
    });
  },

  deletePosition: async (id) => {
    const usersCount = await positionRepository.countUsers(id);
    if (usersCount > 0) {
      throw new Error(`Cannot delete position with ${usersCount} users. Please reassign users first.`);
    }
    const subordinatesCount = await positionRepository.countSubordinates(id);
    if (subordinatesCount > 0) {
      throw new Error(`Cannot delete position with ${subordinatesCount} subordinate positions. Please reassign subordinates first.`);
    }
    return await positionRepository.delete(id);
  }
};

module.exports = positionService;
