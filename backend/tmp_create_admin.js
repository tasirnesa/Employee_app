const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const username = 'admin_recovered';
  const password = 'Password@123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: 'System Admin (Recovered)',
      userName: username,
      password: hashedPassword,
      role: 'Admin',
      status: 'true',
      locked: 'false',
      isFirstLogin: 'false',
      activeStatus: 'true',
      createdDate: new Date(),
      createdBy: 2,
    }
  });

  console.log('Admin user created successfully!');
  console.log('Username:', username);
  console.log('Password:', password);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
