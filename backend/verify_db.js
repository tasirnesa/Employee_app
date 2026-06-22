const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function verify() {
  const grades = await p.grade.findMany();
  console.log('=== GRADES ===');
  console.log(JSON.stringify(grades, null, 2));

  const positions = await p.position.findMany({ include: { grade: true } });
  console.log('\n=== POSITIONS (with grade) ===');
  console.log(JSON.stringify(positions, null, 2));

  await p.$disconnect();
}

verify().catch(e => { console.error(e); process.exit(1); });
