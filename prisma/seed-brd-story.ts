import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding perfect BRD user story...");

  // 1. Create a top-tier University
  const university = await prisma.university.upsert({
    where: { code: 'KFUPM' },
    update: {},
    create: {
      code: 'KFUPM',
      name: 'King Fahd University of Petroleum and Minerals',
      city: 'Dhahran',
      active: true,
    }
  });

  // 2. Create a Software Engineering Course
  const course = await prisma.course.upsert({
    where: { code: 'SWE-411' },
    update: {},
    create: {
      code: 'SWE-411',
      name: 'Software Engineering Project',
      programType: 'Engineering',
      nqfLevel: 7,
      bloomTarget: 'Create',
      domains: 'Software Architecture, Project Management',
      universityId: university.id,
    }
  });

  // 3. Create the Student (Alice)
  const student = await prisma.student.upsert({
    where: { email: 'alice.swe@kfupm.edu.sa' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice.swe@kfupm.edu.sa',
      university: 'KFUPM',
      universityId: university.id,
      college: 'CCSE',
      program: 'Software Engineering',
      cohort: '2022',
      discoverable: true,
    }
  });

  // 4. Enroll Alice in the Course
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      universityId: university.id,
      semester: '2026-1',
    }
  });

  // 5. Create an Assessment Response for Alice (perfect score)
  const response = await prisma.assessmentResponse.create({
    data: {
      studentId: student.id,
      moduleCode: 'SWE-CAPSTONE-1',
      dimension: 'Software Architecture',
      specialization: 'Software Engineering',
      score: 95.0,
      band: 'Advanced',
      passed: true,
      perCriterionJson: JSON.stringify({}),
      feedback: 'Excellent demonstration of architectural patterns.',
      strengthsJson: JSON.stringify(['Microservices', 'Clean Architecture']),
      improvementsJson: JSON.stringify([]),
      model: 'gpt-4o',
      source: 'assessment-engine',
      universityId: university.id,
    }
  });

  // 6. Create the Employability Profile (composite 4.5 out of 5)
  const profile = await prisma.employabilityProfile.upsert({
    where: { studentId: student.id },
    update: { composite: 4.5, band: 'Elite' },
    create: {
      studentId: student.id,
      specialization: 'Software Engineering',
      composite: 4.5,
      band: 'Elite',
      passed: true,
      dimensionsJson: JSON.stringify({ 'Problem Solving': 4.8, 'Coding': 4.5, 'Design': 4.2 }),
      coveredJson: JSON.stringify(['SWE-411']),
    }
  });

  console.log("Seeding complete!");
  console.log(`Student ID: ${student.id}`);
  console.log(`Course ID: ${course.id}`);
  console.log(`University ID: ${university.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
