const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.grade.createMany({
    data: [
      { name: 'G1', minSalary: 8000, midSalary: 10000, maxSalary: 12000, housingPct: 30, transportPct: 15 },
      { name: 'G2', minSalary: 12000, midSalary: 15000, maxSalary: 18000, housingPct: 30, transportPct: 15 },
      { name: 'G3', minSalary: 18000, midSalary: 22000, maxSalary: 28000, housingPct: 30, transportPct: 15 },
      { name: 'G4', minSalary: 28000, midSalary: 35000, maxSalary: 45000, housingPct: 30, transportPct: 15 }
    ],
    skipDuplicates: true,
  });
  console.log('Seeded G1, G2, G3, G4');
}

main().catch(console.error).finally(() => prisma.$disconnect());
