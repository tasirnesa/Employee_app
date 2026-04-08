const prisma = require('../config/prisma');

const findAllCategories = async () => {
  return await prisma.documentCategory.findMany({
    include: {
      _count: {
        select: { documents: true }
      }
    }
  });
};

const findCategoryById = async (id) => {
  return await prisma.documentCategory.findUnique({
    where: { id: parseInt(id) },
    include: { documents: true }
  });
};

const createCategory = async (data) => {
  return await prisma.documentCategory.create({
    data
  });
};

const updateCategory = async (id, data) => {
  return await prisma.documentCategory.update({
    where: { id: parseInt(id) },
    data
  });
};

const deleteCategory = async (id) => {
  return await prisma.documentCategory.delete({
    where: { id: parseInt(id) }
  });
};

const findAllDocuments = async (filters = {}) => {
  const { userId, employeeId, categoryId, status } = filters;
  const where = {};
  
  if (userId) where.userId = parseInt(userId);
  if (employeeId) where.employeeId = parseInt(employeeId);
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (status) where.status = status;

  return await prisma.document.findMany({
    where,
    include: {
      category: true,
      user: {
        select: { id: true, fullName: true }
      },
      verifier: {
        select: { id: true, fullName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const findDocumentById = async (id) => {
  return await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      user: {
        select: { id: true, fullName: true }
      },
      verifier: {
        select: { id: true, fullName: true }
      }
    }
  });
};

const createDocument = async (data) => {
  return await prisma.document.create({
    data
  });
};

const updateDocument = async (id, data) => {
  return await prisma.document.update({
    where: { id: parseInt(id) },
    data
  });
};

const deleteDocument = async (id) => {
  return await prisma.document.delete({
    where: { id: parseInt(id) }
  });
};

const findExpiringDocuments = async (thresholdDate) => {
  // Find documents that are Active, have an expiryDate, 
  // and satisfy: expiryDate - remindDaysBefore <= thresholdDate
  // This is a bit complex for a simple Prisma query if remindDaysBefore is dynamic.
  // For now, let's find all active documents with expiryDate and filter in memory or use a fixed threshold if needed.
  
  return await prisma.document.findMany({
    where: {
      status: 'Active',
      expiryDate: { not: null },
      expiryDate: { lte: thresholdDate } 
    },
    include: {
      user: true
    }
  });
};

module.exports = {
  findAllCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  findAllDocuments,
  findDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  findExpiringDocuments
};
