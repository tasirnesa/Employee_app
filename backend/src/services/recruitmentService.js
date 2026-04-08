const recruitmentRepository = require('../repositories/recruitmentRepository');

const recruitmentService = {
  getCandidates: async (filters = {}) => {
    const { status, q, position } = filters;
    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (position) {
      whereClause.position = { contains: position, mode: 'insensitive' };
    }

    if (q) {
      whereClause.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } }
      ];
    }

    return await recruitmentRepository.findAllCandidates(whereClause);
  },

  getCandidateById: async (id) => {
    return await recruitmentRepository.findCandidateById(id);
  },

  createCandidate: async (data) => {
    const processedData = {
      ...data,
      experience: parseInt(data.experience),
      skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map(s => s.trim()) : []),
      status: data.status || 'Applied',
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : new Date(),
      interviewDate: data.interviewDate ? new Date(data.interviewDate) : null
    };
    return await recruitmentRepository.createCandidate(processedData);
  },

  updateCandidate: async (id, data) => {
    const processedData = { ...data };
    if (data.experience !== undefined) processedData.experience = parseInt(data.experience);
    if (data.skills !== undefined) {
      processedData.skills = Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map(s => s.trim()) : []);
    }
    if (data.interviewDate !== undefined) {
      processedData.interviewDate = data.interviewDate ? new Date(data.interviewDate) : null;
    }
    if (data.appliedDate !== undefined) {
      processedData.appliedDate = data.appliedDate ? new Date(data.appliedDate) : new Date();
    }
    return await recruitmentRepository.updateCandidate(id, processedData);
  },

  updateCandidateStatus: async (id, statusData) => {
    const { status, interviewDate, notes } = statusData;
    const data = { status };
    if (interviewDate !== undefined) data.interviewDate = interviewDate ? new Date(interviewDate) : null;
    if (notes !== undefined) data.notes = notes;
    return await recruitmentRepository.updateCandidate(id, data);
  },

  deleteCandidate: async (id) => {
    return await recruitmentRepository.deleteCandidate(id);
  }
};

module.exports = recruitmentService;
