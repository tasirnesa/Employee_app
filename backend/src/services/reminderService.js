const prisma = require('../config/prisma');

const REMINDER_THRESHOLD_HOURS = 48; // First reminder after 48h
const REPEAT_THRESHOLD_HOURS = 24;   // Repeat every 24h if still pending

const checkOverdueLeaves = async () => {
  console.log('--- Starting Overdue Leave Check ---');
  try {
    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - (REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000));
    const repeatThreshold = new Date(now.getTime() - (REPEAT_THRESHOLD_HOURS * 60 * 60 * 1000));

    // Find pending leaves that are:
    // 1. Older than 48h (createdAt < overdueThreshold)
    // 2. Haven't been reminded in the last 24h (lastReminderAt is null OR < repeatThreshold)
    const overdueLeaves = await prisma.leave.findMany({
      where: {
        status: 'Pending',
        createdAt: { lt: overdueThreshold },
        OR: [
          { lastReminderAt: null },
          { lastReminderAt: { lt: repeatThreshold } }
        ]
      },
      include: {
        employee: {
          include: {
            department: true
          }
        },
        leaveType: true
      }
    });

    console.log(`Found ${overdueLeaves.length} overdue requests.`);

    for (const leave of overdueLeaves) {
      // Logic for identifying approver (same as in processApproval)
      let approverId = leave.employee.managerId;
      
      // Fallback to Department Manager if no direct manager
      if (!approverId && leave.employee.department?.managerId) {
        approverId = leave.employee.department.managerId;
      }

      if (approverId) {
        // Create System Notification
        await prisma.notification.create({
          data: {
            userId: approverId,
            title: 'Action Required: Overdue Leave Request',
            message: `REMINDER: ${leave.employee.fullName} is still waiting for approval on their ${leave.leaveType.name} request (Submitted on ${leave.createdAt.toLocaleDateString()}).`,
            type: 'WARNING',
            link: '/leave-management'
          }
        });

        // Update lastReminderAt to prevent spamming
        await prisma.leave.update({
          where: { id: leave.id },
          data: { lastReminderAt: now }
        });

        console.log(`Sent reminder to User ID ${approverId} for Leave ID ${leave.id}`);
      } else {
        console.warn(`No approver found for overdue Leave ID ${leave.id} (Employee: ${leave.employee.fullName})`);
      }
    }
  } catch (error) {
    console.error('Error in overdue leave reminder task:', error);
  }
};

const init = () => {
  // Run once on startup after 10 seconds, then every 1 hour
  setTimeout(checkOverdueLeaves, 10000);
  setInterval(checkOverdueLeaves, 60 * 60 * 1000); 
};

module.exports = { init, checkOverdueLeaves };
