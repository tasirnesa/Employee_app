const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeaveTypes() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 All Leave Types in Database:\n');
    console.log(`Total: ${leaveTypes.length} leave types\n`);
    
    leaveTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name}`);
      console.log(`   Description: ${type.description || 'No description'}`);
      console.log(`   Max Days: ${type.maxDays || 'Unlimited'}`);
      console.log(`   Paid: ${type.isPaid ? 'Yes' : 'No'}`);
      console.log(`   Active: ${type.isActive ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaveTypes();
