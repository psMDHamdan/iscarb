// src/lib/assessment/assessment-types.ts

export const ASSESSMENT_TYPE_CONFIG = {
  quiz: {
    label: 'Quiz',
    labelAr: 'اختبار قصير',
    timed: true,
    timeLimitMinutes: 30,
    questionCount: { min: 5, max: 20 },
    questionTypes: ['MCQ', 'short_answer'],
    autoGrade: true,
    aiScored: false, // MCQ is auto-graded
    aiGenerated: true,
    attemptsAllowed: 2,
    weightInGrade: 0.10,
  },

  exam: {
    label: 'Exam',
    labelAr: 'امتحان',
    timed: true,
    timeLimitMinutes: 120,
    questionCount: { min: 20, max: 50 },
    questionTypes: ['MCQ', 'essay', 'short_answer'],
    autoGrade: false, // essays need AI/faculty scoring
    aiScored: true,
    aiGenerated: true,
    attemptsAllowed: 1,
    weightInGrade: 0.40,
    proctored: true,
  },

  assignment: {
    label: 'Assignment',
    labelAr: 'تكليف',
    timed: false,
    questionCount: { min: 1, max: 5 },
    questionTypes: ['essay', 'file_upload', 'coding'],
    autoGrade: false,
    aiScored: true,
    aiGenerated: true,
    attemptsAllowed: 1,
    weightInGrade: 0.25,
    deadlineDays: 7,
  },

  coding: {
    label: 'Coding Challenge',
    labelAr: 'تحدي برمجي',
    timed: true,
    timeLimitMinutes: 90,
    questionCount: { min: 1, max: 3 },
    questionTypes: ['coding'],
    autoGrade: true, // test cases
    aiScored: true, // code quality via AI
    aiGenerated: true,
    attemptsAllowed: 3,
    weightInGrade: 0.15,
  },

  viva: {
    label: 'Viva Voce',
    labelAr: 'مناقشة شفهية',
    timed: true,
    timeLimitMinutes: 30,
    questionCount: { min: 5, max: 10 },
    questionTypes: ['short_answer'],
    autoGrade: false,
    aiScored: true, // AI interview simulation
    aiGenerated: true,
    attemptsAllowed: 1,
    weightInGrade: 0.10,
  },

  practice: {
    label: 'Practice',
    labelAr: 'تدريب',
    timed: false,
    questionCount: { min: 5, max: 20 },
    questionTypes: ['MCQ', 'short_answer'],
    autoGrade: true,
    aiScored: false,
    aiGenerated: true,
    attemptsAllowed: 999,
    weightInGrade: 0,
  },

  employability: {
    label: 'Employability',
    labelAr: 'التوظيفية',
    timed: false,
    questionCount: { min: 47, max: 47 },
    questionTypes: ['essay'],
    autoGrade: false,
    aiScored: true,
    aiGenerated: false, // static catalog
    attemptsAllowed: 1,
    weightInGrade: 0, // separate from course grades
  },
} as const;
