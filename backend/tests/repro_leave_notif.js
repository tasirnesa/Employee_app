const prisma = require('../src/config/prisma');
const leaveService = require('../src/services/leaveService');

async function reproNotifications() {
  console.log('--- Reproducing Leave Notification Bugs ---');

  try {
    // 1. Find a manager and an employee who reports to them
    const manager = await prisma.user.findFirst({ where: { role: 'Manager', email: { not: null } } });
    if (!manager) throw new Error('No manager with email found');

    const employee = await prisma.user.findFirst({ where: { managerId: manager.id, email: { not: null } } });
    if (!employee) throw new Error('No employee reporting to manager found');

    console.log(`Using Manager: ${manager.fullName} (ID: ${manager.id})`);
    console.log(`Using Employee: ${employee.fullName} (ID: ${employee.id})`);

    // 2. Create a leave type if not exists
    const leaveType = await prisma.leaveType.findFirst() || await prisma.leaveType.create({
      data: { name: 'Test Leave', description: 'For repro', maxDays: 10 }
    });

    // 3. Create a leave request
    console.log('\nStep 1: Creating leave request...');
    const leave = await leaveService.createLeaveRequest({
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      reason: 'Reproduction test'
    });
    console.log('✓ Leave request created ID:', leave.id);

    // 4. Check for manager notification in DB
    const managerNotif = await prisma.notification.findFirst({
        where: { userId: manager.id, title: 'New Leave Request' },
        orderBy: { createdAt: 'desc' }
    });

    if (managerNotif) {
      console.log('✓ In-app notification for manager found:', managerNotif.message);
    } else {
      console.log('X BUG CONFIRMED: In-app notification for manager NOT found!');
    }

    // 5. Approve the leave
    console.log('\nStep 2: Approving leave...');
    await leaveService.processApproval(leave.id, 'Approved', manager.id, 'Repro approved');
    console.log('✓ Leave approved');

    // 6. Check for employee notification in DB
    const employeeNotif = await prisma.notification.findFirst({
        where: { userId: employee.id, title: 'Leave Approved' },
        orderBy: { createdAt: 'desc' }
    });

    if (employeeNotif) {
        console.log('✓ In-app notification for employee found:', employeeNotif.message);
    } else {
        console.log('X BUG CONFIRMED: In-app notification for employee NOT found!');
    }

  } catch (error) {
    console.error('Test Execution Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

reproNotifications();
