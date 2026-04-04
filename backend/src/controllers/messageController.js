const communicationService = require('../services/communicationService');
const asyncHandler = require('../utils/asyncHandler');

const messageController = {
  getThreads: asyncHandler(async (req, res) => {
    const threads = await communicationService.getThreads(req.user.id);
    res.json(threads);
  }),

  getHistory: asyncHandler(async (req, res) => {
    const messages = await communicationService.getHistory(req.user.id, req.params.userId);
    res.json(messages);
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const message = await communicationService.sendMessage(req.user.id, req.body);
    res.status(201).json(message);
  }),

  markRead: asyncHandler(async (req, res) => {
    const message = await communicationService.markMessageRead(req.params.messageId);
    res.json(message);
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const result = await communicationService.markAllMessagesAsRead(req.user.id, req.params.userId);
    res.json(result);
  })
};

module.exports = messageController;
