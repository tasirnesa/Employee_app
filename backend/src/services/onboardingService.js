const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

const onboardingService = {
  completeWizard: async (data, creatorId) => {
    const { userData, employeeData, goals, candidateId } = data;

    const userName = userData.userName?.trim();
    const email = employeeData.email?.trim();

    return await prisma.$transaction(async (tx) => {
      // 1. Check uniqueness inside transaction for absolute safety
      const existingUser = await tx.user.findUnique({ where: { userName } });
      if (existingUser) throw new Error(`Username "${userName}" already exists.`);

      const existingEmployee = await tx.employee.findUnique({ where: { email } });
      if (existingEmployee) throw new Error(`Email "${email}" is already used.`);

      // 2. Resolve Department/Position
      let deptId = null;
      let posId = null;
      if (employeeData.department) {
        const dept = await tx.department.findUnique({ where: { name: employeeData.department } });
        if (dept) deptId = dept.id;
      }
      if (employeeData.position) {
        const pos = await tx.position.findFirst({ where: { name: employeeData.position } });
        if (pos) posId = pos.id;
      }

      // 3. Create User
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await tx.user.create({
        data: {
          fullName: userData.fullName.trim(),
          userName: userName,
          password: hashedPassword,
          role: userData.role || 'Employee',
          gender: userData.gender,
          age: userData.age ? parseInt(userData.age) : null,
          status: 'true',
          activeStatus: 'true',
          isFirstLogin: 'true',
          locked: 'false',
          createdDate: new Date(),
          createdBy: creatorId,
          departmentId: deptId,
          positionId: posId
        }
      });

      // 4. Create Employee Profile
      const employee = await tx.employee.create({
        data: {
          firstName: employeeData.firstName || userData.fullName.split(' ')[0],
          lastName: employeeData.lastName || userData.fullName.split(' ').slice(1).join(' '),
          email: email,
          phone: employeeData.phone,
          departmentId: deptId,
          positionId: posId,
          hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(),
          userId: user.id,
          isActive: true
        }
      });

      // 5. Create Initial Goals
      let createdGoals = [];
      if (goals && Array.isArray(goals) && goals.length > 0) {
        for (const goal of goals) {
          const g = await tx.goal.create({
            data: {
              objective: goal.objective,
              priority: goal.priority || 'Normal',
              status: 'In Progress',
              progress: 0,
              duedate: goal.duedate ? new Date(goal.duedate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              category: 'Onboarding',
              activatedBy: user.id
            }
          });
          createdGoals.push(g);
        }
      }

      // 6. Create welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to the Team!',
          message: `Hello ${user.fullName}, welcome aboard!`,
          type: 'SUCCESS',
          link: '/dashboard'
        }
      });

      // 7. Update Candidate
      if (candidateId) {
        await tx.candidate.update({
          where: { id: parseInt(candidateId) },
          data: { status: 'Hired' }
        });
      }

      return { user, employee, goals: createdGoals };
    });
  }
};

module.exports = onboardingService;
