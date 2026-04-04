const communicationRepository = require('../repositories/communicationRepository');
const socketService = require('./socketService');

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
    const message = await communicationRepository.createMessage({
      senderId: parseInt(senderId),
      receiverId: parseInt(receiverId),
      text: text || null,
      image: image || null,
      parentId: parentId || null,
      status: 'sent'
    });

    // Real-time message delivery
    socketService.sendToUser(receiverId, 'newMessage', message);
    
    return message;
  },

  markMessageRead: async (messageId) => {
    const message = await communicationRepository.updateMessage(parseInt(messageId), { status: 'read' });
    // Notify sender that message was read
    socketService.sendToUser(message.senderId, 'messageRead', { messageId: message.id, receiverId: message.receiverId });
    return message;
  },

  markAllMessagesAsRead: async (myId, otherUserId) => {
    const result = await communicationRepository.updateManyMessages(
      { 
        receiverId: parseInt(myId), 
        senderId: parseInt(otherUserId), 
        status: { not: 'read' } 
      },
      { status: 'read' }
    );

    // Notify all sessions of the current user that messages from this partner are read
    socketService.sendToUser(myId, 'messagesRead', { otherUserId: parseInt(otherUserId) });
    
    return result;
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
    const notification = await communicationRepository.createNotification({
      userId, title, message, type, link
    });

    // Real-time notification delivery
    socketService.sendToUser(userId, 'notification', notification);

    return notification;
  }
};

module.exports = communicationService;
