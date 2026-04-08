const documentRepository = require('../repositories/documentRepository');
const prisma = require('../config/prisma');

const getAllCategories = async () => {
  return await documentRepository.findAllCategories();
};

const getCategoryById = async (id) => {
  return await documentRepository.findCategoryById(id);
};

const createCategory = async (data) => {
  return await documentRepository.createCategory(data);
};

const updateCategory = async (id, data) => {
  return await documentRepository.updateCategory(id, data);
};

const deleteCategory = async (id) => {
  // Check if category has documents
  const category = await documentRepository.findCategoryById(id);
  if (category.documents && category.documents.length > 0) {
    throw new Error('Cannot delete category with associated documents.');
  }
  return await documentRepository.deleteCategory(id);
};

const getAllDocuments = async (filters) => {
  return await documentRepository.findAllDocuments(filters);
};

const getDocumentById = async (id) => {
  return await documentRepository.findDocumentById(id);
};

const uploadDocument = async (data) => {
  // data should contain title, description, fileUrl, fileType, categoryId, userId, employeeId, expiryDate, remindDaysBefore
  return await documentRepository.createDocument(data);
};

const updateDocument = async (id, data) => {
  return await documentRepository.updateDocument(id, data);
};

const deleteDocument = async (id) => {
  return await documentRepository.deleteDocument(id);
};

const verifyDocument = async (id, verifiedById) => {
  return await documentRepository.updateDocument(id, {
    verifiedBy: verifiedById,
    verifiedAt: new Date(),
    status: 'Active'
  });
};

/**
 * Checks for documents that are expiring based on their individual thresholds
 */
const checkExpiringDocuments = async () => {
  const now = new Date();
  
  // Find all Active documents with an expiry date
  const activeDocs = await prisma.document.findMany({
    where: {
      status: 'Active',
      expiryDate: { not: null }
    },
    include: {
      user: true
    }
  });

  const expiringSoon = [];

  for (const doc of activeDocs) {
    const expiry = new Date(doc.expiryDate);
    const leadTimeDays = doc.remindDaysBefore || 30;
    
    // Calculate the date when we should start reminding
    const reminderStartDate = new Date(expiry.getTime() - (leadTimeDays * 24 * 60 * 60 * 1000));

    if (now >= reminderStartDate) {
      // Document has entered the "Expiring Soon" window
      expiringSoon.push(doc);
    }
  }

  return expiringSoon;
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  verifyDocument,
  checkExpiringDocuments
};
