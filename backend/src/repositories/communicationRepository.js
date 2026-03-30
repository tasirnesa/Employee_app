const prisma = require('../config/prisma');

const communicationRepository = {
  // --- Messages ---
  findMessageThreads: async (myId) => {
    return await prisma.$queryRaw`
      WITH conversation_partners AS (
        SELECT 
          "id", "text", "createdAt", "status", "senderId", "receiverId", "parentId",
          CASE 
            WHEN "senderId" = ${myId} THEN "receiverId"
            ELSE "senderId"
          END AS "otherId"
        FROM "Message"
        WHERE "senderId" = ${myId} OR "receiverId" = ${myId}
      )
      SELECT DISTINCT ON ("otherId")
        cp."id", 
        cp."text", 
        cp."createdAt", 
        cp."status", 
        cp."senderId", 
        cp."receiverId",
        cp."otherId",
        cp."parentId",
        u."FullName" as "otherName",
        e."profileImageUrl" as "otherAvatar"
      FROM conversation_partners cp
      JOIN "User" u ON u."Id" = cp."otherId"
      LEFT JOIN "Employee" e ON e."userId" = cp."otherId"
      ORDER BY "otherId", cp."createdAt" DESC
    `;
  },

  findMessageHistory: async (myId, otherUserId) => {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId }
        ]
      },
      include: { parent: true },
      orderBy: { createdAt: 'asc' }
    });
  },

  createMessage: async (data) => {
    return await prisma.message.create({
      data,
      include: { parent: true }
    });
  },

  updateMessage: async (id, data) => {
    return await prisma.message.update({
      where: { id },
      data
    });
  },

  // --- Notifications ---
  findAllNotifications: async (userId, limit = 50) => {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  updateNotification: async (id, data) => {
    return await prisma.notification.update({
      where: { id: parseInt(id) },
      data
    });
  },

  updateManyNotifications: async (where, data) => {
    return await prisma.notification.updateMany({ where, data });
  },

  deleteNotification: async (id) => {
    return await prisma.notification.delete({ where: { id: parseInt(id) } });
  },

  createNotification: async (data) => {
    return await prisma.notification.create({ data });
  }
};

module.exports = communicationRepository;
