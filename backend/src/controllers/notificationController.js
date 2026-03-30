const communicationService = require('../services/communicationService');
const asyncHandler = require('../utils/asyncHandler');

const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const notifications = await communicationService.getNotifications(req.user.id);
    res.json(notifications);
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await communicationService.markNotificationRead(req.params.id);
    res.json(notification);
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await communicationService.markAllNotificationsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  }),

  deleteNotification: asyncHandler(async (req, res) => {
    await communicationService.deleteNotification(req.params.id);
    res.status(204).send();
  })
};

module.exports = notificationController;
