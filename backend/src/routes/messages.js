const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route GET /api/messages/threads
 * @desc Get latest message for each conversation
 */
router.get('/threads', async (req, res) => {
    const myId = req.user.id;
    try {
        const threads = await prisma.$queryRaw`
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
        res.json(threads);
    } catch (error) {
        console.error('Fetch threads error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation threads', details: error.message });
    }
});

/**
 * @route GET /api/messages/:userId
 * @desc Get message history with a specific user
 */
router.get('/:userId', async (req, res) => {
    const otherUserId = parseInt(req.params.userId);
    const myId = req.user.id;

    if (isNaN(otherUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: myId }
                ]
            },
            include: {
                parent: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.json(messages);
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({ error: 'Failed to fetch message history' });
    }
});

/**
 * @route POST /api/messages
 * @desc Send a new message
 */
router.post('/', async (req, res) => {
    const { receiverId, text, image, parentId } = req.body;
    const senderId = req.user.id;

    if (!receiverId || (!text && !image)) {
        return res.status(400).json({ error: 'Receiver and content (text or image) are required' });
    }

    try {
        const message = await prisma.message.create({
            data: {
                senderId: parseInt(senderId),
                receiverId: parseInt(receiverId),
                text: text || null,
                image: image || null,
                parentId: parentId || null,
                status: 'sent'
            },
            include: {
                parent: true
            }
        });
        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * @route PATCH /api/messages/:messageId/read
 * @desc Mark a message as read
 */
router.patch('/:messageId/read', async (req, res) => {
    const { messageId } = req.params;
    const myId = req.user.id;

    try {
        const message = await prisma.message.update({
            where: { id: messageId },
            data: { status: 'read' }
        });
        res.json(message);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

module.exports = router;
