const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Identification', description: 'Passports, National IDs, Drivers Licenses' },
    { name: 'Contracts', description: 'Employment contracts, NDAs' },
    { name: 'Certificates', description: 'Educational and professional certifications' },
    { name: 'Health', description: 'Medical reports, insurance documents' },
    { name: 'Policies', description: 'Signed company policies' }
  ];

  for (const cat of categories) {
    await prisma.documentCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('Seeded document categories');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
