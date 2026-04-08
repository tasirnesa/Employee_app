const recruitmentService = require('../src/services/recruitmentService');
const prisma = require('../src/config/prisma');

async function testRecruitmentFix() {
  console.log('Testing Recruitment appliedDate Fix...');

  try {
    const mockCandidate = {
      firstName: "Me",
      lastName: "One",
      email: `test_${Date.now()}@example.com`,
      phone: "0922770307",
      position: "Graduate Trainee",
      experience: 1,
      education: "BSC",
      skills: ["asas"],
      status: "Applied",
      appliedDate: "2026-04-04",
      notes: "sas",
      interviewDate: null
    };

    console.log('Attempting to create candidate with string date...');
    const result = await recruitmentService.createCandidate(mockCandidate);
    console.log('✓ Candidate created successfully. ID:', result.id);
    console.log('Applied Date in DB:', result.appliedDate);

    if (!(result.appliedDate instanceof Date)) {
        throw new Error('appliedDate is not a Date object in result');
    }

    console.log('\nRECRUITMENT FIX VERIFIED! 🚀');

  } catch (error) {
    console.error('X TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecruitmentFix();
