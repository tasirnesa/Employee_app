const communicationRepository = require('../repositories/communicationRepository');

const communicationService = {
  // --- Message logic ---
  getThreads: async (myId) => {
    return await communicationRepository.findMessageThreads(myId);
  },

  getHistory: async (myId, otherUserId) => {
    return await communicationRepository.findMessageHistory(myId, parseInt(otherUserId));
  },

  sendMessage: async (senderId, data) => {
    const { receiverId, text, image, parentId } = data;
    if (!receiverId || (!text && !image)) {
      throw new Error('Receiver and content are required');
    }
    return await communicationRepository.createMessage({
      senderId: parseInt(senderId),
      receiverId: parseInt(receiverId),
      text: text || null,
      image: image || null,
      parentId: parentId || null,
      status: 'sent'
    });
  },

  markMessageRead: async (messageId) => {
    return await communicationRepository.updateMessage(messageId, { status: 'read' });
  },

  // --- Notification logic ---
  getNotifications: async (userId) => {
    return await communicationRepository.findAllNotifications(userId);
  },

  markNotificationRead: async (id) => {
    return await communicationRepository.updateNotification(id, { isRead: true });
  },

  markAllNotificationsRead: async (userId) => {
    return await communicationRepository.updateManyNotifications(
      { userId, isRead: false },
      { isRead: true }
    );
  },

  deleteNotification: async (id) => {
    return await communicationRepository.deleteNotification(id);
  },

  notify: async (userId, title, message, type = 'INFO', link = null) => {
    return await communicationRepository.createNotification({
      userId, title, message, type, link
    });
  }
};

module.exports = communicationService;
