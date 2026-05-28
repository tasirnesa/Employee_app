const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const communicationService = require('./communicationService');
const emailService = require('./emailService');
const path = require('path');
const fs = require('fs');

const onboardingService = {
  completeWizard: async (data, creatorId) => {
    const { userData, employeeData, goals, candidateId } = data;

    const userName = userData.userName?.trim();
    const email = employeeData.email?.trim();

    return await prisma.$transaction(async (tx) => {
      // 1. Check uniqueness
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

      // 5. Create Initial Onboarding Record
      const onboarding = await tx.onboarding.create({
        data: {
          employeeId: employee.id,
          status: 'InProgress',
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          tasks: {
            create: [
              { title: 'Welcome Meeting', description: 'Schedule a discovery meeting with the team manager.' },
              { title: 'IT Equipment Setup', description: 'Provision laptop, monitor, and necessary hardware.' },
              { title: 'System Access', description: 'Provide access to Slack, Jira, GitHub, and internal portals.' },
              { title: 'HR Briefing', description: 'Review company policies, handbook, and culture.' },
              { title: 'Benefits Enrollment', description: 'Review and sign up for health insurance and 401k.' },
              { title: 'Office Tour & Security', description: 'Get ID badge and tour the facility.' },
              { title: 'Training Plan', description: 'Review the initial 30-day training roadmap.' }
            ]
          },
          documents: {
            create: [
              { title: 'Signed Contract', description: 'Official employment contract.' },
              { title: 'ID Document', description: 'Passport or National ID card copy.' },
              { title: 'Academic Certificates', description: 'Highest degree or professional certificates.' },
              { title: 'NDA & IP Agreement', description: 'Signed non-disclosure and intellectual property agreement.' },
              { title: 'Tax Forms', description: 'W-4 or local tax registration forms.' }
            ]
          }
        }
      });

      // 6. Create Initial Goals
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


      // 8. Update Candidate
      if (candidateId) {
        await tx.candidate.update({
          where: { id: parseInt(candidateId) },
          data: { status: 'Hired' }
        });
      }

      // 9. Auto-initialize Probation Period (90 days default)
      const probationEndDate = new Date();
      probationEndDate.setDate(probationEndDate.getDate() + 90);
      
      await tx.probationPeriod.create({
        data: {
          onboardingId: onboarding.id,
          startDate: new Date(),
          endDate: probationEndDate,
          status: 'Active',
          goals: []
        }
      });

      // 10. Auto-initialize Verifications (Identity, Background, etc.)
      const verificationTypes = [
        { type: 'Identity', notes: 'Verify National ID or Passport' },
        { type: 'Background', notes: 'Educational and experience verification' },
        { type: 'Criminal', notes: 'Police clearance certificate' },
        { type: 'Medical', notes: 'Health fitness certificate' },
        { type: 'Reference', notes: 'Contact previous employers' }
      ];

      await tx.onboardingVerification.createMany({
        data: verificationTypes.map(v => ({ ...v, onboardingId: onboarding.id, status: 'Pending' }))
      });

      return { user, employee, onboarding, goals: createdGoals };
    });

    // Notify Employee AFTER transaction succeeds
    try {
      await communicationService.notify(
        result.user.id,
        'Welcome to the Team!',
        `Hello ${result.user.fullName}, welcome aboard! Your onboarding process has started.`,
        'SUCCESS',
        '/dashboard'
      );
      
      const fullEmployee = await prisma.employee.findUnique({
        where: { id: result.employee.id },
        include: { department: true, position: true }
      });
      await emailService.sendWelcomeEmail(fullEmployee);
    } catch (e) {
      console.warn('Welcome notification/email failed', e.message);
    }

    return result;
  },

  getOnboardingByEmployeeId: async (employeeId) => {
    return await prisma.onboarding.findUnique({
      where: { employeeId: parseInt(employeeId) },
      include: {
        tasks: true,
        documents: true,
        trainings: true,
        employee: {
          include: {
            department: true,
            position: true,
            assets: true
          }
        },
        probation: true,
        verifications: { orderBy: { type: 'asc' } }
      }
    });
  },

  getAllOnboardings: async (filters = {}) => {
    const { status, departmentId } = filters;
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = parseInt(departmentId);

    return await prisma.onboarding.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            position: true
          }
        },
        tasks: {
          select: { status: true }
        },
        documents: {
          select: { status: true }
        },
        trainings: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  generateContract: async (employeeId) => {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: { department: true, position: true }
    });

    if (!employee) throw new Error('Employee not found');

    const fileName = `contract-${employee.id}-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
    
    // Simulate PDF content
    const content = `EMPLOYMENT CONTRACT\n\nEmployee: ${employee.firstName} ${employee.lastName}\nPosition: ${employee.position?.name}\nDepartment: ${employee.department?.name}\nDate: ${new Date().toLocaleDateString()}`;
    fs.writeFileSync(filePath, content);

    const onboarding = await prisma.onboarding.findUnique({
      where: { employeeId: employee.id },
      include: { documents: true }
    });

    if (!onboarding) throw new Error('Onboarding record not found');

    const contractDoc = onboarding.documents.find(d => d.title === 'Signed Contract');

    if (contractDoc) {
      await prisma.onboardingDocument.update({
        where: { id: contractDoc.id },
        data: {
          fileUrl: `/uploads/${fileName}`,
          status: 'Uploaded',
          uploadedAt: new Date()
        }
      });
    }

    return { message: 'Contract generated successfully', fileUrl: `/uploads/${fileName}` };
  },

  updateOnboarding: async (id, data) => {
    const processedData = { ...data };
    if (data.dueDate) processedData.dueDate = new Date(data.dueDate);
    if (data.completedAt) processedData.completedAt = new Date(data.completedAt);
    return await prisma.onboarding.update({
      where: { id: parseInt(id) },
      data: processedData
    });
  },

  // Task Management
  createTask: async (onboardingId, data) => {
    const processedData = { ...data };
    if (data.dueDate) processedData.dueDate = new Date(data.dueDate);
    return await prisma.onboardingTask.create({
      data: {
        ...processedData,
        onboardingId: parseInt(onboardingId)
      }
    });
  },

  updateTask: async (taskId, data) => {
    const processedData = { ...data };
    if (data.dueDate) processedData.dueDate = new Date(data.dueDate);
    if (data.completedAt) processedData.completedAt = new Date(data.completedAt);
    
    if (data.status === 'Completed' && !data.completedAt) {
      processedData.completedAt = new Date();
    }
    return await prisma.onboardingTask.update({
      where: { id: parseInt(taskId) },
      data: processedData
    });
  },

  deleteTask: async (taskId) => {
    return await prisma.onboardingTask.delete({
      where: { id: parseInt(taskId) }
    });
  },

  // Document Management
  createDocument: async (onboardingId, data) => {
    return await prisma.onboardingDocument.create({
      data: {
        ...data,
        onboardingId: parseInt(onboardingId)
      }
    });
  },

  updateDocument: async (docId, data) => {
    return await prisma.onboardingDocument.update({
      where: { id: parseInt(docId) },
      data
    });
  },

  deleteDocument: async (docId) => {
    return await prisma.onboardingDocument.delete({
      where: { id: parseInt(docId) }
    });
  },

  // Training Management
  assignTraining: async (onboardingId, data) => {
    return await prisma.onboardingTraining.create({
      data: {
        ...data,
        onboardingId: parseInt(onboardingId)
      }
    });
  },

  updateTrainingStatus: async (trainingId, data) => {
    const processedData = { ...data };
    if (data.completedAt) processedData.completedAt = new Date(data.completedAt);
    
    if (data.status === 'Completed' && !data.completedAt) {
      processedData.completedAt = new Date();
    }
    return await prisma.onboardingTraining.update({
      where: { id: parseInt(trainingId) },
      data: processedData
    });
  },

  deleteTraining: async (trainingId) => {
    return await prisma.onboardingTraining.delete({
      where: { id: parseInt(trainingId) }
    });
  }
};

module.exports = onboardingService;
