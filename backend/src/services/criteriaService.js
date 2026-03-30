const criteriaRepository = require('../repositories/criteriaRepository');

const criteriaService = {
  getCriteria: async (id = null) => {
    if (id) {
      const criteria = await criteriaRepository.findById(id);
      if (!criteria) return null;
      return {
        ...criteria,
        creatorName: criteria.creator?.fullName || null,
      };
    }
    const all = await criteriaRepository.findAll();
    return all.map(c => ({
      ...c,
      creatorName: c.creator?.fullName || null,
    }));
  },

  createCriteria: async (data, userId) => {
    const { title, description } = data;
    if (!title || String(title).trim() === '') {
      throw new Error('Title is required');
    }
    return await criteriaRepository.create({
      title: String(title).trim(),
      description: description == null || String(description).trim() === '' ? null : String(description),
      createdDate: new Date(),
      createdBy: userId || 1,
    });
  },

  bulkCreateCriteria: async (items, userId) => {
    if (!Array.isArray(items) || !items.length) {
      throw new Error('Request body must be a non-empty array');
    }
    const now = new Date();
    const payload = items
      .filter((it) => it.title && String(it.title).trim() !== '')
      .map((it) => ({
        title: String(it.title).trim(),
        description: it.description == null || String(it.description).trim() === '' ? null : String(it.description),
        createdDate: now,
        createdBy: userId || 1,
      }));

    if (!payload.length) {
      throw new Error('No valid criteria in payload');
    }

    return await criteriaRepository.createMany(payload);
  },

  updateCriteria: async (id, data) => {
    const { title, description } = data;
    if (!title || String(title).trim() === '') {
      throw new Error('Title is required');
    }
    return await criteriaRepository.update(id, {
      title: String(title).trim(),
      description: description == null || String(description).trim() === '' ? null : String(description),
    });
  },

  deleteCriteria: async (id) => {
    const usageCount = await criteriaRepository.countUsage(id);
    if (usageCount > 0) {
      throw new Error('Cannot delete criteria that is being used in evaluations');
    }
    return await criteriaRepository.delete(id);
  },

  authorizeCriteria: async (id, userId, userRole) => {
    if (userRole && userRole !== 'admin' && userRole !== 'manager') {
      throw new Error('Insufficient permissions to authorize criteria');
    }
    return await criteriaRepository.update(id, {
      isAuthorized: true,
      authorizedBy: userId,
      authorizedDate: new Date(),
    });
  }
};

module.exports = criteriaService;
