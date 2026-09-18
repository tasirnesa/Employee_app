/**
 * seed_default.js
 * Creates the minimum data needed to log in and use the system after a DB reset.
 *
 * Run:  node seed_default.js
 *
 * Creates:
 *  - 2 Departments  (Engineering, Human Resources)
 *  - 4 Positions    (CEO, HR Manager, Senior Engineer, Engineer)
 *  - 2 Grades       (G1, G2)
 *  - 3 Users        (SuperAdmin, Admin, Employee)
 *  - 3 Leave Types  (Annual, Sick, Unpaid)
 *  - 5 Eval Criteria
 *  - 1 Document Category
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const SALT = 10;

async function hash(pw) {
  return bcrypt.hash(pw, SALT);
}

async function main() {
  console.log('🌱 Seeding default data...\n');

  // ── Grades ──────────────────────────────────────────────────────────────
  const [g1, g2] = await Promise.all([
    prisma.grade.upsert({
      where:  { name: 'G1' },
      update: {},
      create: { name: 'G1', minSalary: 8000, midSalary: 10000, maxSalary: 12000, housingPct: 30, transportPct: 15 },
    }),
    prisma.grade.upsert({
      where:  { name: 'G2' },
      update: {},
      create: { name: 'G2', minSalary: 12000, midSalary: 16000, maxSalary: 22000, housingPct: 30, transportPct: 15 },
    }),
  ]);
  console.log('✅ Grades:     G1, G2');

  // ── Positions ────────────────────────────────────────────────────────────
  const ceoPos = await prisma.position.upsert({
    where:  { id: 1 },
    update: {},
    create: { name: 'CEO', level: 1, gradeId: g2.id, positionAllowance: 5000, fuelAllowance: 2000 },
  });
  const hrMgrPos = await prisma.position.upsert({
    where:  { id: 2 },
    update: {},
    create: { name: 'HR Manager', level: 2, reportsTo: ceoPos.id, gradeId: g2.id, positionAllowance: 2000, fuelAllowance: 1000 },
  });
  const senEngPos = await prisma.position.upsert({
    where:  { id: 3 },
    update: {},
    create: { name: 'Senior Engineer', level: 3, reportsTo: ceoPos.id, gradeId: g2.id, positionAllowance: 1500, fuelAllowance: 500 },
  });
  const engPos = await prisma.position.upsert({
    where:  { id: 4 },
    update: {},
    create: { name: 'Engineer', level: 4, reportsTo: senEngPos.id, gradeId: g1.id, positionAllowance: 500, fuelAllowance: 0 },
  });
  console.log('✅ Positions:  CEO, HR Manager, Senior Engineer, Engineer');

  // ── Departments ──────────────────────────────────────────────────────────
  const engDept = await prisma.department.upsert({
    where:  { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' },
  });
  const hrDept = await prisma.department.upsert({
    where:  { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources' },
  });
  console.log('✅ Departments: Engineering, Human Resources');

  // ── Users ────────────────────────────────────────────────────────────────
  const now = new Date();

  const superAdminPw = await hash('Admin@123');
  const superAdmin = await prisma.user.upsert({
    where:  { userName: 'superadmin' },
    update: {},
    create: {
      fullName:    'Super Administrator',
      userName:    'superadmin',
      password:    superAdminPw,
      role:        'SuperAdmin',
      gender:      'Male',
      age:         35,
      status:      'true',
      locked:      'false',
      isFirstLogin:'false',
      activeStatus:'Active',
      email:       'superadmin@company.com',
      createdDate: now,
      createdBy:   1,
      departmentId: hrDept.id,
      positionId:   hrMgrPos.id,
    },
  });

  const adminPw = await hash('Admin@123');
  const admin = await prisma.user.upsert({
    where:  { userName: 'admin' },
    update: {},
    create: {
      fullName:    'HR Administrator',
      userName:    'admin',
      password:    adminPw,
      role:        'Admin',
      gender:      'Female',
      age:         30,
      status:      'true',
      locked:      'false',
      isFirstLogin:'false',
      activeStatus:'Active',
      email:       'admin@company.com',
      createdDate: now,
      createdBy:   superAdmin.id,
      departmentId: hrDept.id,
      positionId:   hrMgrPos.id,
    },
  });

  const empPw = await hash('Employee@123');
  const empUser = await prisma.user.upsert({
    where:  { userName: 'employee1' },
    update: {},
    create: {
      fullName:    'John Employee',
      userName:    'employee1',
      password:    empPw,
      role:        'Employee',
      gender:      'Male',
      age:         28,
      status:      'true',
      locked:      'false',
      isFirstLogin:'false',
      activeStatus:'Active',
      email:       'employee1@company.com',
      createdDate: now,
      createdBy:   admin.id,
      departmentId: engDept.id,
      positionId:   engPos.id,
      managerId:    admin.id,
    },
  });
  console.log('✅ Users:');
  console.log('   👤 superadmin  / Admin@123   (SuperAdmin)');
  console.log('   👤 admin       / Admin@123   (Admin)');
  console.log('   👤 employee1   / Employee@123 (Employee)');

  // ── Employee records ─────────────────────────────────────────────────────
  await prisma.employee.upsert({
    where:  { email: 'employee1@company.com' },
    update: {},
    create: {
      employeeNumber: 'EMP-00001',
      firstName:  'John',
      lastName:   'Employee',
      email:      'employee1@company.com',
      phone:      '+1-555-000-0001',
      departmentId: engDept.id,
      positionId:   engPos.id,
      hireDate:   new Date('2023-01-01'),
      gender:     'Male',
      birthDate:  new Date('1996-06-15'),
      age:        28,
      nationality: 'Ethiopian',
      contractType:   'Permanent',
      employmentType: 'Full-time',
      workLocation:   'Head Office',
      isActive:   true,
      userId:     empUser.id,
    },
  });

  await prisma.employee.upsert({
    where:  { email: 'admin@company.com' },
    update: {},
    create: {
      employeeNumber: 'EMP-00002',
      firstName:  'HR',
      lastName:   'Administrator',
      email:      'admin@company.com',
      phone:      '+1-555-000-0002',
      departmentId: hrDept.id,
      positionId:   hrMgrPos.id,
      hireDate:   new Date('2020-03-01'),
      gender:     'Female',
      birthDate:  new Date('1994-03-20'),
      age:        30,
      nationality: 'Ethiopian',
      contractType:   'Permanent',
      employmentType: 'Full-time',
      workLocation:   'Head Office',
      isActive:   true,
      userId:     admin.id,
    },
  });
  console.log('✅ Employee records linked');

  // ── Leave Types ──────────────────────────────────────────────────────────
  await Promise.all([
    prisma.leaveType.upsert({ where: { name: 'Annual Leave' }, update: {}, create: { name: 'Annual Leave', description: 'Paid annual leave', maxDays: 20, isPaid: true, isActive: true } }),
    prisma.leaveType.upsert({ where: { name: 'Sick Leave' }, update: {}, create: { name: 'Sick Leave', description: 'Medical/sick leave', maxDays: 10, isPaid: true, isActive: true } }),
    prisma.leaveType.upsert({ where: { name: 'Unpaid Leave' }, update: {}, create: { name: 'Unpaid Leave', description: 'Unpaid leave of absence', maxDays: 30, isPaid: false, isActive: true } }),
    prisma.leaveType.upsert({ where: { name: 'Maternity Leave' }, update: {}, create: { name: 'Maternity Leave', description: 'Maternity leave', maxDays: 90, isPaid: true, isActive: true } }),
    prisma.leaveType.upsert({ where: { name: 'Emergency Leave' }, update: {}, create: { name: 'Emergency Leave', description: 'Family emergency', maxDays: 5, isPaid: true, isActive: true } }),
  ]);
  console.log('✅ Leave Types: Annual, Sick, Unpaid, Maternity, Emergency');

  // ── Evaluation Criteria ──────────────────────────────────────────────────
  const criteriaData = [
    { title: 'Quality of Work',         description: 'Accuracy, thoroughness, and reliability of output' },
    { title: 'Productivity',            description: 'Volume of work completed within expected timeframes' },
    { title: 'Communication Skills',    description: 'Clarity, professionalism and effectiveness in communication' },
    { title: 'Teamwork & Collaboration',description: 'Cooperation, support and contribution to team goals' },
    { title: 'Initiative & Innovation', description: 'Proactiveness, problem-solving and creative thinking' },
  ];
  const createdCriteria = [];
  for (let i = 0; i < criteriaData.length; i++) {
    const c = criteriaData[i];
    const created = await prisma.evaluationCriteria.upsert({
      where:  { criteriaID: i + 1 },
      update: {},
      create: {
        title:        c.title,
        description:  c.description,
        createdBy:    admin.id,
        createdDate:  now,
        isAuthorized: true,
        authorizedBy: superAdmin.id,
        authorizedDate: now,
      },
    });
    createdCriteria.push(created);
  }
  console.log('✅ Evaluation Criteria: 5 criteria (pre-authorized)');

  // ── Default Evaluation Session ────────────────────────────────────────────
  const defaultSession = await prisma.evaluationSession.upsert({
    where:  { sessionID: 1 },
    update: {},
    create: {
      title:       'Q3 2026 Performance Review',
      startDate:   new Date('2026-09-01'),
      endDate:     new Date('2026-09-30'),
      type:        'on',          // active — ready to use immediately
      activatedBy: admin.id,
      passMark:    60,
    },
  });
  // Assign all 5 criteria to the default session
  for (const c of createdCriteria) {
    await prisma.sessionCriteria.upsert({
      where:  { sessionID_criteriaID: { sessionID: defaultSession.sessionID, criteriaID: c.criteriaID } },
      update: {},
      create: { sessionID: defaultSession.sessionID, criteriaID: c.criteriaID, isRequired: true, weight: 1.0 },
    });
  }
  console.log('✅ Default Session:     "Q3 2026 Performance Review" (active, all 5 criteria assigned)');

  // ── Document Category ────────────────────────────────────────────────────
  await prisma.documentCategory.upsert({
    where:  { name: 'General' },
    update: {},
    create: { name: 'General', description: 'General documents' },
  });
  await prisma.documentCategory.upsert({
    where:  { name: 'Contract' },
    update: {},
    create: { name: 'Contract', description: 'Employment contracts' },
  });
  await prisma.documentCategory.upsert({
    where:  { name: 'ID Documents' },
    update: {},
    create: { name: 'ID Documents', description: 'National ID, passport etc.' },
  });
  console.log('✅ Document Categories: General, Contract, ID Documents');

  console.log('\n🎉 Seed complete! You can now log in:\n');
  console.log('   URL:       http://localhost:5173 (or your frontend port)');
  console.log('   Username:  superadmin  |  Password: Admin@123   (SuperAdmin)');
  console.log('   Username:  admin       |  Password: Admin@123   (Admin)');
  console.log('   Username:  employee1   |  Password: Employee@123 (Employee)\n');
  console.log('   Ready to evaluate:');
  console.log('   Session "Q3 2026 Performance Review" is active with 5 criteria assigned.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
