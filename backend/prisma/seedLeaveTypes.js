const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLeaveTypes() {
  console.log('🌱 Starting leave types seed...');

  const leaveTypes = [
    {
      name: 'Annual Leave',
      description: 'Paid vacation time for employees',
      maxDays: 25,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Sick Leave',
      description: 'Leave for illness or medical appointments',
      maxDays: 12,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Personal Leave',
      description: 'Personal time off for various reasons',
      maxDays: 5,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Maternity Leave',
      description: 'Leave for new mothers',
      maxDays: 90,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Paternity Leave',
      description: 'Leave for new fathers',
      maxDays: 15,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Bereavement Leave',
      description: 'Leave for death of family member',
      maxDays: 3,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Emergency Leave',
      description: 'Leave for family emergencies',
      maxDays: 3,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Study Leave',
      description: 'Leave for educational purposes',
      maxDays: 10,
      isPaid: false,
      isActive: true,
    },
    {
      name: 'Unpaid Leave',
      description: 'Leave without pay',
      maxDays: 30,
      isPaid: false,
      isActive: true,
    },
    {
      name: 'Compensatory Leave',
      description: 'Compensatory time off for overtime work',
      maxDays: 10,
      isPaid: true,
      isActive: true,
    },
  ];

  try {
    // Check if leave types already exist
    const existingCount = await prisma.leaveType.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing leave types. Skipping seed.`);
      console.log('To re-seed, delete existing leave types first.');
      return;
    }

    console.log('📝 Inserting leave types...');
    
    for (const leaveType of leaveTypes) {
      const result = await prisma.leaveType.create({
        data: leaveType,
      });
      console.log(`✅ Created: ${result.name}`);
    }

    console.log('✅ Successfully seeded leave types!');
    console.log(`📊 Total leave types created: ${leaveTypes.length}`);
  } catch (error) {
    console.error('❌ Error seeding leave types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedLeaveTypes()
  .then(() => {
    console.log('🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
