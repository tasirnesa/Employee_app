const documentService = require('../services/documentService');

const getCategories = async (req, res) => {
  try {
    const categories = await documentService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await documentService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await documentService.updateCategory(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await documentService.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await documentService.getAllDocuments(req.query);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const document = await documentService.uploadDocument({
      ...req.body,
      userId: req.user?.id || req.body.userId // Prefer authenticated user ID
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const document = await documentService.updateDocument(req.params.id, req.body);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await documentService.deleteDocument(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyDocument = async (req, res) => {
  try {
    const document = await documentService.verifyDocument(req.params.id, req.user.id);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  verifyDocument
};
