const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const myId = 6; // yemy
    try {
        console.log(`--- Testing Threads for User ${myId} ---`);
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
        console.log('Threads Results:', JSON.stringify(threads, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
