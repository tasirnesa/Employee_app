const prisma = require('../src/config/prisma');
const leaveService = require('../src/services/leaveService');
const attendanceService = require('../src/services/attendanceService');

async function testIntegratedWorkflow() {
  console.log('--- Testing Integrated Leave Workflow ---');

  try {
    // 1. Setup Data
    const manager = await prisma.user.findFirst({ where: { role: 'Admin' } }); // Admin can act as manager
    const employee = await prisma.user.findFirst({ where: { id: { not: manager.id } } });
    const handover = await prisma.user.findFirst({ where: { id: { notIn: [manager.id, employee.id] } } });
    const leaveType = await prisma.leaveType.findFirst();

    if (!manager || !employee || !leaveType) throw new Error('Missing test data (ensure users and leave types exist)');

    // Ensure employee reports to manager
    await prisma.user.update({ where: { id: employee.id }, data: { managerId: manager.id } });

    console.log(`Manager: ${manager.fullName}, Employee: ${employee.fullName}, Handover: ${handover?.fullName || 'N/A'}`);

    // 2. Create Leave Request
    console.log('\nStep 1: Creating leave request...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // +2 days

    const leave = await leaveService.createLeaveRequest({
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      reason: 'Integrated test',
      handoverId: handover ? handover.id : null
    });
    console.log('✓ Leave created:', leave.id);

    // 3. Check Notifications
    const managerNotif = await prisma.notification.findFirst({
        where: { userId: manager.id, title: 'New Leave Request' },
        orderBy: { createdAt: 'desc' }
    });
    console.log(managerNotif ? '✓ Manager notification created' : 'X Manager notification MISSING');

    if (handover) {
        const handoverNotif = await prisma.notification.findFirst({
            where: { userId: handover.id, title: 'Leave Handover Assigned' },
            orderBy: { createdAt: 'desc' }
        });
        console.log(handoverNotif ? '✓ Handover notification created' : 'X Handover notification MISSING');
    }

    // 4. Approve Leave
    console.log('\nStep 2: Approving leave...');
    await leaveService.processApproval(leave.id, 'Approved', manager.id, 'Approved for test');
    console.log('✓ Leave approved');

    // 5. Verify Attendance
    console.log('\nStep 3: Verifying Attendance generation...');
    const attendanceRecords = await prisma.attendance.findMany({
        where: { 
            employeeId: employee.id,
            date: { gte: new Date(startDate.setHours(0,0,0,0)), lte: new Date(endDate.setHours(0,0,0,0)) }
        }
    });

    console.log(`Generated ${attendanceRecords.length} attendance records.`);
    attendanceRecords.forEach(r => {
        console.log(`- Date: ${r.date.toISOString().split('T')[0]}, Status: ${r.status}`);
    });

    if (attendanceRecords.length > 0 && attendanceRecords.every(r => r.status === 'on-leave')) {
        console.log('✓ ATTENDANCE SYNC VERIFIED!');
    } else {
        console.log('X ATTENDANCE SYNC FAILED or partially failed');
    }

    // 6. Check Employee Notification
    const employeeNotif = await prisma.notification.findFirst({
        where: { userId: employee.id, title: 'Leave Approved' },
        orderBy: { createdAt: 'desc' }
    });
    console.log(employeeNotif ? '✓ Employee notification created' : 'X Employee notification MISSING');

    console.log('\nINTEGRATED TEST COMPLETE! 🚀');

  } catch (error) {
    console.error('Test Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testIntegratedWorkflow();
