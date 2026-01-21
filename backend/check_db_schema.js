const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- Checking User Table Columns ---');
        const userCols = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'User' 
            AND table_schema = 'public'
        `;
        console.log('User Columns:', JSON.stringify(userCols, null, 2));

        console.log('\n--- Checking Employee Table Columns ---');
        const empCols = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Employee' 
            AND table_schema = 'public'
        `;
        console.log('Employee Columns:', JSON.stringify(empCols, null, 2));

        console.log('\n--- Checking Message Table Columns ---');
        const msgCols = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Message' 
            AND table_schema = 'public'
        `;
        console.log('Message Columns:', JSON.stringify(msgCols, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
