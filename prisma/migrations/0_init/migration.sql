-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobOpeningStatus" AS ENUM ('draft', 'open', 'submitted', 'filled', 'archived');

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "programType" TEXT NOT NULL,
    "nqfLevel" INTEGER NOT NULL,
    "bloomTarget" TEXT NOT NULL,
    "domains" TEXT NOT NULL,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPrompt" (
    "id" TEXT NOT NULL,
    "unitId" TEXT,
    "stage" TEXT NOT NULL,
    "modelTag" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "university" TEXT NOT NULL DEFAULT 'KFU',
    "universityId" TEXT,
    "college" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "cohort" TEXT NOT NULL,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "scedSpecializationCode" TEXT,
    "educationLevelCode" TEXT DEFAULT '6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "guardianConsentAt" TIMESTAMP(3),
    "aiOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "targetCareerName" TEXT,
    "targetCareerUri" TEXT,
    "lastAIBriefing" TIMESTAMP(3),
    "totalStudyHours" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "rank" TEXT NOT NULL DEFAULT 'Assistant Professor',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT,
    "facultyId" TEXT,
    "semester" TEXT NOT NULL DEFAULT '2026-1',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "semester" TEXT NOT NULL,
    "letter" TEXT NOT NULL DEFAULT '-',
    "gpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'physical',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveParticipation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "interactionsCount" INTEGER NOT NULL DEFAULT 0,
    "avgInputQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promptsAccepted" INTEGER NOT NULL DEFAULT 0,
    "peerEndorsements" INTEGER NOT NULL DEFAULT 0,
    "promptQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "ActiveParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeAdjustment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "oldGrade" DOUBLE PRECISION NOT NULL,
    "newGrade" DOUBLE PRECISION NOT NULL,
    "justificationReason" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "deanNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "universityId" TEXT,

    CONSTRAINT "GradeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeanNotification" (
    "id" TEXT NOT NULL,
    "universityId" TEXT,
    "courseId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "adjustmentId" TEXT,
    "sectionAdjustments" INTEGER NOT NULL,
    "sectionEnrolled" INTEGER NOT NULL,
    "thresholdPct" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeanNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "opening" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillsJson" TEXT NOT NULL,
    "contentJson" TEXT,
    "evalScore" DOUBLE PRECISION,
    "evalConfidence" DOUBLE PRECISION,
    "evalRubricJson" TEXT,
    "evalModel" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "artifactUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerMapping" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "generatedTitle" TEXT NOT NULL,
    "titleAr" TEXT,
    "cluster" TEXT NOT NULL,
    "sscoCode" TEXT,
    "iscoMajorGroup" TEXT,
    "alignment" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "skillsEvidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAgent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lastNudge" TEXT,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "skillsJson" TEXT NOT NULL,
    "reward" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeTeam" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "submission" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "ChallengeTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSignal" (
    "id" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "demandIndex" INTEGER NOT NULL,
    "trend" TEXT NOT NULL DEFAULT 'rising',
    "rolesOpen" INTEGER NOT NULL DEFAULT 0,
    "vision2030" BOOLEAN NOT NULL DEFAULT false,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentModule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "specialization" TEXT,
    "level" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "generated" BOOLEAN NOT NULL DEFAULT false,
    "rubricJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "specialization" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "band" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "perCriterionJson" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "strengthsJson" TEXT NOT NULL,
    "improvementsJson" TEXT NOT NULL,
    "validationPassed" BOOLEAN,
    "model" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rawResponse" TEXT,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployabilityProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialization" TEXT,
    "composite" DOUBLE PRECISION NOT NULL,
    "band" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "dimensionsJson" TEXT NOT NULL,
    "coveredJson" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployabilityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScedField" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "parentCode" TEXT,
    "nqfLevel" INTEGER,
    "iscedLevel" INTEGER,
    "coursesEn" TEXT,
    "coursesAr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScedField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsccoOccupation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "parentCode" TEXT,
    "iscoCode" TEXT,
    "skillLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SsccoOccupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquityLedger" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "equityScore" INTEGER NOT NULL DEFAULT 0,
    "learningHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "challengesScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skillsCount" INTEGER NOT NULL DEFAULT 0,
    "breakdownJson" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "EquityLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquityEvent" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerPath" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "targetSscoCode" TEXT,
    "targetComposite" INTEGER NOT NULL DEFAULT 80,
    "rationaleEn" TEXT,
    "rationaleAr" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerStage" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "focusEn" TEXT,
    "focusAr" TEXT,
    "activitiesJson" TEXT NOT NULL,
    "targetComposite" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CareerStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioReview" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengthsJson" TEXT NOT NULL,
    "gapsJson" TEXT NOT NULL,
    "marketComparison" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "employer" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT,
    "sscoCode" TEXT,
    "minComposite" INTEGER NOT NULL DEFAULT 0,
    "skillsJson" TEXT NOT NULL,
    "skills" JSONB,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "jobType" TEXT,
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "vision2030" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "views" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "externalId" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recruiterId" TEXT,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "sscoScore" INTEGER NOT NULL,
    "compositeScore" INTEGER NOT NULL,
    "skillsScore" INTEGER NOT NULL,
    "vision2030Bonus" INTEGER NOT NULL,
    "breakdownJson" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingProgram" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "sector" TEXT,
    "amountNote" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingSave" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentBadge" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeCode" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "R2CArtifact" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "requirement" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "prismaSchema" TEXT NOT NULL,
    "mermaidDiagram" TEXT NOT NULL,
    "dockerCompose" TEXT NOT NULL,
    "testsCode" TEXT NOT NULL,
    "checklistJson" TEXT NOT NULL,
    "stack" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "R2CArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentOnboarding" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL DEFAULT 1,
    "interests" TEXT NOT NULL DEFAULT '',
    "strengths" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTask" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "category" TEXT NOT NULL DEFAULT 'explore',
    "ctaView" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "employerLogo" TEXT,
    "title" TEXT,
    "status" TEXT DEFAULT 'active',
    "preferences" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPool" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "autoRule" TEXT,
    "filtersJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPoolMember" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentPoolMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'discovered',
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "salaryPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterActivity" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "studentId" TEXT,
    "action" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationChecklist" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraduationChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillExploration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "sscoCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "notes" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillExploration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerCard" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "sscoCode" TEXT,
    "cluster" TEXT NOT NULL,
    "dayInLifeEn" TEXT NOT NULL,
    "dayInLifeAr" TEXT NOT NULL,
    "skillsJson" TEXT NOT NULL DEFAULT '[]',
    "salaryRangeSAR" TEXT,
    "vision2030" BOOLEAN NOT NULL DEFAULT true,
    "demandIndex" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "currentLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetLevel" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "activitiesJson" TEXT NOT NULL DEFAULT '[]',
    "lastPracticedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "supervisorName" TEXT,
    "supervisorEmail" TEXT,
    "learningOutcomesJson" TEXT NOT NULL DEFAULT '[]',
    "skillsJson" TEXT NOT NULL DEFAULT '[]',
    "evaluationScore" DOUBLE PRECISION,
    "evaluationNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPrep" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "targetSsco" TEXT,
    "targetTitle" TEXT,
    "sessionsJson" TEXT NOT NULL DEFAULT '[]',
    "readiness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewPrep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expertiseJson" TEXT NOT NULL DEFAULT '[]',
    "sscoCode" TEXT,
    "bio" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipSession" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorshipSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "url" TEXT,
    "body" TEXT NOT NULL,
    "cluster" TEXT,
    "specialization" TEXT,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentContent" (
    "id" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "specialization" TEXT,
    "section" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "citationsJson" TEXT NOT NULL DEFAULT '[]',
    "yearTier" TEXT NOT NULL DEFAULT 'intro',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedBy" TEXT NOT NULL DEFAULT 'llm',
    "model" TEXT,
    "reviewedBy" TEXT,
    "reviewerNote" TEXT,
    "unverifiedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT NOT NULL,
    "organizerType" TEXT NOT NULL DEFAULT 'iscarb',
    "organizerName" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'virtual',
    "location" TEXT,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "hackathonStart" TIMESTAMP(3) NOT NULL,
    "hackathonEnd" TIMESTAMP(3) NOT NULL,
    "judgingEnd" TIMESTAMP(3) NOT NULL,
    "prizePoolSAR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prizesJson" TEXT,
    "challengesJson" TEXT,
    "maxTeamSize" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "vision2030" BOOLEAN NOT NULL DEFAULT true,
    "sscoTargetsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackathonRegistration" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackathonTeam" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectTitle" TEXT,
    "projectSummary" TEXT,
    "projectUrl" TEXT,
    "demoUrl" TEXT,
    "score" DOUBLE PRECISION,
    "rank" INTEGER,
    "prizeWonSAR" DOUBLE PRECISION,
    "judgeNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HackathonTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackathonTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "projectId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cluster" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "targetOccupationsJson" TEXT NOT NULL DEFAULT '[]',
    "dispositionTagsJson" TEXT NOT NULL DEFAULT '[]',
    "url" TEXT,
    "costNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseConcept" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,

    CONSTRAINT "CourseConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationConcept" (
    "id" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,

    CONSTRAINT "CertificationConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptPrerequisite" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "ConceptPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "universityId" TEXT,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "policyVersion" TEXT,
    "policyHash" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "universityId" TEXT,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuedCredential" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "claimsJson" TEXT NOT NULL DEFAULT '{}',
    "ob3BadgeId" TEXT,
    "vcJson" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "universityId" TEXT,

    CONSTRAINT "IssuedCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" JSONB,
    "organizationId" TEXT,
    "requestId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "bodyEn" TEXT,
    "bodyAr" TEXT,
    "metaJson" TEXT NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAgentMessage" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disabled',
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "universityId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "headline" TEXT,
    "bio" TEXT,
    "profileImage" TEXT,
    "bannerImage" TEXT,
    "shareToken" TEXT,
    "shareExpiresAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiGeneratedDescription" TEXT,
    "skillsExtracted" TEXT,
    "projectImpact" TEXT,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioEntry" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAchievement" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "credentialUrl" TEXT,
    "badgeUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSkill" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "endorsementCount" INTEGER NOT NULL DEFAULT 0,
    "yearsExperience" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEndorsement" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "endorsedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "endorsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "SkillEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioCareerProfile" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "preferredLocations" TEXT NOT NULL DEFAULT '[]',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "industryPreferences" TEXT NOT NULL DEFAULT '[]',
    "workType" TEXT NOT NULL DEFAULT '[]',
    "openToRemote" BOOLEAN NOT NULL DEFAULT true,
    "visaSponsorship" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioCareerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioShareLink" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioView" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "viewerId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "universityId" TEXT,
    "parentTopicId" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeBaseTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseArticle" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "estimatedReadTime" INTEGER,
    "tags" TEXT NOT NULL,
    "relatedArticleIds" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeBaseArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER,

    CONSTRAINT "KnowledgeBaseView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseFeedback" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "isHelpful" BOOLEAN,
    "rating" INTEGER,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBaseFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseSearch" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "topicMatches" INTEGER NOT NULL DEFAULT 0,
    "articleMatches" INTEGER NOT NULL DEFAULT 0,
    "resultClicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedItemId" TEXT,
    "sessionId" TEXT,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBaseSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "timeLimit" INTEGER,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeAnswers" BOOLEAN NOT NULL DEFAULT false,
    "passPercentage" INTEGER,
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "instructionsJson" TEXT,
    "pointsPossible" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rubricCriterionId" TEXT,
    "optionsJson" TEXT,
    "scenarioContext" TEXT,
    "branchingRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "scoredAt" TIMESTAMP(3),
    "totalScore" DOUBLE PRECISION,
    "totalPoints" DOUBLE PRECISION,
    "percentageScore" DOUBLE PRECISION,
    "submissionToken" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "sessionId" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiGeneratedFeedback" TEXT,
    "keyWeaknesses" TEXT,
    "nextRecommendedAction" TEXT,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestionResponse" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseText" TEXT,
    "selectedAnswer" TEXT,
    "fileUrl" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentQuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "keywords" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScore" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "scoredBy" TEXT,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationSession" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "facilitated" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationScoreAdjustment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "oldScore" DOUBLE PRECISION NOT NULL,
    "newScore" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "researchType" TEXT NOT NULL,
    "datasets" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "doiAssigned" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "doi" TEXT NOT NULL,
    "fields" INTEGER NOT NULL,
    "records" INTEGER NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "documentation" TEXT,
    "tags" TEXT NOT NULL,
    "updateFrequency" TEXT NOT NULL DEFAULT 'static',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetAccess" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "requestId" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DatasetAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchOutcome" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "doi" TEXT,
    "abstract" TEXT,
    "publishedAt" TIMESTAMP(3),
    "citations" INTEGER NOT NULL DEFAULT 0,
    "journal" TEXT,
    "authors" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "checkName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "evidence" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextCheck" TIMESTAMP(3),

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchAnalytics" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,

    CONSTRAINT "ResearchAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requestId" TEXT,
    "format" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trigger" TEXT NOT NULL,
    "triggerConfig" TEXT NOT NULL DEFAULT '{}',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stepType" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "actionType" TEXT,
    "actionConfig" TEXT NOT NULL DEFAULT '{}',
    "condition" TEXT,
    "conditionLogic" TEXT NOT NULL DEFAULT 'AND',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvers" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "onErrorAction" TEXT NOT NULL DEFAULT 'skip',
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "triggerData" TEXT NOT NULL DEFAULT '{}',
    "entityType" TEXT,
    "entityId" TEXT,
    "currentStepId" TEXT,
    "result" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStepExecution" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT NOT NULL DEFAULT '{}',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStepExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approverIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "approvalHistory" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "thumbnail" TEXT,
    "workflowConfig" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTrigger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workflows" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSchedule" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastExecutedAt" TIMESTAMP(3),
    "nextExecutionAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "maxExecutions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "recipientId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "readAt" TIMESTAMP(3),
    "readBy" TEXT NOT NULL DEFAULT '[]',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "participants" TEXT NOT NULL DEFAULT '[]',
    "creatorId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "content" TEXT NOT NULL,
    "contentAr" TEXT,
    "type" TEXT NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "publishedByType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'all',
    "visibleTo" TEXT NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "readBy" TEXT NOT NULL DEFAULT '[]',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "location" TEXT,
    "eventType" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "recurrence" TEXT,
    "recurrenceEnd" TIMESTAMP(3),
    "organizerId" TEXT NOT NULL,
    "participantIds" TEXT NOT NULL DEFAULT '[]',
    "capacity" INTEGER,
    "registered" INTEGER NOT NULL DEFAULT 0,
    "registrations" TEXT NOT NULL DEFAULT '[]',
    "roomNumber" TEXT,
    "buildingCode" TEXT,
    "onlineUrl" TEXT,
    "meetingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "reminders" TEXT NOT NULL DEFAULT '[]',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "rating" INTEGER,

    CONSTRAINT "CalendarRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "announcementNotifications" BOOLEAN NOT NULL DEFAULT true,
    "calendarReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "quietHours" TEXT,
    "doNotDisturbDays" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sourceId" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "parentRoleId" TEXT,
    "inheritsPermissions" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deprecatedAt" TIMESTAMP(3),
    "deprecationReason" TEXT,
    "deprecationAlternativeRoleId" TEXT,
    "allowsBulkAssignment" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentAssignments" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "updatedBy" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'organization',
    "isSystemPermission" BOOLEAN NOT NULL DEFAULT true,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "deprecationReason" TEXT,
    "deprecatedAlternativeId" TEXT,
    "auditLogging" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elevatedRoleId" TEXT NOT NULL,
    "elevationStart" TIMESTAMP(3) NOT NULL,
    "elevationEnd" TIMESTAMP(3) NOT NULL,
    "justification" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbacPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "conditionExpression" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbacPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "totalAffected" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "requestedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpening" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "requiredCompetencies" TEXT NOT NULL DEFAULT '[]',
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "location" TEXT NOT NULL DEFAULT 'Remote',
    "status" "JobOpeningStatus" NOT NULL DEFAULT 'draft',
    "focusAreasJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSubmission" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "feedbackJson" TEXT,
    "matchScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTemplate" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "competencies" TEXT NOT NULL DEFAULT '[]',
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "location" TEXT NOT NULL DEFAULT 'Remote',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEvaluation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "feedback" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "scheduledBy" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "benefits" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTemplate" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "longDescription" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'role',
    "subcategory" TEXT,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'intermediate',
    "industry" TEXT,
    "roleTitle" TEXT,
    "estimatedTimeMinutes" INTEGER,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "previewJson" TEXT NOT NULL DEFAULT '{}',
    "rubricPreview" TEXT NOT NULL DEFAULT '{}',
    "learningOutcomes" TEXT NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateLicense" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL DEFAULT 'open_source',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "pricingModel" TEXT NOT NULL DEFAULT 'per_purchase',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "freeTrialDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateRating" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "isHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateDeployment" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "deployedBy" TEXT NOT NULL,
    "templateVersionAtDeploy" INTEGER NOT NULL DEFAULT 1,
    "isCustomized" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "TemplateDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicensePurchase" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "buyerOrgId" TEXT,
    "licenseType" TEXT NOT NULL,
    "pricePaidCents" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'stripe',
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicensePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueTransaction" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "revenueCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "payoutStatus" TEXT NOT NULL DEFAULT 'pending',
    "payoutDate" TIMESTAMP(3),
    "stripeTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'user',
    "universityId" TEXT,
    "config" TEXT NOT NULL,
    "filters" TEXT,
    "metrics" TEXT NOT NULL,
    "dimensions" TEXT,
    "query" TEXT,
    "queryType" TEXT NOT NULL DEFAULT 'aggregation',
    "dataSource" TEXT,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedulePattern" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "outputFormat" TEXT NOT NULL DEFAULT 'json',
    "fileSize" INTEGER,
    "rowCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "lastError" TEXT,
    "executionTimeMs" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecution" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "durationMs" INTEGER,
    "rowsProcessed" INTEGER,
    "rowsReturned" INTEGER,
    "error" TEXT,
    "errorStack" TEXT,
    "outputPath" TEXT,
    "outputFormat" TEXT NOT NULL DEFAULT 'json',
    "outputSize" INTEGER,
    "runtimeFilters" TEXT,
    "runtimeMetrics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "autoGenerate" BOOLEAN NOT NULL DEFAULT true,
    "autoEmail" BOOLEAN NOT NULL DEFAULT false,
    "emailRecipients" TEXT,
    "retentionDays" INTEGER,
    "maxVersions" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "compression" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "filters" TEXT,
    "includedColumns" TEXT,
    "exportedBy" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "aggregationType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "formula" TEXT,
    "format" TEXT,
    "precision" INTEGER,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDimension" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "dataField" TEXT NOT NULL,
    "valueFormat" TEXT,
    "parentDimension" TEXT,
    "hierarchyLevel" INTEGER,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "dimensions" TEXT,
    "filters" TEXT,
    "icon" TEXT,
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAlert" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyDashboard" BOOLEAN NOT NULL DEFAULT true,
    "recipients" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "phoneCode" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Government" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ministry',
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Government_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "governmentId" TEXT,
    "countryId" TEXT,
    "parentId" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "domain" TEXT,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ssoProvider" TEXT,
    "ssoConfig" TEXT DEFAULT '{}',
    "mfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" TEXT NOT NULL DEFAULT 'student',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" TEXT NOT NULL,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "totpSecret" TEXT,
    "mfaMethod" TEXT NOT NULL DEFAULT 'email',
    "secret" TEXT,
    "phoneHash" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaBackupCode" (
    "id" TEXT NOT NULL,
    "mfaSettingsId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaBackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "mfaSettingsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT,
    "apiKeyId" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "method" TEXT NOT NULL DEFAULT 'password',
    "geoLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReview" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewType" TEXT NOT NULL DEFAULT 'quarterly',
    "organizationId" TEXT,
    "createdBy" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReviewItem" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "certifiedBy" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReport" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organizationId" TEXT,
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "content" TEXT,
    "filePath" TEXT,
    "format" TEXT NOT NULL DEFAULT 'json',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'archive',
    "organizationId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "status" TEXT NOT NULL DEFAULT 'open',
    "category" TEXT NOT NULL,
    "reportedBy" TEXT,
    "assignedTo" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RdfSyncState" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "universityCode" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,
    "tripleCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'synced',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RdfSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SamlConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "idpEntityId" TEXT NOT NULL,
    "idpSsoUrl" TEXT NOT NULL,
    "idpCertificate" TEXT NOT NULL,
    "spEntityId" TEXT NOT NULL,
    "spAcsUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "attributeMappings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SamlConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "authorizationEndpoint" TEXT NOT NULL,
    "tokenEndpoint" TEXT NOT NULL,
    "userinfoEndpoint" TEXT NOT NULL,
    "jwksUri" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "redirectUris" TEXT NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "OAuthClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAuthorization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "grantedScopes" TEXT NOT NULL DEFAULT '[]',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "refreshToken" TEXT,

    CONSTRAINT "OAuthAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgFaculty" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgFaculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProgram" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degreeLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgTeam" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationHierarchy" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "path" TEXT,

    CONSTRAINT "OrganizationHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delegation" (
    "id" TEXT NOT NULL,
    "delegatorId" TEXT NOT NULL,
    "delegateeId" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "reason" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalFlow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "operationType" TEXT NOT NULL,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "approverRole" TEXT,
    "approverId" TEXT,
    "slaHours" INTEGER NOT NULL DEFAULT 24,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operationData" TEXT NOT NULL,
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceLog" (
    "id" TEXT NOT NULL,
    "regulation" TEXT NOT NULL,
    "controlId" TEXT,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "details" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'logged',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "ComplianceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityAnalytics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION,
    "dimensions" TEXT,
    "organizationId" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),

    CONSTRAINT "IdentityAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "code" TEXT,
    "departmentId" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "departmentId" TEXT,
    "leaderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'manual',
    "organizationId" TEXT,
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTimeline" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyFramework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyDefinition" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "parentId" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCompetencyGraph" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "currentLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetLevel" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAssessedAt" TIMESTAMP(3),
    "assessmentCount" INTEGER NOT NULL DEFAULT 0,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCompetencyGraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanDevelopmentTimeline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDescription" TEXT,
    "category" TEXT NOT NULL,
    "metadata" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanDevelopmentTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevelopmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanGoal" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dependencies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionJournal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "tags" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReflectionJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitTracker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitName" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalCompletions" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HabitTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitCompletion" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellnessIndicator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "indicatorType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "WellnessIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campusId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'main',
    "floors" INTEGER NOT NULL DEFAULT 1,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "level" TEXT,
    "area" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "area" DOUBLE PRECISION,
    "hasProjector" BOOLEAN NOT NULL DEFAULT false,
    "hasAudio" BOOLEAN NOT NULL DEFAULT false,
    "hasVideo" BOOLEAN NOT NULL DEFAULT false,
    "hasWhiteboard" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'available',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serialNumber" TEXT,
    "model" TEXT,
    "manufacturer" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "warrantyExpiry" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "assignedTo" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "recurring" TEXT,
    "recurringEnd" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "steps" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationComplianceCheck" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "regulation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastChecked" TIMESTAMP(3),
    "nextCheck" TIMESTAMP(3),
    "checkedBy" TEXT,
    "evidence" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'operational',
    "likelihood" INTEGER NOT NULL DEFAULT 3,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "mitigation" TEXT,
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requesterId" TEXT NOT NULL,
    "approverIds" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "decisionComment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "data" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'academic',
    "chairId" TEXT,
    "memberIds" TEXT,
    "meetingSchedule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "establishedDate" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "category" TEXT,
    "salaryRangeMin" DOUBLE PRECISION,
    "salaryRangeMax" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT,
    "jobTitleId" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "salary" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingStructure" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "departmentId" TEXT,
    "reportsTo" TEXT DEFAULT 'direct',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parentCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'document',
    "format" TEXT NOT NULL DEFAULT 'markdown',
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "qualityScore" DOUBLE PRECISION,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentApproval" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approverId" TEXT NOT NULL,
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "lastEditedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiRevision" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteShare" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchPaper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "authors" TEXT,
    "doi" TEXT,
    "journal" TEXT,
    "year" INTEGER,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "url" TEXT,
    "organizationId" TEXT,
    "authorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "size" BIGINT,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "license" TEXT,
    "url" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProtocol" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'apa',
    "content" TEXT NOT NULL,
    "doi" TEXT,
    "crossrefId" TEXT,
    "pubmedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSync" TIMESTAMP(3),
    "organizationId" TEXT,
    "config" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeIngestionJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "documentsCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeIngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeQualityCheck" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "score" DOUBLE PRECISION,
    "issues" TEXT,
    "recommendations" TEXT,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeQualityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeVersion" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeApproval" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approverId" TEXT NOT NULL,
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "config" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAutomationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeAutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "tokensInput" INTEGER NOT NULL DEFAULT 0,
    "tokensOutput" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "provider" TEXT NOT NULL,
    "endpoint" TEXT,
    "apiKeyEncrypted" TEXT,
    "config" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "health" TEXT NOT NULL DEFAULT 'healthy',
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "costPer1kInput" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "costPer1kOutput" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModelVersion" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "config" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModelMetric" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "config" TEXT,
    "tools" TEXT,
    "systemPrompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentSession" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiAgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "toolResults" TEXT,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "embedding" TEXT,
    "metadata" TEXT,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "dependencies" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiReflection" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "insights" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiredRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiToolExecution" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "params" TEXT NOT NULL,
    "result" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiToolExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiEvaluation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFeedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "helpful" BOOLEAN,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AiAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMetric" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimensions" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReply" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "metadata" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT,
    "category" TEXT NOT NULL DEFAULT 'system',
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSection" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "batch" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCohort" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumCourse" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "credits" DOUBLE PRECISION NOT NULL,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeRequirement" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DegreeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicRegulation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRegulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOutcome" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bloomsLevel" TEXT NOT NULL DEFAULT 'apply',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prerequisite" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteCourseId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseResource" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "filePath" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT,
    "duration" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningObjective" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bloomsLevel" TEXT NOT NULL DEFAULT 'understand',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "classroomId" TEXT,
    "facultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExaminationSchedule" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExaminationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditRule" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "minCredits" DOUBLE PRECISION NOT NULL,
    "maxCredits" DOUBLE PRECISION NOT NULL,
    "gpaRequirement" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicStanding" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "standing" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "creditsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditsRequired" DOUBLE PRECISION NOT NULL,
    "gpaCurrent" DOUBLE PRECISION,
    "gpaRequired" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "estimatedGraduation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraduationProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicResource" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "filePath" TEXT,
    "description" TEXT,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingList" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "items" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAllocation" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "sectionId" TEXT,
    "facultyId" TEXT,
    "classroomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningJourney" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMilestone" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLearningGoal" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLearningGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyLearningGoal" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyLearningGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyLearningGoal" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "monthStart" TIMESTAMP(3) NOT NULL,
    "monthEnd" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyLearningGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardDeck" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "cardCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hints" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "lastReviewed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardReview" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FlashcardReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL DEFAULT 0,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "notes" TEXT,
    "focusScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planData" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyReminder" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMemory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT,
    "concept" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGap" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'detected',
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpacedRepetitionItem" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "courseId" TEXT,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpacedRepetitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryPrediction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "concept" TEXT NOT NULL,
    "predictedMastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "factors" JSONB NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningStreak" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "freezeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperiencePoints" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperiencePoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerLearningGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerLearningGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCredential" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "credentialData" JSONB NOT NULL,
    "verificationUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTranscript" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT,
    "semesterId" TEXT,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "gpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transcriptData" JSONB NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExplainRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'simple',
    "language" TEXT NOT NULL DEFAULT 'en',
    "response" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIExplainRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGeneratedQuiz" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "topic" TEXT,
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "questions" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGeneratedQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIStudyRecommendation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "reasoning" TEXT,
    "accepted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIStudyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AILearningInsight" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actionable" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AILearningInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "principalInvestigatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fundingSource" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchNotebook" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "tags" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchNotebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGoal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "metric" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperCollection" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "paperCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationNetwork" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "citedPaperId" TEXT NOT NULL,
    "citationCount" INTEGER NOT NULL DEFAULT 1,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTrend" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "source" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSummary" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keyFindings" TEXT,
    "methodology" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingListResearch" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "itemIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingListResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchHypothesis" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchHypothesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentDesignResearch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "variables" TEXT,
    "expectedOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentDesignResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerReviewRecord" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER,
    "comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hypothesis" TEXT,
    "methodology" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "results" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentVariable" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentVariable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentVersion" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT,
    "category" TEXT,
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetVersion" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetAnnotation" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "annotationType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "annotatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetValidationRule" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "ruleExpression" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "authors" TEXT,
    "journal" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "doi" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedDate" TIMESTAMP(3),
    "acceptedDate" TIMESTAMP(3),
    "publishedDate" TIMESTAMP(3),
    "impactFactor" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionTracker" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "journalName" TEXT NOT NULL,
    "journalISSN" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "submittedDate" TIMESTAMP(3),
    "reviewDeadline" TIMESTAMP(3),
    "reviewerComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalRecommendation" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "journalName" TEXT NOT NULL,
    "impactFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceListItem" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "referenceText" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "inventors" TEXT,
    "filingDate" TIMESTAMP(3),
    "grantDate" TIMESTAMP(3),
    "patentNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaSubmission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InnovationPipeline" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InnovationPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologyTransfer" (
    "id" TEXT NOT NULL,
    "patentId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "transferType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnologyTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "deadline" TIMESTAMP(3),
    "eligibility" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantApplication" (
    "id" TEXT NOT NULL,
    "grantOpportunityId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amount" DOUBLE PRECISION,
    "submissionDate" TIMESTAMP(3),
    "decisionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "principalInvestigatorId" TEXT NOT NULL,
    "memberIds" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchComment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT,
    "parentCommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertNetwork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expertise" TEXT,
    "institution" TEXT,
    "orcid" TEXT,
    "hIndex" INTEGER,
    "totalCitations" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationMetric" (
    "id" TEXT NOT NULL,
    "researcherId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchImpactScore" (
    "id" TEXT NOT NULL,
    "researcherId" TEXT NOT NULL,
    "projectId" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakdown" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchImpactScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchFundingMetric" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalFunding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeGrants" INTEGER NOT NULL DEFAULT 0,
    "completedGrants" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchFundingMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "locationPref" TEXT,
    "salaryExpectMin" INTEGER,
    "salaryExpectMax" INTEGER,
    "workTypePref" TEXT NOT NULL DEFAULT 'full-time',
    "openToRemote" BOOLEAN NOT NULL DEFAULT false,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "websiteUrl" TEXT,
    "digitalCvHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "category" TEXT NOT NULL DEFAULT 'learning',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'behavioral',
    "employerKey" TEXT,
    "targetRole" TEXT,
    "questionsJson" TEXT NOT NULL DEFAULT '[]',
    "overallScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "communicationScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "improvementPlan" TEXT,
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumni" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "email" TEXT,
    "graduationYear" INTEGER NOT NULL,
    "program" TEXT NOT NULL,
    "university" TEXT NOT NULL DEFAULT 'KFU',
    "currentRole" TEXT,
    "currentCompany" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "bio" TEXT,
    "bioAr" TEXT,
    "linkedinUrl" TEXT,
    "mentorAvailable" BOOLEAN NOT NULL DEFAULT false,
    "successStory" TEXT,
    "successStoryAr" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniConnection" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "providerId" TEXT,
    "providerType" TEXT,
    "providerName" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "gapsJson" TEXT NOT NULL DEFAULT '[]',
    "recommendationsJson" TEXT NOT NULL DEFAULT '[]',
    "jobMatchCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedTimeWeeks" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "userId" TEXT,
    "universityId" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "officeHours" TEXT,
    "officeLocation" TEXT,
    "specializations" TEXT NOT NULL DEFAULT '[]',
    "officeHoursJson" TEXT NOT NULL DEFAULT '[]',
    "preferencesJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyBriefing" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "greeting" TEXT,
    "summary" TEXT,
    "topPriority" TEXT,
    "focusArea" TEXT,
    "tips" TEXT,
    "classesToday" INTEGER NOT NULL DEFAULT 0,
    "meetingsToday" INTEGER NOT NULL DEFAULT 0,
    "pendingGrades" INTEGER NOT NULL DEFAULT 0,
    "studentAlerts" INTEGER NOT NULL DEFAULT 0,
    "generatedBy" TEXT NOT NULL DEFAULT 'k2think',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingPlan" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'lesson',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "objectives" TEXT NOT NULL DEFAULT '[]',
    "activities" TEXT NOT NULL DEFAULT '[]',
    "resources" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'document',
    "url" TEXT,
    "fileKey" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'slide',
    "content" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingTimeline" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "timelineType" TEXT NOT NULL DEFAULT 'milestone',
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeachingTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAlert" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL DEFAULT 'at_risk',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'system',
    "status" TEXT NOT NULL DEFAULT 'open',
    "actionTaken" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRecommendation" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'learning',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyMentee" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "focusAreas" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyMentee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisingSession" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'advising',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "actionItems" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTracking" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyPublication" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL DEFAULT '[]',
    "journal" TEXT,
    "year" INTEGER,
    "doi" TEXT,
    "url" TEXT,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "pubType" TEXT NOT NULL DEFAULT 'journal',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyCertification" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "credentialId" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyAward" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "year" INTEGER,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'teaching',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyWorkshop" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workshopType" TEXT NOT NULL DEFAULT 'attended',
    "organization" TEXT,
    "date" TIMESTAMP(3),
    "hours" DOUBLE PRECISION,
    "certificate" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyWorkshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyTraining" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'teaching',
    "provider" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "hours" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "certificate" TEXT,
    "competencyJson" TEXT NOT NULL DEFAULT '[]',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentDiscussion" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedResource" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT,
    "sharedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'document',
    "fileKey" TEXT,
    "url" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyWorkload" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "coursesCount" INTEGER NOT NULL DEFAULT 0,
    "adviseesCount" INTEGER NOT NULL DEFAULT 0,
    "committeeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "researchHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLoadHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLoadHours" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL DEFAULT 'personal',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyTimetable" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "courseId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "building" TEXT,
    "semester" TEXT NOT NULL,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeAssignment" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "committeeName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyNote" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'general',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyBookmark" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPrompt" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'teaching',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" TEXT NOT NULL DEFAULT '[]',
    "model" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceRecommendation" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "impact" DOUBLE PRECISION NOT NULL,
    "actionUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntelligenceRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityRecord" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "totalRecords" INTEGER NOT NULL,
    "validRecords" INTEGER NOT NULL,
    "issues" TEXT NOT NULL DEFAULT '[]',
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataLineageRecord" (
    "id" TEXT NOT NULL,
    "sourceEntity" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "transformType" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataLineageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkRecord" (
    "id" TEXT NOT NULL,
    "benchmarkType" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "config" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "repeatPattern" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IntelligenceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "baseUrl" TEXT NOT NULL,
    "changelog" TEXT,
    "deprecatedAt" TIMESTAMP(3),
    "sunsetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiEndpoint" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "authRequired" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitTier" TEXT NOT NULL DEFAULT 'read',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "apiKeyId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL,

    CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnector" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "configSchema" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "iconUrl" TEXT,
    "documentation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationConnector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationInstance" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" TEXT NOT NULL DEFAULT '{}',
    "credentials" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "syncCount" INTEGER NOT NULL DEFAULT 0,
    "installedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncJob" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "entitiesSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plugin" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "category" TEXT NOT NULL,
    "configSchema" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "sandboxConfig" TEXT,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "iconUrl" TEXT,
    "repoUrl" TEXT,
    "documentation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plugin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginVersion" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "minPlatformVersion" TEXT,
    "maxPlatformVersion" TEXT,
    "size" INTEGER,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PluginVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginInstallation" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "organizationId" TEXT,
    "installedById" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" TEXT NOT NULL DEFAULT '{}',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "PluginInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginReview" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PluginReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginLog" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "installationId" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PluginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "payload" TEXT NOT NULL,
    "metadata" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "version" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "iconUrl" TEXT,
    "previewUrl" TEXT,
    "downloadUrl" TEXT,
    "documentation" TEXT,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceItemVersion" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceItemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceItemReview" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceItemReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceItemInstallation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "licenseKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceItemInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "customDomain" TEXT,
    "emailTemplate" TEXT,
    "loginPageConfig" TEXT,
    "footerConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionCollaboration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizations" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionCollaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "featureKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "maxEnrollments" INTEGER,
    "enrollmentCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaEnrollment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "feedback" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BetaEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalizationEntry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalizationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgAcademicCalendar" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgAcademicCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgSemester" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyEvidence" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "competencyName" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "evidenceName" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetencyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reasoning" TEXT NOT NULL,
    "relatedEntity" TEXT,
    "relatedType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tutoring_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "topicId" TEXT,
    "messages" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalMinutes" INTEGER,
    "feedbackRating" INTEGER,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_tutoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_content_generations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "generatedContent" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_content_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_learning_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "preferredLearningStyle" TEXT,
    "studyPacePreference" TEXT,
    "focusSessionDurationMinutes" INTEGER,
    "bestStudyTime" TEXT,
    "avgStudySessionLength" INTEGER,
    "preferredResourceTypes" TEXT NOT NULL,
    "adaptiveDifficultyLevel" DOUBLE PRECISION,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_intervention_campaigns" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "recommendedActions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_intervention_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_difficulty_levels" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "difficultyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adaptive_difficulty_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_ai_reviews" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "resumeContent" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "suggestedRevisions" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentAccepted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_ai_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OntologyVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "diff" TEXT,
    "checksum" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OntologyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessMetrics" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "weeklyGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "totalGoals" INTEGER NOT NULL DEFAULT 0,
    "goalsCompleted" INTEGER NOT NULL DEFAULT 0,
    "badgesEarned" INTEGER NOT NULL DEFAULT 0,
    "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuccessMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGoal" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'academic',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "relatedCompetencies" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductivitySession" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "focusAreaId" TEXT,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "plannedTasks" INTEGER NOT NULL DEFAULT 0,
    "actualHoursSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "distractionCount" INTEGER NOT NULL DEFAULT 0,
    "sessionType" TEXT NOT NULL DEFAULT 'focused',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskIndicator" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "riskCategory" TEXT NOT NULL DEFAULT 'academic',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "score" INTEGER NOT NULL DEFAULT 0,
    "indicators" TEXT NOT NULL DEFAULT '{}',
    "mitigationPlan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastAssessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessAssessment" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL DEFAULT 'career',
    "categories" TEXT NOT NULL DEFAULT '{}',
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "gaps" TEXT NOT NULL DEFAULT '[]',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadinessAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAchievement" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "badgeIcon" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "requirement" TEXT NOT NULL DEFAULT '{}',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharedWithCohort" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTask" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL DEFAULT 'careerPath',
    "scenarioName" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL DEFAULT 0,
    "feedbackGiven" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapstoneProject" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "focusArea" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ideation',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetCompletionDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "mentorId" TEXT,
    "teamMembers" TEXT NOT NULL DEFAULT '[]',
    "deliverables" TEXT NOT NULL DEFAULT '[]',
    "milestones" TEXT NOT NULL DEFAULT '{}',
    "grade" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapstoneProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessCoachSession" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionTopic" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "feedbackProvided" BOOLEAN NOT NULL DEFAULT false,
    "supportOffered" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuccessCoachSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "source" TEXT,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "interviewedAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "coverLetter" TEXT,
    "customAnswers" JSONB NOT NULL DEFAULT '{}',
    "aiMatchScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "startDate" TIMESTAMP(3) NOT NULL,
    "benefits" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "employerId" TEXT,
    "employer" TEXT,
    "position" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "employmentType" TEXT,
    "location" TEXT,
    "salary" INTEGER,
    "benefits" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "placementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalNetwork" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contactId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactRole" TEXT,
    "company" TEXT,
    "industry" TEXT,
    "connectionType" TEXT NOT NULL DEFAULT 'colleague',
    "relationshipStatus" TEXT NOT NULL DEFAULT 'active',
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "lastInteraction" TIMESTAMP(3),
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkingEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "organizer" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "contacts" TEXT NOT NULL DEFAULT '[]',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingApplication" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fundingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "appliedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "essayResponses" JSONB NOT NULL DEFAULT '{}',
    "supportingDocs" TEXT NOT NULL DEFAULT '[]',
    "gpa" DOUBLE PRECISION,
    "gpaScale" TEXT,
    "income" DOUBLE PRECISION,
    "awardAmount" DOUBLE PRECISION,
    "awardedAt" TIMESTAMP(3),
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerDevelopmentPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetIndustry" TEXT,
    "timeline" INTEGER,
    "shortTermGoals" JSONB NOT NULL DEFAULT '[]',
    "longTermGoals" JSONB NOT NULL DEFAULT '[]',
    "skillsToAcquire" TEXT NOT NULL DEFAULT '[]',
    "actionItems" JSONB NOT NULL DEFAULT '[]',
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerDevelopmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerResourceAccess" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceTitle" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "universityId" TEXT,

    CONSTRAINT "CareerResourceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerAIInsight" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "relatedJobs" TEXT NOT NULL DEFAULT '[]',
    "relatedSkills" TEXT NOT NULL DEFAULT '[]',
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" TEXT,

    CONSTRAINT "CareerAIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerMockInterview" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetCompany" TEXT,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "performanceScore" INTEGER,
    "duration" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "aiGeneratedFeedback" TEXT,
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "universityId" TEXT,

    CONSTRAINT "CareerMockInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAlertSubscription" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "industries" TEXT NOT NULL DEFAULT '[]',
    "locations" TEXT NOT NULL DEFAULT '[]',
    "jobTypes" TEXT NOT NULL DEFAULT '[]',
    "minSalary" INTEGER,
    "maxSalary" INTEGER,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertSent" TIMESTAMP(3),
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAlertSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedSearch" (
    "id" TEXT NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultCount" INTEGER NOT NULL,
    "filters" JSONB,

    CONSTRAINT "SharedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "K2ThinkMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "K2ThinkMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "K2ThinkAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "responseHash" TEXT NOT NULL,
    "providerUsed" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "K2ThinkAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CLOMastery" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "cloText" TEXT NOT NULL,
    "masteryScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "lastAssessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CLOMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptAr" TEXT,
    "options" JSONB,
    "correctAnswer" TEXT,
    "explanation" TEXT NOT NULL,
    "explanationAr" TEXT,
    "sourceReference" TEXT,
    "points" INTEGER NOT NULL,
    "cloAlignment" TEXT NOT NULL,
    "codeTemplate" TEXT,
    "testCases" JSONB,
    "rubricCriteria" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseContent" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "chunks" JSONB NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseLearningOutcome" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textAr" TEXT,
    "bloomLevel" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseLearningOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "AiPrompt_stage_idx" ON "AiPrompt"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "University_code_key" ON "University"("code");

-- CreateIndex
CREATE INDEX "University_organizationId_idx" ON "University"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_universityId_discoverable_readinessScore_idx" ON "Student"("universityId", "discoverable", "readinessScore");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_userId_key" ON "Faculty"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_universityId_idx" ON "Enrollment"("universityId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_facultyId_idx" ON "Enrollment"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_enrollmentId_key" ON "Grade"("enrollmentId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_courseId_idx" ON "Grade"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_courseId_semester_key" ON "Grade"("studentId", "courseId", "semester");

-- CreateIndex
CREATE INDEX "AttendanceRecord_universityId_idx" ON "AttendanceRecord"("universityId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_courseId_idx" ON "AttendanceRecord"("courseId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "ActiveParticipation_universityId_idx" ON "ActiveParticipation"("universityId");

-- CreateIndex
CREATE INDEX "ActiveParticipation_courseId_idx" ON "ActiveParticipation"("courseId");

-- CreateIndex
CREATE INDEX "ActiveParticipation_unitId_idx" ON "ActiveParticipation"("unitId");

-- CreateIndex
CREATE INDEX "ActiveParticipation_studentId_idx" ON "ActiveParticipation"("studentId");

-- CreateIndex
CREATE INDEX "GradeAdjustment_universityId_idx" ON "GradeAdjustment"("universityId");

-- CreateIndex
CREATE INDEX "GradeAdjustment_courseId_idx" ON "GradeAdjustment"("courseId");

-- CreateIndex
CREATE INDEX "GradeAdjustment_facultyId_idx" ON "GradeAdjustment"("facultyId");

-- CreateIndex
CREATE INDEX "GradeAdjustment_studentId_idx" ON "GradeAdjustment"("studentId");

-- CreateIndex
CREATE INDEX "Project_universityId_idx" ON "Project"("universityId");

-- CreateIndex
CREATE INDEX "Project_studentId_idx" ON "Project"("studentId");

-- CreateIndex
CREATE INDEX "MarketSignal_employer_skill_capturedAt_idx" ON "MarketSignal"("employer", "skill", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentModule_code_specialization_key" ON "AssessmentModule"("code", "specialization");

-- CreateIndex
CREATE INDEX "AssessmentResponse_studentId_idx" ON "AssessmentResponse"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentResponse_studentId_moduleCode_idx" ON "AssessmentResponse"("studentId", "moduleCode");

-- CreateIndex
CREATE INDEX "AssessmentResponse_universityId_idx" ON "AssessmentResponse"("universityId");

-- CreateIndex
CREATE INDEX "AssessmentSnapshot_studentId_idx" ON "AssessmentSnapshot"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployabilityProfile_studentId_key" ON "EmployabilityProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScedField_code_key" ON "ScedField"("code");

-- CreateIndex
CREATE INDEX "ScedField_kind_idx" ON "ScedField"("kind");

-- CreateIndex
CREATE INDEX "ScedField_parentCode_idx" ON "ScedField"("parentCode");

-- CreateIndex
CREATE UNIQUE INDEX "SsccoOccupation_code_key" ON "SsccoOccupation"("code");

-- CreateIndex
CREATE INDEX "SsccoOccupation_kind_idx" ON "SsccoOccupation"("kind");

-- CreateIndex
CREATE INDEX "SsccoOccupation_parentCode_idx" ON "SsccoOccupation"("parentCode");

-- CreateIndex
CREATE INDEX "SsccoOccupation_iscoCode_idx" ON "SsccoOccupation"("iscoCode");

-- CreateIndex
CREATE UNIQUE INDEX "EquityLedger_studentId_key" ON "EquityLedger"("studentId");

-- CreateIndex
CREATE INDEX "EquityLedger_universityId_idx" ON "EquityLedger"("universityId");

-- CreateIndex
CREATE INDEX "EquityEvent_ledgerId_idx" ON "EquityEvent"("ledgerId");

-- CreateIndex
CREATE INDEX "EquityEvent_source_idx" ON "EquityEvent"("source");

-- CreateIndex
CREATE INDEX "CareerPath_studentId_idx" ON "CareerPath"("studentId");

-- CreateIndex
CREATE INDEX "CareerStage_pathId_idx" ON "CareerStage"("pathId");

-- CreateIndex
CREATE INDEX "PortfolioReview_studentId_idx" ON "PortfolioReview"("studentId");

-- CreateIndex
CREATE INDEX "JobPosting_sscoCode_idx" ON "JobPosting"("sscoCode");

-- CreateIndex
CREATE INDEX "JobPosting_sector_idx" ON "JobPosting"("sector");

-- CreateIndex
CREATE INDEX "JobPosting_recruiterId_idx" ON "JobPosting"("recruiterId");

-- CreateIndex
CREATE INDEX "JobMatch_studentId_idx" ON "JobMatch"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_studentId_jobId_key" ON "JobMatch"("studentId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "FundingProgram_code_key" ON "FundingProgram"("code");

-- CreateIndex
CREATE INDEX "FundingProgram_stage_idx" ON "FundingProgram"("stage");

-- CreateIndex
CREATE INDEX "FundingProgram_sector_idx" ON "FundingProgram"("sector");

-- CreateIndex
CREATE INDEX "FundingSave_studentId_idx" ON "FundingSave"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FundingSave_studentId_programId_key" ON "FundingSave"("studentId", "programId");

-- CreateIndex
CREATE INDEX "StudentBadge_studentId_idx" ON "StudentBadge"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBadge_studentId_badgeCode_key" ON "StudentBadge"("studentId", "badgeCode");

-- CreateIndex
CREATE INDEX "R2CArtifact_studentId_idx" ON "R2CArtifact"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentOnboarding_studentId_key" ON "StudentOnboarding"("studentId");

-- CreateIndex
CREATE INDEX "StudentOnboarding_studentId_idx" ON "StudentOnboarding"("studentId");

-- CreateIndex
CREATE INDEX "OnboardingTask_onboardingId_idx" ON "OnboardingTask"("onboardingId");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_userId_key" ON "Recruiter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_email_key" ON "Recruiter"("email");

-- CreateIndex
CREATE INDEX "Recruiter_employer_idx" ON "Recruiter"("employer");

-- CreateIndex
CREATE INDEX "TalentPool_recruiterId_idx" ON "TalentPool"("recruiterId");

-- CreateIndex
CREATE INDEX "TalentPoolMember_studentId_idx" ON "TalentPoolMember"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPoolMember_poolId_studentId_key" ON "TalentPoolMember"("poolId", "studentId");

-- CreateIndex
CREATE INDEX "PipelineStage_recruiterId_stage_idx" ON "PipelineStage"("recruiterId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_recruiterId_studentId_key" ON "PipelineStage"("recruiterId", "studentId");

-- CreateIndex
CREATE INDEX "RecruiterActivity_recruiterId_createdAt_idx" ON "RecruiterActivity"("recruiterId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruiterActivity_studentId_idx" ON "RecruiterActivity"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationChecklist_studentId_key" ON "GraduationChecklist"("studentId");

-- CreateIndex
CREATE INDEX "SkillExploration_studentId_idx" ON "SkillExploration"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillExploration_studentId_skillName_key" ON "SkillExploration"("studentId", "skillName");

-- CreateIndex
CREATE UNIQUE INDEX "CareerCard_slug_key" ON "CareerCard"("slug");

-- CreateIndex
CREATE INDEX "CareerCard_sector_idx" ON "CareerCard"("sector");

-- CreateIndex
CREATE INDEX "CareerInterest_studentId_idx" ON "CareerInterest"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerInterest_studentId_cardId_key" ON "CareerInterest"("studentId", "cardId");

-- CreateIndex
CREATE INDEX "SkillProgress_studentId_idx" ON "SkillProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_studentId_skillName_key" ON "SkillProgress"("studentId", "skillName");

-- CreateIndex
CREATE INDEX "Internship_studentId_idx" ON "Internship"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPrep_studentId_key" ON "InterviewPrep"("studentId");

-- CreateIndex
CREATE INDEX "InterviewPrep_studentId_idx" ON "InterviewPrep"("studentId");

-- CreateIndex
CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost"("category");

-- CreateIndex
CREATE INDEX "CommunityReply_postId_idx" ON "CommunityReply"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- CreateIndex
CREATE INDEX "MentorshipSession_studentId_idx" ON "MentorshipSession"("studentId");

-- CreateIndex
CREATE INDEX "MentorshipSession_mentorId_idx" ON "MentorshipSession"("mentorId");

-- CreateIndex
CREATE INDEX "EnrichmentSource_cluster_idx" ON "EnrichmentSource"("cluster");

-- CreateIndex
CREATE INDEX "EnrichmentContent_cluster_section_status_idx" ON "EnrichmentContent"("cluster", "section", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_slug_key" ON "Hackathon"("slug");

-- CreateIndex
CREATE INDEX "Hackathon_status_idx" ON "Hackathon"("status");

-- CreateIndex
CREATE INDEX "HackathonRegistration_studentId_idx" ON "HackathonRegistration"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonRegistration_hackathonId_studentId_key" ON "HackathonRegistration"("hackathonId", "studentId");

-- CreateIndex
CREATE INDEX "HackathonTeam_hackathonId_rank_idx" ON "HackathonTeam"("hackathonId", "rank");

-- CreateIndex
CREATE INDEX "HackathonTeamMember_studentId_idx" ON "HackathonTeamMember"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonTeamMember_teamId_studentId_key" ON "HackathonTeamMember"("teamId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_name_key" ON "Concept"("name");

-- CreateIndex
CREATE INDEX "Concept_cluster_idx" ON "Concept"("cluster");

-- CreateIndex
CREATE INDEX "Certification_cluster_level_idx" ON "Certification"("cluster", "level");

-- CreateIndex
CREATE INDEX "CourseConcept_conceptId_idx" ON "CourseConcept"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseConcept_courseId_conceptId_key" ON "CourseConcept"("courseId", "conceptId");

-- CreateIndex
CREATE INDEX "CertificationConcept_conceptId_idx" ON "CertificationConcept"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationConcept_certificationId_conceptId_key" ON "CertificationConcept"("certificationId", "conceptId");

-- CreateIndex
CREATE INDEX "ConceptPrerequisite_dependsOnId_idx" ON "ConceptPrerequisite"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptPrerequisite_conceptId_dependsOnId_key" ON "ConceptPrerequisite"("conceptId", "dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ConsentRecord_studentId_purpose_idx" ON "ConsentRecord"("studentId", "purpose");

-- CreateIndex
CREATE INDEX "ConsentRecord_universityId_idx" ON "ConsentRecord"("universityId");

-- CreateIndex
CREATE INDEX "IssuedCredential_studentId_idx" ON "IssuedCredential"("studentId");

-- CreateIndex
CREATE INDEX "IssuedCredential_universityId_idx" ON "IssuedCredential"("universityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_at_idx" ON "AuditLog"("organizationId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Notification_studentId_readAt_idx" ON "Notification"("studentId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_studentId_idx" ON "PushSubscription"("studentId");

-- CreateIndex
CREATE INDEX "StudentAgentMessage_agentId_createdAt_idx" ON "StudentAgentMessage"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "StudentAgentMessage_studentId_idx" ON "StudentAgentMessage"("studentId");

-- CreateIndex
CREATE INDEX "Integration_provider_status_idx" ON "Integration"("provider", "status");

-- CreateIndex
CREATE INDEX "Integration_universityId_idx" ON "Integration"("universityId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_studentId_key" ON "Portfolio"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_shareToken_key" ON "Portfolio"("shareToken");

-- CreateIndex
CREATE INDEX "Portfolio_studentId_idx" ON "Portfolio"("studentId");

-- CreateIndex
CREATE INDEX "Portfolio_visibility_idx" ON "Portfolio"("visibility");

-- CreateIndex
CREATE INDEX "Portfolio_shareToken_idx" ON "Portfolio"("shareToken");

-- CreateIndex
CREATE INDEX "PortfolioEntry_portfolioId_idx" ON "PortfolioEntry"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioEntry_category_idx" ON "PortfolioEntry"("category");

-- CreateIndex
CREATE INDEX "PortfolioAchievement_portfolioId_idx" ON "PortfolioAchievement"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioAchievement_type_idx" ON "PortfolioAchievement"("type");

-- CreateIndex
CREATE INDEX "PortfolioSkill_portfolioId_idx" ON "PortfolioSkill"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSkill_portfolioId_name_key" ON "PortfolioSkill"("portfolioId", "name");

-- CreateIndex
CREATE INDEX "SkillEndorsement_skillId_idx" ON "SkillEndorsement"("skillId");

-- CreateIndex
CREATE INDEX "SkillEndorsement_portfolioId_idx" ON "SkillEndorsement"("portfolioId");

-- CreateIndex
CREATE INDEX "SkillEndorsement_endorsedBy_idx" ON "SkillEndorsement"("endorsedBy");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCareerProfile_portfolioId_key" ON "PortfolioCareerProfile"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioCareerProfile_portfolioId_idx" ON "PortfolioCareerProfile"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioShareLink_token_key" ON "PortfolioShareLink"("token");

-- CreateIndex
CREATE INDEX "PortfolioShareLink_portfolioId_idx" ON "PortfolioShareLink"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioShareLink_token_idx" ON "PortfolioShareLink"("token");

-- CreateIndex
CREATE INDEX "PortfolioView_portfolioId_viewedAt_idx" ON "PortfolioView"("portfolioId", "viewedAt");

-- CreateIndex
CREATE INDEX "PortfolioView_viewerId_idx" ON "PortfolioView"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseTopic_slug_key" ON "KnowledgeBaseTopic"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeBaseTopic_slug_idx" ON "KnowledgeBaseTopic"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeBaseTopic_category_idx" ON "KnowledgeBaseTopic"("category");

-- CreateIndex
CREATE INDEX "KnowledgeBaseTopic_universityId_idx" ON "KnowledgeBaseTopic"("universityId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseTopic_parentTopicId_idx" ON "KnowledgeBaseTopic"("parentTopicId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseArticle_slug_key" ON "KnowledgeBaseArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_topicId_idx" ON "KnowledgeBaseArticle"("topicId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_slug_idx" ON "KnowledgeBaseArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_authorId_idx" ON "KnowledgeBaseArticle"("authorId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_isPublished_idx" ON "KnowledgeBaseArticle"("isPublished");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_isFeatured_idx" ON "KnowledgeBaseArticle"("isFeatured");

-- CreateIndex
CREATE INDEX "KnowledgeBaseView_articleId_viewedAt_idx" ON "KnowledgeBaseView"("articleId", "viewedAt");

-- CreateIndex
CREATE INDEX "KnowledgeBaseView_userId_idx" ON "KnowledgeBaseView"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseView_sessionId_idx" ON "KnowledgeBaseView"("sessionId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFeedback_articleId_idx" ON "KnowledgeBaseFeedback"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFeedback_userId_idx" ON "KnowledgeBaseFeedback"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseSearch_query_idx" ON "KnowledgeBaseSearch"("query");

-- CreateIndex
CREATE INDEX "KnowledgeBaseSearch_userId_idx" ON "KnowledgeBaseSearch"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseSearch_sessionId_idx" ON "KnowledgeBaseSearch"("sessionId");

-- CreateIndex
CREATE INDEX "Assessment_universityId_status_idx" ON "Assessment"("universityId", "status");

-- CreateIndex
CREATE INDEX "Assessment_createdBy_idx" ON "Assessment"("createdBy");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_order_idx" ON "AssessmentQuestion"("assessmentId", "order");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_type_idx" ON "AssessmentQuestion"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSubmission_submissionToken_key" ON "AssessmentSubmission"("submissionToken");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_universityId_status_idx" ON "AssessmentSubmission"("universityId", "status");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_studentId_status_idx" ON "AssessmentSubmission"("studentId", "status");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_submissionToken_idx" ON "AssessmentSubmission"("submissionToken");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSubmission_assessmentId_studentId_attemptNumber_key" ON "AssessmentSubmission"("assessmentId", "studentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "AssessmentQuestionResponse_submissionId_submittedAt_idx" ON "AssessmentQuestionResponse"("submissionId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionResponse_submissionId_questionId_sequence_key" ON "AssessmentQuestionResponse"("submissionId", "questionId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_assessmentId_key" ON "Rubric"("assessmentId");

-- CreateIndex
CREATE INDEX "Rubric_assessmentId_idx" ON "Rubric"("assessmentId");

-- CreateIndex
CREATE INDEX "RubricCriterion_rubricId_order_idx" ON "RubricCriterion"("rubricId", "order");

-- CreateIndex
CREATE INDEX "AssessmentScore_submissionId_idx" ON "AssessmentScore"("submissionId");

-- CreateIndex
CREATE INDEX "AssessmentScore_criterionId_idx" ON "AssessmentScore"("criterionId");

-- CreateIndex
CREATE INDEX "CalibrationSession_assessmentId_idx" ON "CalibrationSession"("assessmentId");

-- CreateIndex
CREATE INDEX "CalibrationSession_universityId_idx" ON "CalibrationSession"("universityId");

-- CreateIndex
CREATE INDEX "CalibrationScoreAdjustment_sessionId_idx" ON "CalibrationScoreAdjustment"("sessionId");

-- CreateIndex
CREATE INDEX "CalibrationScoreAdjustment_submissionId_idx" ON "CalibrationScoreAdjustment"("submissionId");

-- CreateIndex
CREATE INDEX "ResearchRequest_status_submittedAt_idx" ON "ResearchRequest"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ResearchRequest_userId_idx" ON "ResearchRequest"("userId");

-- CreateIndex
CREATE INDEX "ResearchRequest_topic_idx" ON "ResearchRequest"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_doi_key" ON "Dataset"("doi");

-- CreateIndex
CREATE INDEX "Dataset_accessLevel_createdAt_idx" ON "Dataset"("accessLevel", "createdAt");

-- CreateIndex
CREATE INDEX "Dataset_doi_idx" ON "Dataset"("doi");

-- CreateIndex
CREATE INDEX "DatasetAccess_datasetId_accessedAt_idx" ON "DatasetAccess"("datasetId", "accessedAt");

-- CreateIndex
CREATE INDEX "DatasetAccess_requestId_idx" ON "DatasetAccess"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchOutcome_doi_key" ON "ResearchOutcome"("doi");

-- CreateIndex
CREATE INDEX "ResearchOutcome_type_publishedAt_idx" ON "ResearchOutcome"("type", "publishedAt");

-- CreateIndex
CREATE INDEX "ResearchOutcome_doi_idx" ON "ResearchOutcome"("doi");

-- CreateIndex
CREATE INDEX "ComplianceCheck_status_lastChecked_idx" ON "ComplianceCheck"("status", "lastChecked");

-- CreateIndex
CREATE INDEX "ComplianceCheck_category_idx" ON "ComplianceCheck"("category");

-- CreateIndex
CREATE INDEX "ResearchAnalytics_metric_period_timestamp_idx" ON "ResearchAnalytics"("metric", "period", "timestamp");

-- CreateIndex
CREATE INDEX "ResearchReport_requestId_generatedAt_idx" ON "ResearchReport"("requestId", "generatedAt");

-- CreateIndex
CREATE INDEX "ResearchReport_status_idx" ON "ResearchReport"("status");

-- CreateIndex
CREATE INDEX "Workflow_category_status_idx" ON "Workflow"("category", "status");

-- CreateIndex
CREATE INDEX "Workflow_universityId_idx" ON "Workflow"("universityId");

-- CreateIndex
CREATE INDEX "Workflow_createdById_idx" ON "Workflow"("createdById");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_order_idx" ON "WorkflowStep"("workflowId", "order");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_status_idx" ON "WorkflowExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_createdAt_idx" ON "WorkflowExecution"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_entityType_entityId_idx" ON "WorkflowExecution"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowStepExecution_executionId_stepOrder_idx" ON "WorkflowStepExecution"("executionId", "stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowStepExecution_status_idx" ON "WorkflowStepExecution"("status");

-- CreateIndex
CREATE INDEX "WorkflowApproval_workflowId_status_idx" ON "WorkflowApproval"("workflowId", "status");

-- CreateIndex
CREATE INDEX "WorkflowApproval_executionId_idx" ON "WorkflowApproval"("executionId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_category_isPublic_idx" ON "WorkflowTemplate"("category", "isPublic");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_eventType_isActive_idx" ON "WorkflowTrigger"("eventType", "isActive");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_workflowId_status_idx" ON "WorkflowSchedule"("workflowId", "status");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_nextExecutionAt_idx" ON "WorkflowSchedule"("nextExecutionAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_readAt_idx" ON "Message"("readAt");

-- CreateIndex
CREATE INDEX "Conversation_creatorId_updatedAt_idx" ON "Conversation"("creatorId", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Announcement_publishedBy_status_idx" ON "Announcement"("publishedBy", "status");

-- CreateIndex
CREATE INDEX "Announcement_type_status_idx" ON "Announcement"("type", "status");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_status_idx" ON "Announcement"("createdAt", "status");

-- CreateIndex
CREATE INDEX "Announcement_expiresAt_idx" ON "Announcement"("expiresAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_organizerId_startTime_idx" ON "CalendarEvent"("organizerId", "startTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_endTime_idx" ON "CalendarEvent"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventType_status_idx" ON "CalendarEvent"("eventType", "status");

-- CreateIndex
CREATE INDEX "CalendarRegistration_userId_status_idx" ON "CalendarRegistration"("userId", "status");

-- CreateIndex
CREATE INDEX "CalendarRegistration_eventId_status_idx" ON "CalendarRegistration"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarRegistration_eventId_userId_key" ON "CalendarRegistration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "MessageTemplate_category_isPublic_idx" ON "MessageTemplate"("category", "isPublic");

-- CreateIndex
CREATE INDEX "MessageTemplate_createdBy_idx" ON "MessageTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_sentAt_idx" ON "NotificationLog"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_status_channel_idx" ON "NotificationLog"("status", "channel");

-- CreateIndex
CREATE INDEX "NotificationLog_sourceId_idx" ON "NotificationLog"("sourceId");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "Role"("name");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

-- CreateIndex
CREATE INDEX "Role_parentRoleId_idx" ON "Role"("parentRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_organizationId_key" ON "Role"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_resource_action_idx" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateIndex
CREATE INDEX "RolePermissions_roleId_idx" ON "RolePermissions"("roleId");

-- CreateIndex
CREATE INDEX "RolePermissions_permissionId_idx" ON "RolePermissions"("permissionId");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "UserRole_organizationId_idx" ON "UserRole"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_organizationId_key" ON "UserRole"("userId", "roleId", "organizationId");

-- CreateIndex
CREATE INDEX "DynamicRoleAssignment_userId_idx" ON "DynamicRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "DynamicRoleAssignment_elevatedRoleId_idx" ON "DynamicRoleAssignment"("elevatedRoleId");

-- CreateIndex
CREATE INDEX "DynamicRoleAssignment_approvalStatus_idx" ON "DynamicRoleAssignment"("approvalStatus");

-- CreateIndex
CREATE INDEX "AbacPolicy_organizationId_idx" ON "AbacPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "BulkOperation_organizationId_idx" ON "BulkOperation"("organizationId");

-- CreateIndex
CREATE INDEX "BulkOperation_status_idx" ON "BulkOperation"("status");

-- CreateIndex
CREATE INDEX "JobOpening_status_idx" ON "JobOpening"("status");

-- CreateIndex
CREATE INDEX "JobOpening_employerId_idx" ON "JobOpening"("employerId");

-- CreateIndex
CREATE INDEX "JobOpening_employer_idx" ON "JobOpening"("employer");

-- CreateIndex
CREATE INDEX "CandidateSubmission_jobId_idx" ON "CandidateSubmission"("jobId");

-- CreateIndex
CREATE INDEX "CandidateSubmission_recruiterId_idx" ON "CandidateSubmission"("recruiterId");

-- CreateIndex
CREATE INDEX "CandidateSubmission_studentId_idx" ON "CandidateSubmission"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSubmission_jobId_studentId_key" ON "CandidateSubmission"("jobId", "studentId");

-- CreateIndex
CREATE INDEX "JobTemplate_employerId_idx" ON "JobTemplate"("employerId");

-- CreateIndex
CREATE INDEX "CandidateEvaluation_submissionId_idx" ON "CandidateEvaluation"("submissionId");

-- CreateIndex
CREATE INDEX "Interview_submissionId_idx" ON "Interview"("submissionId");

-- CreateIndex
CREATE INDEX "Offer_jobId_idx" ON "Offer"("jobId");

-- CreateIndex
CREATE INDEX "Offer_candidateId_idx" ON "Offer"("candidateId");

-- CreateIndex
CREATE INDEX "MarketplaceTemplate_creatorId_idx" ON "MarketplaceTemplate"("creatorId");

-- CreateIndex
CREATE INDEX "MarketplaceTemplate_category_idx" ON "MarketplaceTemplate"("category");

-- CreateIndex
CREATE INDEX "MarketplaceTemplate_isPublished_idx" ON "MarketplaceTemplate"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateLicense_templateId_key" ON "TemplateLicense"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateRating_templateId_userId_key" ON "TemplateRating"("templateId", "userId");

-- CreateIndex
CREATE INDEX "TemplateDeployment_templateId_idx" ON "TemplateDeployment"("templateId");

-- CreateIndex
CREATE INDEX "TemplateDeployment_orgId_idx" ON "TemplateDeployment"("orgId");

-- CreateIndex
CREATE INDEX "LicensePurchase_templateId_idx" ON "LicensePurchase"("templateId");

-- CreateIndex
CREATE INDEX "LicensePurchase_buyerId_idx" ON "LicensePurchase"("buyerId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_creatorId_idx" ON "RevenueTransaction"("creatorId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_payoutStatus_idx" ON "RevenueTransaction"("payoutStatus");

-- CreateIndex
CREATE INDEX "Report_universityId_idx" ON "Report"("universityId");

-- CreateIndex
CREATE INDEX "Report_owner_idx" ON "Report"("owner");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ReportExecution_reportId_idx" ON "ReportExecution"("reportId");

-- CreateIndex
CREATE INDEX "ReportExecution_status_idx" ON "ReportExecution"("status");

-- CreateIndex
CREATE INDEX "ReportExecution_executedAt_idx" ON "ReportExecution"("executedAt");

-- CreateIndex
CREATE INDEX "ReportSchedule_reportId_idx" ON "ReportSchedule"("reportId");

-- CreateIndex
CREATE INDEX "ReportSchedule_isActive_idx" ON "ReportSchedule"("isActive");

-- CreateIndex
CREATE INDEX "ReportSchedule_nextRunAt_idx" ON "ReportSchedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "ReportExport_reportId_idx" ON "ReportExport"("reportId");

-- CreateIndex
CREATE INDEX "ReportExport_format_idx" ON "ReportExport"("format");

-- CreateIndex
CREATE INDEX "ReportExport_exportedAt_idx" ON "ReportExport"("exportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportMetric_key_key" ON "ReportMetric"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ReportDimension_key_key" ON "ReportDimension"("key");

-- CreateIndex
CREATE INDEX "ReportTemplate_category_idx" ON "ReportTemplate"("category");

-- CreateIndex
CREATE INDEX "ReportTemplate_isPublic_idx" ON "ReportTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "ReportAlert_isActive_idx" ON "ReportAlert"("isActive");

-- CreateIndex
CREATE INDEX "ReportAlert_lastTriggeredAt_idx" ON "ReportAlert"("lastTriggeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Country_code_idx" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Government_code_key" ON "Government"("code");

-- CreateIndex
CREATE INDEX "Government_countryId_idx" ON "Government"("countryId");

-- CreateIndex
CREATE INDEX "Government_code_idx" ON "Government"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_parentId_idx" ON "Organization"("parentId");

-- CreateIndex
CREATE INDEX "Organization_governmentId_idx" ON "Organization"("governmentId");

-- CreateIndex
CREATE INDEX "Organization_countryId_idx" ON "Organization"("countryId");

-- CreateIndex
CREATE INDEX "OrganizationSettings_organizationId_idx" ON "OrganizationSettings"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationSettings_category_idx" ON "OrganizationSettings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key_key" ON "OrganizationSettings"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_email_idx" ON "OrganizationInvitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_token_idx" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_status_idx" ON "OrganizationInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MfaSettings_userId_key" ON "MfaSettings"("userId");

-- CreateIndex
CREATE INDEX "MfaSettings_userId_idx" ON "MfaSettings"("userId");

-- CreateIndex
CREATE INDEX "MfaBackupCode_mfaSettingsId_idx" ON "MfaBackupCode"("mfaSettingsId");

-- CreateIndex
CREATE INDEX "TrustedDevice_mfaSettingsId_idx" ON "TrustedDevice"("mfaSettingsId");

-- CreateIndex
CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");

-- CreateIndex
CREATE INDEX "TrustedDevice_fingerprint_idx" ON "TrustedDevice"("fingerprint");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_active_idx" ON "ApiKey"("active");

-- CreateIndex
CREATE INDEX "ServiceAccount_organizationId_idx" ON "ServiceAccount"("organizationId");

-- CreateIndex
CREATE INDEX "ServiceAccount_active_idx" ON "ServiceAccount"("active");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_success_idx" ON "LoginAttempt"("success");

-- CreateIndex
CREATE INDEX "PasswordHistory_userId_createdAt_idx" ON "PasswordHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessReview_status_idx" ON "AccessReview"("status");

-- CreateIndex
CREATE INDEX "AccessReview_organizationId_idx" ON "AccessReview"("organizationId");

-- CreateIndex
CREATE INDEX "AccessReview_dueDate_idx" ON "AccessReview"("dueDate");

-- CreateIndex
CREATE INDEX "AccessReviewItem_reviewId_status_idx" ON "AccessReviewItem"("reviewId", "status");

-- CreateIndex
CREATE INDEX "AccessReviewItem_userId_idx" ON "AccessReviewItem"("userId");

-- CreateIndex
CREATE INDEX "AccessReviewItem_roleId_idx" ON "AccessReviewItem"("roleId");

-- CreateIndex
CREATE INDEX "ComplianceReport_type_status_idx" ON "ComplianceReport"("type", "status");

-- CreateIndex
CREATE INDEX "ComplianceReport_organizationId_idx" ON "ComplianceReport"("organizationId");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_entityType_idx" ON "DataRetentionPolicy"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_entityType_organizationId_key" ON "DataRetentionPolicy"("entityType", "organizationId");

-- CreateIndex
CREATE INDEX "Incident_severity_status_idx" ON "Incident"("severity", "status");

-- CreateIndex
CREATE INDEX "Incident_category_idx" ON "Incident"("category");

-- CreateIndex
CREATE INDEX "Incident_organizationId_idx" ON "Incident"("organizationId");

-- CreateIndex
CREATE INDEX "Incident_detectedAt_idx" ON "Incident"("detectedAt");

-- CreateIndex
CREATE INDEX "RdfSyncState_status_idx" ON "RdfSyncState"("status");

-- CreateIndex
CREATE INDEX "RdfSyncState_entityType_universityCode_idx" ON "RdfSyncState"("entityType", "universityCode");

-- CreateIndex
CREATE INDEX "RdfSyncState_lastSyncedAt_idx" ON "RdfSyncState"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RdfSyncState_entityType_entityId_universityCode_key" ON "RdfSyncState"("entityType", "entityId", "universityCode");

-- CreateIndex
CREATE UNIQUE INDEX "SamlConfiguration_organizationId_key" ON "SamlConfiguration"("organizationId");

-- CreateIndex
CREATE INDEX "SamlConfiguration_organizationId_idx" ON "SamlConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthConfiguration_organizationId_key" ON "OAuthConfiguration"("organizationId");

-- CreateIndex
CREATE INDEX "OAuthConfiguration_organizationId_idx" ON "OAuthConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthClient_clientId_key" ON "OAuthClient"("clientId");

-- CreateIndex
CREATE INDEX "OAuthClient_ownerId_idx" ON "OAuthClient"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAuthorization_userId_clientId_key" ON "OAuthAuthorization"("userId", "clientId");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_tokenHash_idx" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");

-- CreateIndex
CREATE INDEX "EmailVerification_tokenHash_idx" ON "EmailVerification"("tokenHash");

-- CreateIndex
CREATE INDEX "Campus_organizationId_idx" ON "Campus"("organizationId");

-- CreateIndex
CREATE INDEX "OrgFaculty_organizationId_idx" ON "OrgFaculty"("organizationId");

-- CreateIndex
CREATE INDEX "OrgFaculty_campusId_idx" ON "OrgFaculty"("campusId");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE INDEX "Department_facultyId_idx" ON "Department"("facultyId");

-- CreateIndex
CREATE INDEX "AcademicProgram_organizationId_idx" ON "AcademicProgram"("organizationId");

-- CreateIndex
CREATE INDEX "AcademicProgram_departmentId_idx" ON "AcademicProgram"("departmentId");

-- CreateIndex
CREATE INDEX "OrgTeam_organizationId_idx" ON "OrgTeam"("organizationId");

-- CreateIndex
CREATE INDEX "OrgTeam_programId_idx" ON "OrgTeam"("programId");

-- CreateIndex
CREATE INDEX "OrganizationHierarchy_level_idx" ON "OrganizationHierarchy"("level");

-- CreateIndex
CREATE INDEX "OrganizationHierarchy_path_idx" ON "OrganizationHierarchy"("path");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationHierarchy_parentId_childId_key" ON "OrganizationHierarchy"("parentId", "childId");

-- CreateIndex
CREATE INDEX "Delegation_delegatorId_idx" ON "Delegation"("delegatorId");

-- CreateIndex
CREATE INDEX "Delegation_delegateeId_idx" ON "Delegation"("delegateeId");

-- CreateIndex
CREATE INDEX "ImpersonationLog_adminId_idx" ON "ImpersonationLog"("adminId");

-- CreateIndex
CREATE INDEX "ImpersonationLog_targetUserId_idx" ON "ImpersonationLog"("targetUserId");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");

-- CreateIndex
CREATE INDEX "Program_organizationId_idx" ON "Program"("organizationId");

-- CreateIndex
CREATE INDEX "Program_status_idx" ON "Program"("status");

-- CreateIndex
CREATE INDEX "Team_departmentId_idx" ON "Team"("departmentId");

-- CreateIndex
CREATE INDEX "Team_organizationId_idx" ON "Team"("organizationId");

-- CreateIndex
CREATE INDEX "Team_leaderId_idx" ON "Team"("leaderId");

-- CreateIndex
CREATE INDEX "Team_status_idx" ON "Team"("status");

-- CreateIndex
CREATE INDEX "Group_organizationId_idx" ON "Group"("organizationId");

-- CreateIndex
CREATE INDEX "Group_type_idx" ON "Group"("type");

-- CreateIndex
CREATE INDEX "Group_isActive_idx" ON "Group"("isActive");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GroupMember_expiresAt_idx" ON "GroupMember"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "ActivityTimeline_actorId_createdAt_idx" ON "ActivityTimeline"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityTimeline_entityType_entityId_idx" ON "ActivityTimeline"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityTimeline_category_idx" ON "ActivityTimeline"("category");

-- CreateIndex
CREATE INDEX "ActivityTimeline_organizationId_idx" ON "ActivityTimeline"("organizationId");

-- CreateIndex
CREATE INDEX "ActivityTimeline_createdAt_idx" ON "ActivityTimeline"("createdAt");

-- CreateIndex
CREATE INDEX "CompetencyFramework_organizationId_idx" ON "CompetencyFramework"("organizationId");

-- CreateIndex
CREATE INDEX "CompetencyFramework_status_idx" ON "CompetencyFramework"("status");

-- CreateIndex
CREATE INDEX "CompetencyDefinition_frameworkId_idx" ON "CompetencyDefinition"("frameworkId");

-- CreateIndex
CREATE INDEX "CompetencyDefinition_category_idx" ON "CompetencyDefinition"("category");

-- CreateIndex
CREATE INDEX "CompetencyDefinition_parentId_idx" ON "CompetencyDefinition"("parentId");

-- CreateIndex
CREATE INDEX "StudentCompetencyGraph_studentId_idx" ON "StudentCompetencyGraph"("studentId");

-- CreateIndex
CREATE INDEX "StudentCompetencyGraph_competencyId_idx" ON "StudentCompetencyGraph"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCompetencyGraph_studentId_competencyId_key" ON "StudentCompetencyGraph"("studentId", "competencyId");

-- CreateIndex
CREATE INDEX "HumanDevelopmentTimeline_userId_createdAt_idx" ON "HumanDevelopmentTimeline"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HumanDevelopmentTimeline_eventType_idx" ON "HumanDevelopmentTimeline"("eventType");

-- CreateIndex
CREATE INDEX "HumanDevelopmentTimeline_category_idx" ON "HumanDevelopmentTimeline"("category");

-- CreateIndex
CREATE INDEX "HumanDevelopmentTimeline_createdAt_idx" ON "HumanDevelopmentTimeline"("createdAt");

-- CreateIndex
CREATE INDEX "DevelopmentPlan_userId_idx" ON "DevelopmentPlan"("userId");

-- CreateIndex
CREATE INDEX "DevelopmentPlan_planType_idx" ON "DevelopmentPlan"("planType");

-- CreateIndex
CREATE INDEX "DevelopmentPlan_status_idx" ON "DevelopmentPlan"("status");

-- CreateIndex
CREATE INDEX "PlanGoal_planId_idx" ON "PlanGoal"("planId");

-- CreateIndex
CREATE INDEX "PlanGoal_status_idx" ON "PlanGoal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LearningSession_sessionId_key" ON "LearningSession"("sessionId");

-- CreateIndex
CREATE INDEX "LearningSession_userId_createdAt_idx" ON "LearningSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningSession_type_idx" ON "LearningSession"("type");

-- CreateIndex
CREATE INDEX "LearningSession_startedAt_idx" ON "LearningSession"("startedAt");

-- CreateIndex
CREATE INDEX "ReflectionJournal_userId_createdAt_idx" ON "ReflectionJournal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReflectionJournal_mood_idx" ON "ReflectionJournal"("mood");

-- CreateIndex
CREATE INDEX "HabitTracker_userId_idx" ON "HabitTracker"("userId");

-- CreateIndex
CREATE INDEX "HabitTracker_isActive_idx" ON "HabitTracker"("isActive");

-- CreateIndex
CREATE INDEX "HabitCompletion_habitId_completedAt_idx" ON "HabitCompletion"("habitId", "completedAt");

-- CreateIndex
CREATE INDEX "WellnessIndicator_userId_indicatorType_recordedAt_idx" ON "WellnessIndicator"("userId", "indicatorType", "recordedAt");

-- CreateIndex
CREATE INDEX "WellnessIndicator_recordedAt_idx" ON "WellnessIndicator"("recordedAt");

-- CreateIndex
CREATE INDEX "Building_organizationId_idx" ON "Building"("organizationId");

-- CreateIndex
CREATE INDEX "Building_campusId_idx" ON "Building"("campusId");

-- CreateIndex
CREATE INDEX "Building_status_idx" ON "Building"("status");

-- CreateIndex
CREATE INDEX "Floor_buildingId_idx" ON "Floor"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_buildingId_number_key" ON "Floor"("buildingId", "number");

-- CreateIndex
CREATE INDEX "Room_floorId_idx" ON "Room"("floorId");

-- CreateIndex
CREATE INDEX "Room_type_idx" ON "Room"("type");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "Asset"("organizationId");

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "Asset"("type");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_serialNumber_idx" ON "Asset"("serialNumber");

-- CreateIndex
CREATE INDEX "MaintenanceLog_assetId_idx" ON "MaintenanceLog"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_status_idx" ON "MaintenanceLog"("status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_scheduledDate_idx" ON "MaintenanceLog"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_roomId_startTime_endTime_idx" ON "Booking"("roomId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Policy_organizationId_idx" ON "Policy"("organizationId");

-- CreateIndex
CREATE INDEX "Policy_category_idx" ON "Policy"("category");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Procedure_policyId_idx" ON "Procedure"("policyId");

-- CreateIndex
CREATE INDEX "OrganizationComplianceCheck_organizationId_idx" ON "OrganizationComplianceCheck"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationComplianceCheck_regulation_idx" ON "OrganizationComplianceCheck"("regulation");

-- CreateIndex
CREATE INDEX "OrganizationComplianceCheck_status_idx" ON "OrganizationComplianceCheck"("status");

-- CreateIndex
CREATE INDEX "Risk_organizationId_idx" ON "Risk"("organizationId");

-- CreateIndex
CREATE INDEX "Risk_category_idx" ON "Risk"("category");

-- CreateIndex
CREATE INDEX "Risk_status_idx" ON "Risk"("status");

-- CreateIndex
CREATE INDEX "Risk_riskScore_idx" ON "Risk"("riskScore");

-- CreateIndex
CREATE INDEX "Approval_organizationId_idx" ON "Approval"("organizationId");

-- CreateIndex
CREATE INDEX "Approval_type_idx" ON "Approval"("type");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE INDEX "Approval_requesterId_idx" ON "Approval"("requesterId");

-- CreateIndex
CREATE INDEX "Committee_organizationId_idx" ON "Committee"("organizationId");

-- CreateIndex
CREATE INDEX "Committee_type_idx" ON "Committee"("type");

-- CreateIndex
CREATE INDEX "Committee_status_idx" ON "Committee"("status");

-- CreateIndex
CREATE INDEX "JobTitle_organizationId_idx" ON "JobTitle"("organizationId");

-- CreateIndex
CREATE INDEX "JobTitle_level_idx" ON "JobTitle"("level");

-- CreateIndex
CREATE INDEX "JobTitle_category_idx" ON "JobTitle"("category");

-- CreateIndex
CREATE INDEX "Position_departmentId_idx" ON "Position"("departmentId");

-- CreateIndex
CREATE INDEX "Position_jobTitleId_idx" ON "Position"("jobTitleId");

-- CreateIndex
CREATE INDEX "Position_status_idx" ON "Position"("status");

-- CreateIndex
CREATE INDEX "ReportingStructure_userId_idx" ON "ReportingStructure"("userId");

-- CreateIndex
CREATE INDEX "ReportingStructure_managerId_idx" ON "ReportingStructure"("managerId");

-- CreateIndex
CREATE INDEX "ReportingStructure_departmentId_idx" ON "ReportingStructure"("departmentId");

-- CreateIndex
CREATE INDEX "CostCenter_organizationId_idx" ON "CostCenter"("organizationId");

-- CreateIndex
CREATE INDEX "CostCenter_status_idx" ON "CostCenter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_organizationId_code_key" ON "CostCenter"("organizationId", "code");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_authorId_idx" ON "KnowledgeDocument"("authorId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_organizationId_idx" ON "KnowledgeDocument"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_type_idx" ON "KnowledgeDocument"("type");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_status_idx" ON "KnowledgeDocument"("status");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_version_idx" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "DocumentApproval_documentId_status_idx" ON "DocumentApproval"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentComment_documentId_idx" ON "DocumentComment"("documentId");

-- CreateIndex
CREATE INDEX "DocumentComment_userId_idx" ON "DocumentComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPage_slug_key" ON "WikiPage"("slug");

-- CreateIndex
CREATE INDEX "WikiPage_organizationId_idx" ON "WikiPage"("organizationId");

-- CreateIndex
CREATE INDEX "WikiPage_authorId_idx" ON "WikiPage"("authorId");

-- CreateIndex
CREATE INDEX "WikiPage_status_idx" ON "WikiPage"("status");

-- CreateIndex
CREATE INDEX "WikiRevision_pageId_createdAt_idx" ON "WikiRevision"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_authorId_idx" ON "Note"("authorId");

-- CreateIndex
CREATE INDEX "Note_organizationId_idx" ON "Note"("organizationId");

-- CreateIndex
CREATE INDEX "Note_visibility_idx" ON "Note"("visibility");

-- CreateIndex
CREATE INDEX "NoteShare_noteId_idx" ON "NoteShare"("noteId");

-- CreateIndex
CREATE INDEX "NoteShare_userId_idx" ON "NoteShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteShare_noteId_userId_key" ON "NoteShare"("noteId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchPaper_doi_key" ON "ResearchPaper"("doi");

-- CreateIndex
CREATE INDEX "ResearchPaper_organizationId_idx" ON "ResearchPaper"("organizationId");

-- CreateIndex
CREATE INDEX "ResearchPaper_authorId_idx" ON "ResearchPaper"("authorId");

-- CreateIndex
CREATE INDEX "ResearchPaper_doi_idx" ON "ResearchPaper"("doi");

-- CreateIndex
CREATE INDEX "ResearchPaper_year_idx" ON "ResearchPaper"("year");

-- CreateIndex
CREATE INDEX "ResearchPaper_status_idx" ON "ResearchPaper"("status");

-- CreateIndex
CREATE INDEX "ResearchDataset_organizationId_idx" ON "ResearchDataset"("organizationId");

-- CreateIndex
CREATE INDEX "ResearchDataset_authorId_idx" ON "ResearchDataset"("authorId");

-- CreateIndex
CREATE INDEX "ResearchDataset_status_idx" ON "ResearchDataset"("status");

-- CreateIndex
CREATE INDEX "ResearchProtocol_organizationId_idx" ON "ResearchProtocol"("organizationId");

-- CreateIndex
CREATE INDEX "ResearchProtocol_authorId_idx" ON "ResearchProtocol"("authorId");

-- CreateIndex
CREATE INDEX "ResearchProtocol_status_idx" ON "ResearchProtocol"("status");

-- CreateIndex
CREATE INDEX "Citation_paperId_idx" ON "Citation"("paperId");

-- CreateIndex
CREATE INDEX "Citation_doi_idx" ON "Citation"("doi");

-- CreateIndex
CREATE INDEX "KnowledgeSource_organizationId_idx" ON "KnowledgeSource"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeSource_type_idx" ON "KnowledgeSource"("type");

-- CreateIndex
CREATE INDEX "KnowledgeSource_status_idx" ON "KnowledgeSource"("status");

-- CreateIndex
CREATE INDEX "KnowledgeIngestionJob_sourceId_idx" ON "KnowledgeIngestionJob"("sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeIngestionJob_status_idx" ON "KnowledgeIngestionJob"("status");

-- CreateIndex
CREATE INDEX "KnowledgeIngestionJob_createdAt_idx" ON "KnowledgeIngestionJob"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeQualityCheck_entityType_entityId_idx" ON "KnowledgeQualityCheck"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeQualityCheck_checkType_idx" ON "KnowledgeQualityCheck"("checkType");

-- CreateIndex
CREATE INDEX "KnowledgeQualityCheck_status_idx" ON "KnowledgeQualityCheck"("status");

-- CreateIndex
CREATE INDEX "KnowledgeVersion_entityType_entityId_version_idx" ON "KnowledgeVersion"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "KnowledgeApproval_entityType_entityId_idx" ON "KnowledgeApproval"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeApproval_status_idx" ON "KnowledgeApproval"("status");

-- CreateIndex
CREATE INDEX "KnowledgeAutomationRule_organizationId_idx" ON "KnowledgeAutomationRule"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeAutomationRule_isActive_idx" ON "KnowledgeAutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "KnowledgeAutomationRule_trigger_idx" ON "KnowledgeAutomationRule"("trigger");

-- CreateIndex
CREATE INDEX "KnowledgeAutomationLog_ruleId_idx" ON "KnowledgeAutomationLog"("ruleId");

-- CreateIndex
CREATE INDEX "KnowledgeAutomationLog_status_idx" ON "KnowledgeAutomationLog"("status");

-- CreateIndex
CREATE INDEX "KnowledgeAutomationLog_createdAt_idx" ON "KnowledgeAutomationLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiRequestLog_userId_createdAt_idx" ON "AiRequestLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRequestLog_modelId_idx" ON "AiRequestLog"("modelId");

-- CreateIndex
CREATE INDEX "AiRequestLog_status_idx" ON "AiRequestLog"("status");

-- CreateIndex
CREATE INDEX "AiRequestLog_createdAt_idx" ON "AiRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiModel_provider_idx" ON "AiModel"("provider");

-- CreateIndex
CREATE INDEX "AiModel_status_idx" ON "AiModel"("status");

-- CreateIndex
CREATE INDEX "AiModel_health_idx" ON "AiModel"("health");

-- CreateIndex
CREATE INDEX "AiModelVersion_modelId_idx" ON "AiModelVersion"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "AiModelVersion_modelId_version_key" ON "AiModelVersion"("modelId", "version");

-- CreateIndex
CREATE INDEX "AiModelMetric_modelId_metric_timestamp_idx" ON "AiModelMetric"("modelId", "metric", "timestamp");

-- CreateIndex
CREATE INDEX "AiAgent_type_idx" ON "AiAgent"("type");

-- CreateIndex
CREATE INDEX "AiAgent_status_idx" ON "AiAgent"("status");

-- CreateIndex
CREATE INDEX "AiAgent_organizationId_idx" ON "AiAgent"("organizationId");

-- CreateIndex
CREATE INDEX "AiAgentSession_agentId_idx" ON "AiAgentSession"("agentId");

-- CreateIndex
CREATE INDEX "AiAgentSession_userId_idx" ON "AiAgentSession"("userId");

-- CreateIndex
CREATE INDEX "AiAgentSession_status_idx" ON "AiAgentSession"("status");

-- CreateIndex
CREATE INDEX "AiAgentSession_startedAt_idx" ON "AiAgentSession"("startedAt");

-- CreateIndex
CREATE INDEX "AiAgentMessage_sessionId_createdAt_idx" ON "AiAgentMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AiMemory_userId_type_idx" ON "AiMemory"("userId", "type");

-- CreateIndex
CREATE INDEX "AiMemory_userId_createdAt_idx" ON "AiMemory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiMemory_type_idx" ON "AiMemory"("type");

-- CreateIndex
CREATE INDEX "AiMemory_relevance_idx" ON "AiMemory"("relevance");

-- CreateIndex
CREATE INDEX "AiPlan_userId_status_idx" ON "AiPlan"("userId", "status");

-- CreateIndex
CREATE INDEX "AiPlan_userId_createdAt_idx" ON "AiPlan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiPlanStep_planId_order_idx" ON "AiPlanStep"("planId", "order");

-- CreateIndex
CREATE INDEX "AiPlanStep_status_idx" ON "AiPlanStep"("status");

-- CreateIndex
CREATE INDEX "AiReflection_planId_idx" ON "AiReflection"("planId");

-- CreateIndex
CREATE INDEX "AiReflection_userId_idx" ON "AiReflection"("userId");

-- CreateIndex
CREATE INDEX "AiReflection_createdAt_idx" ON "AiReflection"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiTool_name_key" ON "AiTool"("name");

-- CreateIndex
CREATE INDEX "AiTool_category_idx" ON "AiTool"("category");

-- CreateIndex
CREATE INDEX "AiTool_isActive_idx" ON "AiTool"("isActive");

-- CreateIndex
CREATE INDEX "AiToolExecution_toolId_createdAt_idx" ON "AiToolExecution"("toolId", "createdAt");

-- CreateIndex
CREATE INDEX "AiToolExecution_userId_idx" ON "AiToolExecution"("userId");

-- CreateIndex
CREATE INDEX "AiToolExecution_status_idx" ON "AiToolExecution"("status");

-- CreateIndex
CREATE INDEX "AiToolExecution_createdAt_idx" ON "AiToolExecution"("createdAt");

-- CreateIndex
CREATE INDEX "AiEvaluation_sessionId_idx" ON "AiEvaluation"("sessionId");

-- CreateIndex
CREATE INDEX "AiEvaluation_userId_idx" ON "AiEvaluation"("userId");

-- CreateIndex
CREATE INDEX "AiEvaluation_metric_idx" ON "AiEvaluation"("metric");

-- CreateIndex
CREATE INDEX "AiEvaluation_createdAt_idx" ON "AiEvaluation"("createdAt");

-- CreateIndex
CREATE INDEX "AiFeedback_sessionId_idx" ON "AiFeedback"("sessionId");

-- CreateIndex
CREATE INDEX "AiFeedback_userId_idx" ON "AiFeedback"("userId");

-- CreateIndex
CREATE INDEX "AiFeedback_rating_idx" ON "AiFeedback"("rating");

-- CreateIndex
CREATE INDEX "AiFeedback_createdAt_idx" ON "AiFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "AiAlert_type_status_idx" ON "AiAlert"("type", "status");

-- CreateIndex
CREATE INDEX "AiAlert_severity_idx" ON "AiAlert"("severity");

-- CreateIndex
CREATE INDEX "AiAlert_status_idx" ON "AiAlert"("status");

-- CreateIndex
CREATE INDEX "AiAlert_createdAt_idx" ON "AiAlert"("createdAt");

-- CreateIndex
CREATE INDEX "AiMetric_metric_timestamp_idx" ON "AiMetric"("metric", "timestamp");

-- CreateIndex
CREATE INDEX "AiMetric_timestamp_idx" ON "AiMetric"("timestamp");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Discussion_authorId_idx" ON "Discussion"("authorId");

-- CreateIndex
CREATE INDEX "Discussion_organizationId_idx" ON "Discussion"("organizationId");

-- CreateIndex
CREATE INDEX "Discussion_category_idx" ON "Discussion"("category");

-- CreateIndex
CREATE INDEX "Discussion_status_idx" ON "Discussion"("status");

-- CreateIndex
CREATE INDEX "Discussion_createdAt_idx" ON "Discussion"("createdAt");

-- CreateIndex
CREATE INDEX "DiscussionReply_discussionId_createdAt_idx" ON "DiscussionReply"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionReply_userId_idx" ON "DiscussionReply"("userId");

-- CreateIndex
CREATE INDEX "DiscussionReply_parentId_idx" ON "DiscussionReply"("parentId");

-- CreateIndex
CREATE INDEX "ActivityFeed_userId_createdAt_idx" ON "ActivityFeed"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityFeed_entityType_entityId_idx" ON "ActivityFeed"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityFeed_organizationId_idx" ON "ActivityFeed"("organizationId");

-- CreateIndex
CREATE INDEX "ActivityFeed_createdAt_idx" ON "ActivityFeed"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_organizationId_idx" ON "EmailTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailLog_templateId_idx" ON "EmailLog"("templateId");

-- CreateIndex
CREATE INDEX "EmailLog_to_idx" ON "EmailLog"("to");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "AcademicYear_organizationId_idx" ON "AcademicYear"("organizationId");

-- CreateIndex
CREATE INDEX "AcademicYear_status_idx" ON "AcademicYear"("status");

-- CreateIndex
CREATE INDEX "Semester_academicYearId_idx" ON "Semester"("academicYearId");

-- CreateIndex
CREATE INDEX "Semester_status_idx" ON "Semester"("status");

-- CreateIndex
CREATE INDEX "Term_semesterId_idx" ON "Term"("semesterId");

-- CreateIndex
CREATE INDEX "AcademicSection_programId_idx" ON "AcademicSection"("programId");

-- CreateIndex
CREATE INDEX "AcademicSection_status_idx" ON "AcademicSection"("status");

-- CreateIndex
CREATE INDEX "StudentCohort_programId_idx" ON "StudentCohort"("programId");

-- CreateIndex
CREATE INDEX "StudentCohort_year_idx" ON "StudentCohort"("year");

-- CreateIndex
CREATE INDEX "Curriculum_programId_idx" ON "Curriculum"("programId");

-- CreateIndex
CREATE INDEX "Curriculum_status_idx" ON "Curriculum"("status");

-- CreateIndex
CREATE INDEX "Curriculum_approvalStatus_idx" ON "Curriculum"("approvalStatus");

-- CreateIndex
CREATE INDEX "CurriculumCourse_curriculumId_idx" ON "CurriculumCourse"("curriculumId");

-- CreateIndex
CREATE INDEX "CurriculumCourse_courseId_idx" ON "CurriculumCourse"("courseId");

-- CreateIndex
CREATE INDEX "DegreeRequirement_programId_idx" ON "DegreeRequirement"("programId");

-- CreateIndex
CREATE INDEX "DegreeRequirement_type_idx" ON "DegreeRequirement"("type");

-- CreateIndex
CREATE INDEX "AcademicRegulation_organizationId_idx" ON "AcademicRegulation"("organizationId");

-- CreateIndex
CREATE INDEX "AcademicRegulation_category_idx" ON "AcademicRegulation"("category");

-- CreateIndex
CREATE INDEX "AcademicRegulation_status_idx" ON "AcademicRegulation"("status");

-- CreateIndex
CREATE INDEX "CourseOutcome_courseId_idx" ON "CourseOutcome"("courseId");

-- CreateIndex
CREATE INDEX "Prerequisite_courseId_idx" ON "Prerequisite"("courseId");

-- CreateIndex
CREATE INDEX "Prerequisite_prerequisiteCourseId_idx" ON "Prerequisite"("prerequisiteCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "Prerequisite_courseId_prerequisiteCourseId_key" ON "Prerequisite"("courseId", "prerequisiteCourseId");

-- CreateIndex
CREATE INDEX "CourseResource_courseId_idx" ON "CourseResource"("courseId");

-- CreateIndex
CREATE INDEX "CourseResource_type_idx" ON "CourseResource"("type");

-- CreateIndex
CREATE INDEX "AcademicModule_courseId_idx" ON "AcademicModule"("courseId");

-- CreateIndex
CREATE INDEX "AcademicModule_order_idx" ON "AcademicModule"("order");

-- CreateIndex
CREATE INDEX "Topic_moduleId_idx" ON "Topic"("moduleId");

-- CreateIndex
CREATE INDEX "Topic_order_idx" ON "Topic"("order");

-- CreateIndex
CREATE INDEX "Lesson_topicId_idx" ON "Lesson"("topicId");

-- CreateIndex
CREATE INDEX "Lesson_order_idx" ON "Lesson"("order");

-- CreateIndex
CREATE INDEX "Lesson_type_idx" ON "Lesson"("type");

-- CreateIndex
CREATE INDEX "LearningObjective_lessonId_idx" ON "LearningObjective"("lessonId");

-- CreateIndex
CREATE INDEX "Timetable_semesterId_idx" ON "Timetable"("semesterId");

-- CreateIndex
CREATE INDEX "Timetable_status_idx" ON "Timetable"("status");

-- CreateIndex
CREATE INDEX "TimetableSlot_timetableId_idx" ON "TimetableSlot"("timetableId");

-- CreateIndex
CREATE INDEX "TimetableSlot_courseId_idx" ON "TimetableSlot"("courseId");

-- CreateIndex
CREATE INDEX "TimetableSlot_classroomId_idx" ON "TimetableSlot"("classroomId");

-- CreateIndex
CREATE INDEX "TimetableSlot_facultyId_idx" ON "TimetableSlot"("facultyId");

-- CreateIndex
CREATE INDEX "TimetableSlot_dayOfWeek_startTime_idx" ON "TimetableSlot"("dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "ExaminationSchedule_semesterId_idx" ON "ExaminationSchedule"("semesterId");

-- CreateIndex
CREATE INDEX "ExaminationSchedule_courseId_idx" ON "ExaminationSchedule"("courseId");

-- CreateIndex
CREATE INDEX "ExaminationSchedule_date_idx" ON "ExaminationSchedule"("date");

-- CreateIndex
CREATE INDEX "ExaminationSchedule_status_idx" ON "ExaminationSchedule"("status");

-- CreateIndex
CREATE INDEX "CreditRule_programId_idx" ON "CreditRule"("programId");

-- CreateIndex
CREATE INDEX "AcademicStanding_studentId_idx" ON "AcademicStanding"("studentId");

-- CreateIndex
CREATE INDEX "AcademicStanding_semesterId_idx" ON "AcademicStanding"("semesterId");

-- CreateIndex
CREATE INDEX "AcademicStanding_standing_idx" ON "AcademicStanding"("standing");

-- CreateIndex
CREATE INDEX "GraduationProgress_studentId_idx" ON "GraduationProgress"("studentId");

-- CreateIndex
CREATE INDEX "GraduationProgress_programId_idx" ON "GraduationProgress"("programId");

-- CreateIndex
CREATE INDEX "GraduationProgress_status_idx" ON "GraduationProgress"("status");

-- CreateIndex
CREATE INDEX "AcademicResource_courseId_idx" ON "AcademicResource"("courseId");

-- CreateIndex
CREATE INDEX "AcademicResource_type_idx" ON "AcademicResource"("type");

-- CreateIndex
CREATE INDEX "ReadingList_courseId_idx" ON "ReadingList"("courseId");

-- CreateIndex
CREATE INDEX "AcademicPolicy_organizationId_idx" ON "AcademicPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "AcademicPolicy_category_idx" ON "AcademicPolicy"("category");

-- CreateIndex
CREATE INDEX "AcademicPolicy_status_idx" ON "AcademicPolicy"("status");

-- CreateIndex
CREATE INDEX "CourseAllocation_courseId_idx" ON "CourseAllocation"("courseId");

-- CreateIndex
CREATE INDEX "CourseAllocation_semesterId_idx" ON "CourseAllocation"("semesterId");

-- CreateIndex
CREATE INDEX "CourseAllocation_facultyId_idx" ON "CourseAllocation"("facultyId");

-- CreateIndex
CREATE INDEX "CourseAllocation_classroomId_idx" ON "CourseAllocation"("classroomId");

-- CreateIndex
CREATE INDEX "Waitlist_courseId_idx" ON "Waitlist"("courseId");

-- CreateIndex
CREATE INDEX "Waitlist_studentId_idx" ON "Waitlist"("studentId");

-- CreateIndex
CREATE INDEX "Waitlist_status_idx" ON "Waitlist"("status");

-- CreateIndex
CREATE INDEX "CourseRegistration_studentId_idx" ON "CourseRegistration"("studentId");

-- CreateIndex
CREATE INDEX "CourseRegistration_courseId_idx" ON "CourseRegistration"("courseId");

-- CreateIndex
CREATE INDEX "CourseRegistration_semesterId_idx" ON "CourseRegistration"("semesterId");

-- CreateIndex
CREATE INDEX "CourseRegistration_status_idx" ON "CourseRegistration"("status");

-- CreateIndex
CREATE INDEX "LearningJourney_studentId_idx" ON "LearningJourney"("studentId");

-- CreateIndex
CREATE INDEX "LearningJourney_status_idx" ON "LearningJourney"("status");

-- CreateIndex
CREATE INDEX "LearningJourney_startDate_idx" ON "LearningJourney"("startDate");

-- CreateIndex
CREATE INDEX "LearningMilestone_journeyId_idx" ON "LearningMilestone"("journeyId");

-- CreateIndex
CREATE INDEX "LearningMilestone_status_idx" ON "LearningMilestone"("status");

-- CreateIndex
CREATE INDEX "DailyLearningGoal_journeyId_idx" ON "DailyLearningGoal"("journeyId");

-- CreateIndex
CREATE INDEX "DailyLearningGoal_date_idx" ON "DailyLearningGoal"("date");

-- CreateIndex
CREATE INDEX "WeeklyLearningGoal_journeyId_idx" ON "WeeklyLearningGoal"("journeyId");

-- CreateIndex
CREATE INDEX "WeeklyLearningGoal_weekStart_idx" ON "WeeklyLearningGoal"("weekStart");

-- CreateIndex
CREATE INDEX "MonthlyLearningGoal_journeyId_idx" ON "MonthlyLearningGoal"("journeyId");

-- CreateIndex
CREATE INDEX "MonthlyLearningGoal_monthStart_idx" ON "MonthlyLearningGoal"("monthStart");

-- CreateIndex
CREATE INDEX "FlashcardDeck_studentId_idx" ON "FlashcardDeck"("studentId");

-- CreateIndex
CREATE INDEX "FlashcardDeck_courseId_idx" ON "FlashcardDeck"("courseId");

-- CreateIndex
CREATE INDEX "FlashcardDeck_isPublic_idx" ON "FlashcardDeck"("isPublic");

-- CreateIndex
CREATE INDEX "Flashcard_deckId_idx" ON "Flashcard"("deckId");

-- CreateIndex
CREATE INDEX "Flashcard_nextReview_idx" ON "Flashcard"("nextReview");

-- CreateIndex
CREATE INDEX "Flashcard_difficulty_idx" ON "Flashcard"("difficulty");

-- CreateIndex
CREATE INDEX "FlashcardReview_cardId_idx" ON "FlashcardReview"("cardId");

-- CreateIndex
CREATE INDEX "FlashcardReview_reviewedAt_idx" ON "FlashcardReview"("reviewedAt");

-- CreateIndex
CREATE INDEX "StudySession_studentId_idx" ON "StudySession"("studentId");

-- CreateIndex
CREATE INDEX "StudySession_courseId_idx" ON "StudySession"("courseId");

-- CreateIndex
CREATE INDEX "StudySession_status_idx" ON "StudySession"("status");

-- CreateIndex
CREATE INDEX "StudySession_startedAt_idx" ON "StudySession"("startedAt");

-- CreateIndex
CREATE INDEX "StudyPlan_studentId_idx" ON "StudyPlan"("studentId");

-- CreateIndex
CREATE INDEX "StudyPlan_status_idx" ON "StudyPlan"("status");

-- CreateIndex
CREATE INDEX "StudyReminder_studentId_idx" ON "StudyReminder"("studentId");

-- CreateIndex
CREATE INDEX "StudyReminder_reminderTime_idx" ON "StudyReminder"("reminderTime");

-- CreateIndex
CREATE INDEX "StudyReminder_active_idx" ON "StudyReminder"("active");

-- CreateIndex
CREATE INDEX "LearningMemory_studentId_idx" ON "LearningMemory"("studentId");

-- CreateIndex
CREATE INDEX "LearningMemory_masteryLevel_idx" ON "LearningMemory"("masteryLevel");

-- CreateIndex
CREATE INDEX "LearningMemory_lastAccessed_idx" ON "LearningMemory"("lastAccessed");

-- CreateIndex
CREATE UNIQUE INDEX "LearningMemory_studentId_concept_key" ON "LearningMemory"("studentId", "concept");

-- CreateIndex
CREATE INDEX "KnowledgeGap_studentId_idx" ON "KnowledgeGap"("studentId");

-- CreateIndex
CREATE INDEX "KnowledgeGap_courseId_idx" ON "KnowledgeGap"("courseId");

-- CreateIndex
CREATE INDEX "KnowledgeGap_severity_idx" ON "KnowledgeGap"("severity");

-- CreateIndex
CREATE INDEX "KnowledgeGap_status_idx" ON "KnowledgeGap"("status");

-- CreateIndex
CREATE INDEX "SpacedRepetitionItem_studentId_idx" ON "SpacedRepetitionItem"("studentId");

-- CreateIndex
CREATE INDEX "SpacedRepetitionItem_nextReview_idx" ON "SpacedRepetitionItem"("nextReview");

-- CreateIndex
CREATE INDEX "SpacedRepetitionItem_courseId_idx" ON "SpacedRepetitionItem"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "SpacedRepetitionItem_studentId_concept_key" ON "SpacedRepetitionItem"("studentId", "concept");

-- CreateIndex
CREATE INDEX "MasteryPrediction_studentId_idx" ON "MasteryPrediction"("studentId");

-- CreateIndex
CREATE INDEX "MasteryPrediction_courseId_idx" ON "MasteryPrediction"("courseId");

-- CreateIndex
CREATE INDEX "MasteryPrediction_predictedAt_idx" ON "MasteryPrediction"("predictedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningStreak_studentId_key" ON "LearningStreak"("studentId");

-- CreateIndex
CREATE INDEX "ExperiencePoints_studentId_idx" ON "ExperiencePoints"("studentId");

-- CreateIndex
CREATE INDEX "ExperiencePoints_source_idx" ON "ExperiencePoints"("source");

-- CreateIndex
CREATE INDEX "ExperiencePoints_createdAt_idx" ON "ExperiencePoints"("createdAt");

-- CreateIndex
CREATE INDEX "LearningChallenge_status_idx" ON "LearningChallenge"("status");

-- CreateIndex
CREATE INDEX "LearningChallenge_startDate_idx" ON "LearningChallenge"("startDate");

-- CreateIndex
CREATE INDEX "LearningChallenge_type_idx" ON "LearningChallenge"("type");

-- CreateIndex
CREATE INDEX "PeerLearningGroup_courseId_idx" ON "PeerLearningGroup"("courseId");

-- CreateIndex
CREATE INDEX "PeerLearningGroup_createdBy_idx" ON "PeerLearningGroup"("createdBy");

-- CreateIndex
CREATE INDEX "PeerLearningGroup_status_idx" ON "PeerLearningGroup"("status");

-- CreateIndex
CREATE INDEX "DigitalCredential_studentId_idx" ON "DigitalCredential"("studentId");

-- CreateIndex
CREATE INDEX "DigitalCredential_credentialType_idx" ON "DigitalCredential"("credentialType");

-- CreateIndex
CREATE INDEX "DigitalCredential_status_idx" ON "DigitalCredential"("status");

-- CreateIndex
CREATE INDEX "DigitalCredential_issuedDate_idx" ON "DigitalCredential"("issuedDate");

-- CreateIndex
CREATE INDEX "AcademicTranscript_studentId_idx" ON "AcademicTranscript"("studentId");

-- CreateIndex
CREATE INDEX "AcademicTranscript_programId_idx" ON "AcademicTranscript"("programId");

-- CreateIndex
CREATE INDEX "AcademicTranscript_semesterId_idx" ON "AcademicTranscript"("semesterId");

-- CreateIndex
CREATE INDEX "AcademicTranscript_status_idx" ON "AcademicTranscript"("status");

-- CreateIndex
CREATE INDEX "AIExplainRequest_studentId_idx" ON "AIExplainRequest"("studentId");

-- CreateIndex
CREATE INDEX "AIExplainRequest_topic_idx" ON "AIExplainRequest"("topic");

-- CreateIndex
CREATE INDEX "AIExplainRequest_mode_idx" ON "AIExplainRequest"("mode");

-- CreateIndex
CREATE INDEX "AIExplainRequest_createdAt_idx" ON "AIExplainRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AIGeneratedQuiz_studentId_idx" ON "AIGeneratedQuiz"("studentId");

-- CreateIndex
CREATE INDEX "AIGeneratedQuiz_courseId_idx" ON "AIGeneratedQuiz"("courseId");

-- CreateIndex
CREATE INDEX "AIGeneratedQuiz_completedAt_idx" ON "AIGeneratedQuiz"("completedAt");

-- CreateIndex
CREATE INDEX "AIStudyRecommendation_studentId_idx" ON "AIStudyRecommendation"("studentId");

-- CreateIndex
CREATE INDEX "AIStudyRecommendation_type_idx" ON "AIStudyRecommendation"("type");

-- CreateIndex
CREATE INDEX "AIStudyRecommendation_priority_idx" ON "AIStudyRecommendation"("priority");

-- CreateIndex
CREATE INDEX "AIStudyRecommendation_accepted_idx" ON "AIStudyRecommendation"("accepted");

-- CreateIndex
CREATE INDEX "AILearningInsight_studentId_idx" ON "AILearningInsight"("studentId");

-- CreateIndex
CREATE INDEX "AILearningInsight_insightType_idx" ON "AILearningInsight"("insightType");

-- CreateIndex
CREATE INDEX "AILearningInsight_confidence_idx" ON "AILearningInsight"("confidence");

-- CreateIndex
CREATE INDEX "AILearningInsight_actionable_idx" ON "AILearningInsight"("actionable");

-- CreateIndex
CREATE INDEX "ResearchProject_status_idx" ON "ResearchProject"("status");

-- CreateIndex
CREATE INDEX "ResearchProject_principalInvestigatorId_idx" ON "ResearchProject"("principalInvestigatorId");

-- CreateIndex
CREATE INDEX "ResearchTask_projectId_idx" ON "ResearchTask"("projectId");

-- CreateIndex
CREATE INDEX "ResearchTask_assigneeId_idx" ON "ResearchTask"("assigneeId");

-- CreateIndex
CREATE INDEX "ResearchNotebook_projectId_idx" ON "ResearchNotebook"("projectId");

-- CreateIndex
CREATE INDEX "ResearchNotebook_authorId_idx" ON "ResearchNotebook"("authorId");

-- CreateIndex
CREATE INDEX "ResearchGoal_projectId_idx" ON "ResearchGoal"("projectId");

-- CreateIndex
CREATE INDEX "PaperCollection_studentId_idx" ON "PaperCollection"("studentId");

-- CreateIndex
CREATE INDEX "CitationNetwork_paperId_idx" ON "CitationNetwork"("paperId");

-- CreateIndex
CREATE INDEX "CitationNetwork_citedPaperId_idx" ON "CitationNetwork"("citedPaperId");

-- CreateIndex
CREATE UNIQUE INDEX "CitationNetwork_paperId_citedPaperId_key" ON "CitationNetwork"("paperId", "citedPaperId");

-- CreateIndex
CREATE INDEX "ResearchTrend_topic_idx" ON "ResearchTrend"("topic");

-- CreateIndex
CREATE INDEX "ResearchTrend_trendScore_idx" ON "ResearchTrend"("trendScore");

-- CreateIndex
CREATE INDEX "ResearchSummary_paperId_idx" ON "ResearchSummary"("paperId");

-- CreateIndex
CREATE INDEX "ReadingListResearch_studentId_idx" ON "ReadingListResearch"("studentId");

-- CreateIndex
CREATE INDEX "ResearchHypothesis_projectId_idx" ON "ResearchHypothesis"("projectId");

-- CreateIndex
CREATE INDEX "ExperimentDesignResearch_projectId_idx" ON "ExperimentDesignResearch"("projectId");

-- CreateIndex
CREATE INDEX "PeerReviewRecord_paperId_idx" ON "PeerReviewRecord"("paperId");

-- CreateIndex
CREATE INDEX "Experiment_projectId_idx" ON "Experiment"("projectId");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "ExperimentVariable_experimentId_idx" ON "ExperimentVariable"("experimentId");

-- CreateIndex
CREATE INDEX "ExperimentResult_experimentId_idx" ON "ExperimentResult"("experimentId");

-- CreateIndex
CREATE INDEX "ExperimentVersion_experimentId_idx" ON "ExperimentVersion"("experimentId");

-- CreateIndex
CREATE INDEX "ProtocolTemplate_category_idx" ON "ProtocolTemplate"("category");

-- CreateIndex
CREATE INDEX "DatasetVersion_datasetId_idx" ON "DatasetVersion"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetAnnotation_datasetId_idx" ON "DatasetAnnotation"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetValidationRule_datasetId_idx" ON "DatasetValidationRule"("datasetId");

-- CreateIndex
CREATE INDEX "Publication_status_idx" ON "Publication"("status");

-- CreateIndex
CREATE INDEX "Publication_doi_idx" ON "Publication"("doi");

-- CreateIndex
CREATE INDEX "SubmissionTracker_publicationId_idx" ON "SubmissionTracker"("publicationId");

-- CreateIndex
CREATE INDEX "SubmissionTracker_status_idx" ON "SubmissionTracker"("status");

-- CreateIndex
CREATE INDEX "JournalRecommendation_publicationId_idx" ON "JournalRecommendation"("publicationId");

-- CreateIndex
CREATE INDEX "ReferenceListItem_publicationId_idx" ON "ReferenceListItem"("publicationId");

-- CreateIndex
CREATE INDEX "Patent_status_idx" ON "Patent"("status");

-- CreateIndex
CREATE INDEX "Patent_patentNumber_idx" ON "Patent"("patentNumber");

-- CreateIndex
CREATE INDEX "IdeaSubmission_submittedBy_idx" ON "IdeaSubmission"("submittedBy");

-- CreateIndex
CREATE INDEX "IdeaSubmission_status_idx" ON "IdeaSubmission"("status");

-- CreateIndex
CREATE INDEX "InnovationPipeline_ideaId_idx" ON "InnovationPipeline"("ideaId");

-- CreateIndex
CREATE INDEX "TechnologyTransfer_patentId_idx" ON "TechnologyTransfer"("patentId");

-- CreateIndex
CREATE INDEX "GrantOpportunity_deadline_idx" ON "GrantOpportunity"("deadline");

-- CreateIndex
CREATE INDEX "GrantOpportunity_status_idx" ON "GrantOpportunity"("status");

-- CreateIndex
CREATE INDEX "GrantApplication_grantOpportunityId_idx" ON "GrantApplication"("grantOpportunityId");

-- CreateIndex
CREATE INDEX "GrantApplication_status_idx" ON "GrantApplication"("status");

-- CreateIndex
CREATE INDEX "ResearchTeam_principalInvestigatorId_idx" ON "ResearchTeam"("principalInvestigatorId");

-- CreateIndex
CREATE INDEX "ResearchComment_entityType_entityId_idx" ON "ResearchComment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ResearchComment_authorId_idx" ON "ResearchComment"("authorId");

-- CreateIndex
CREATE INDEX "ExpertNetwork_userId_idx" ON "ExpertNetwork"("userId");

-- CreateIndex
CREATE INDEX "PublicationMetric_researcherId_idx" ON "PublicationMetric"("researcherId");

-- CreateIndex
CREATE INDEX "PublicationMetric_metricType_idx" ON "PublicationMetric"("metricType");

-- CreateIndex
CREATE INDEX "ResearchImpactScore_researcherId_idx" ON "ResearchImpactScore"("researcherId");

-- CreateIndex
CREATE INDEX "ResearchFundingMetric_organizationId_idx" ON "ResearchFundingMetric"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerProfile_studentId_key" ON "CareerProfile"("studentId");

-- CreateIndex
CREATE INDEX "CareerGoal_studentId_status_idx" ON "CareerGoal"("studentId", "status");

-- CreateIndex
CREATE INDEX "InterviewSession_studentId_createdAt_idx" ON "InterviewSession"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewSession_studentId_type_idx" ON "InterviewSession"("studentId", "type");

-- CreateIndex
CREATE INDEX "Alumni_graduationYear_idx" ON "Alumni"("graduationYear");

-- CreateIndex
CREATE INDEX "Alumni_industry_idx" ON "Alumni"("industry");

-- CreateIndex
CREATE INDEX "Alumni_mentorAvailable_idx" ON "Alumni"("mentorAvailable");

-- CreateIndex
CREATE INDEX "AlumniConnection_studentId_idx" ON "AlumniConnection"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniConnection_alumniId_studentId_key" ON "AlumniConnection"("alumniId", "studentId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_type_active_idx" ON "MarketplaceListing"("type", "active");

-- CreateIndex
CREATE INDEX "MarketplaceListing_rating_idx" ON "MarketplaceListing"("rating");

-- CreateIndex
CREATE INDEX "MarketplaceListing_featured_idx" ON "MarketplaceListing"("featured");

-- CreateIndex
CREATE INDEX "CareerIntelligenceSnapshot_studentId_targetRole_idx" ON "CareerIntelligenceSnapshot"("studentId", "targetRole");

-- CreateIndex
CREATE INDEX "CareerIntelligenceSnapshot_computedAt_idx" ON "CareerIntelligenceSnapshot"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_facultyId_key" ON "FacultyProfile"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE INDEX "FacultyProfile_universityId_idx" ON "FacultyProfile"("universityId");

-- CreateIndex
CREATE INDEX "FacultyProfile_facultyId_idx" ON "FacultyProfile"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyBriefing_facultyId_date_idx" ON "FacultyBriefing"("facultyId", "date");

-- CreateIndex
CREATE INDEX "TeachingPlan_facultyId_idx" ON "TeachingPlan"("facultyId");

-- CreateIndex
CREATE INDEX "TeachingPlan_universityId_idx" ON "TeachingPlan"("universityId");

-- CreateIndex
CREATE INDEX "LearningResource_facultyId_idx" ON "LearningResource"("facultyId");

-- CreateIndex
CREATE INDEX "LearningResource_universityId_idx" ON "LearningResource"("universityId");

-- CreateIndex
CREATE INDEX "ContentItem_facultyId_idx" ON "ContentItem"("facultyId");

-- CreateIndex
CREATE INDEX "TeachingTimeline_facultyId_date_idx" ON "TeachingTimeline"("facultyId", "date");

-- CreateIndex
CREATE INDEX "StudentAlert_facultyId_idx" ON "StudentAlert"("facultyId");

-- CreateIndex
CREATE INDEX "StudentAlert_studentId_idx" ON "StudentAlert"("studentId");

-- CreateIndex
CREATE INDEX "StudentAlert_universityId_idx" ON "StudentAlert"("universityId");

-- CreateIndex
CREATE INDEX "StudentRecommendation_facultyId_idx" ON "StudentRecommendation"("facultyId");

-- CreateIndex
CREATE INDEX "StudentRecommendation_studentId_idx" ON "StudentRecommendation"("studentId");

-- CreateIndex
CREATE INDEX "FacultyMentee_facultyId_idx" ON "FacultyMentee"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyMentee_studentId_idx" ON "FacultyMentee"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyMentee_facultyId_studentId_key" ON "FacultyMentee"("facultyId", "studentId");

-- CreateIndex
CREATE INDEX "AdvisingSession_facultyId_idx" ON "AdvisingSession"("facultyId");

-- CreateIndex
CREATE INDEX "AdvisingSession_studentId_idx" ON "AdvisingSession"("studentId");

-- CreateIndex
CREATE INDEX "GoalTracking_menteeId_idx" ON "GoalTracking"("menteeId");

-- CreateIndex
CREATE INDEX "FacultyPublication_facultyId_idx" ON "FacultyPublication"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyCertification_facultyId_idx" ON "FacultyCertification"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyAward_facultyId_idx" ON "FacultyAward"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyWorkshop_facultyId_idx" ON "FacultyWorkshop"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyTraining_facultyId_idx" ON "FacultyTraining"("facultyId");

-- CreateIndex
CREATE INDEX "DepartmentDiscussion_departmentId_idx" ON "DepartmentDiscussion"("departmentId");

-- CreateIndex
CREATE INDEX "DepartmentDiscussion_universityId_idx" ON "DepartmentDiscussion"("universityId");

-- CreateIndex
CREATE INDEX "SharedResource_departmentId_idx" ON "SharedResource"("departmentId");

-- CreateIndex
CREATE INDEX "FacultyWorkload_facultyId_semester_idx" ON "FacultyWorkload"("facultyId", "semester");

-- CreateIndex
CREATE INDEX "LeaveRequest_facultyId_idx" ON "LeaveRequest"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyTimetable_facultyId_semester_idx" ON "FacultyTimetable"("facultyId", "semester");

-- CreateIndex
CREATE INDEX "CommitteeAssignment_facultyId_idx" ON "CommitteeAssignment"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyNote_facultyId_idx" ON "FacultyNote"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyBookmark_facultyId_idx" ON "FacultyBookmark"("facultyId");

-- CreateIndex
CREATE INDEX "SavedPrompt_facultyId_idx" ON "SavedPrompt"("facultyId");

-- CreateIndex
CREATE INDEX "Prediction_entityType_entityId_idx" ON "Prediction"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Prediction_predictionType_idx" ON "Prediction"("predictionType");

-- CreateIndex
CREATE INDEX "IntelligenceRecommendation_targetType_targetId_idx" ON "IntelligenceRecommendation"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "IntelligenceRecommendation_status_idx" ON "IntelligenceRecommendation"("status");

-- CreateIndex
CREATE INDEX "DataQualityRecord_domain_metric_idx" ON "DataQualityRecord"("domain", "metric");

-- CreateIndex
CREATE INDEX "DataLineageRecord_sourceEntity_sourceId_idx" ON "DataLineageRecord"("sourceEntity", "sourceId");

-- CreateIndex
CREATE INDEX "BenchmarkRecord_benchmarkType_metric_idx" ON "BenchmarkRecord"("benchmarkType", "metric");

-- CreateIndex
CREATE INDEX "IntelligenceReport_type_status_idx" ON "IntelligenceReport"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiVersion_version_key" ON "ApiVersion"("version");

-- CreateIndex
CREATE INDEX "ApiVersion_status_idx" ON "ApiVersion"("status");

-- CreateIndex
CREATE INDEX "ApiEndpoint_versionId_idx" ON "ApiEndpoint"("versionId");

-- CreateIndex
CREATE INDEX "ApiEndpoint_category_idx" ON "ApiEndpoint"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ApiEndpoint_versionId_method_path_key" ON "ApiEndpoint"("versionId", "method", "path");

-- CreateIndex
CREATE INDEX "ApiUsageLog_userId_createdAt_idx" ON "ApiUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_apiKeyId_createdAt_idx" ON "ApiUsageLog"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_endpoint_createdAt_idx" ON "ApiUsageLog"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_statusCode_createdAt_idx" ON "ApiUsageLog"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRateLimit_identifier_identifierType_idx" ON "ApiRateLimit"("identifier", "identifierType");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRateLimit_identifier_identifierType_windowStart_key" ON "ApiRateLimit"("identifier", "identifierType", "windowStart");

-- CreateIndex
CREATE INDEX "IntegrationConnector_provider_idx" ON "IntegrationConnector"("provider");

-- CreateIndex
CREATE INDEX "IntegrationConnector_category_idx" ON "IntegrationConnector"("category");

-- CreateIndex
CREATE INDEX "IntegrationConnector_status_idx" ON "IntegrationConnector"("status");

-- CreateIndex
CREATE INDEX "IntegrationInstance_connectorId_organizationId_idx" ON "IntegrationInstance"("connectorId", "organizationId");

-- CreateIndex
CREATE INDEX "IntegrationInstance_organizationId_idx" ON "IntegrationInstance"("organizationId");

-- CreateIndex
CREATE INDEX "IntegrationInstance_status_idx" ON "IntegrationInstance"("status");

-- CreateIndex
CREATE INDEX "IntegrationSyncJob_instanceId_createdAt_idx" ON "IntegrationSyncJob"("instanceId", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationSyncJob_status_idx" ON "IntegrationSyncJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plugin_slug_key" ON "Plugin"("slug");

-- CreateIndex
CREATE INDEX "Plugin_status_category_idx" ON "Plugin"("status", "category");

-- CreateIndex
CREATE INDEX "Plugin_authorId_idx" ON "Plugin"("authorId");

-- CreateIndex
CREATE INDEX "Plugin_rating_installCount_idx" ON "Plugin"("rating", "installCount");

-- CreateIndex
CREATE INDEX "PluginVersion_pluginId_idx" ON "PluginVersion"("pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "PluginVersion_pluginId_version_key" ON "PluginVersion"("pluginId", "version");

-- CreateIndex
CREATE INDEX "PluginInstallation_organizationId_idx" ON "PluginInstallation"("organizationId");

-- CreateIndex
CREATE INDEX "PluginInstallation_pluginId_idx" ON "PluginInstallation"("pluginId");

-- CreateIndex
CREATE INDEX "PluginInstallation_status_idx" ON "PluginInstallation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PluginInstallation_pluginId_organizationId_key" ON "PluginInstallation"("pluginId", "organizationId");

-- CreateIndex
CREATE INDEX "PluginReview_pluginId_idx" ON "PluginReview"("pluginId");

-- CreateIndex
CREATE INDEX "PluginReview_rating_idx" ON "PluginReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "PluginReview_pluginId_userId_key" ON "PluginReview"("pluginId", "userId");

-- CreateIndex
CREATE INDEX "PluginLog_pluginId_createdAt_idx" ON "PluginLog"("pluginId", "createdAt");

-- CreateIndex
CREATE INDEX "PluginLog_level_createdAt_idx" ON "PluginLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "DomainEvent_type_publishedAt_idx" ON "DomainEvent"("type", "publishedAt");

-- CreateIndex
CREATE INDEX "DomainEvent_entityType_entityId_idx" ON "DomainEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DomainEvent_source_publishedAt_idx" ON "DomainEvent"("source", "publishedAt");

-- CreateIndex
CREATE INDEX "WebhookSubscription_developerId_idx" ON "WebhookSubscription"("developerId");

-- CreateIndex
CREATE INDEX "WebhookSubscription_active_idx" ON "WebhookSubscription"("active");

-- CreateIndex
CREATE INDEX "WebhookDelivery_subscriptionId_createdAt_idx" ON "WebhookDelivery"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_event_createdAt_idx" ON "WebhookDelivery"("event", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceItem_slug_key" ON "MarketplaceItem"("slug");

-- CreateIndex
CREATE INDEX "MarketplaceItem_type_status_idx" ON "MarketplaceItem"("type", "status");

-- CreateIndex
CREATE INDEX "MarketplaceItem_category_status_idx" ON "MarketplaceItem"("category", "status");

-- CreateIndex
CREATE INDEX "MarketplaceItem_authorId_idx" ON "MarketplaceItem"("authorId");

-- CreateIndex
CREATE INDEX "MarketplaceItem_featured_status_idx" ON "MarketplaceItem"("featured", "status");

-- CreateIndex
CREATE INDEX "MarketplaceItem_rating_installCount_idx" ON "MarketplaceItem"("rating", "installCount");

-- CreateIndex
CREATE INDEX "MarketplaceItemVersion_itemId_idx" ON "MarketplaceItemVersion"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceItemVersion_itemId_version_key" ON "MarketplaceItemVersion"("itemId", "version");

-- CreateIndex
CREATE INDEX "MarketplaceItemReview_itemId_idx" ON "MarketplaceItemReview"("itemId");

-- CreateIndex
CREATE INDEX "MarketplaceItemReview_rating_idx" ON "MarketplaceItemReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceItemReview_itemId_userId_key" ON "MarketplaceItemReview"("itemId", "userId");

-- CreateIndex
CREATE INDEX "MarketplaceItemInstallation_itemId_organizationId_idx" ON "MarketplaceItemInstallation"("itemId", "organizationId");

-- CreateIndex
CREATE INDEX "MarketplaceItemInstallation_organizationId_idx" ON "MarketplaceItemInstallation"("organizationId");

-- CreateIndex
CREATE INDEX "MarketplaceItemInstallation_userId_idx" ON "MarketplaceItemInstallation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelConfig_organizationId_key" ON "WhiteLabelConfig"("organizationId");

-- CreateIndex
CREATE INDEX "InstitutionCollaboration_type_status_idx" ON "InstitutionCollaboration"("type", "status");

-- CreateIndex
CREATE INDEX "BetaProgram_status_idx" ON "BetaProgram"("status");

-- CreateIndex
CREATE INDEX "BetaEnrollment_programId_idx" ON "BetaEnrollment"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "BetaEnrollment_programId_userId_key" ON "BetaEnrollment"("programId", "userId");

-- CreateIndex
CREATE INDEX "LocalizationEntry_locale_idx" ON "LocalizationEntry"("locale");

-- CreateIndex
CREATE INDEX "LocalizationEntry_key_idx" ON "LocalizationEntry"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LocalizationEntry_key_locale_key" ON "LocalizationEntry"("key", "locale");

-- CreateIndex
CREATE INDEX "OrgAcademicCalendar_organizationId_idx" ON "OrgAcademicCalendar"("organizationId");

-- CreateIndex
CREATE INDEX "OrgAcademicCalendar_status_idx" ON "OrgAcademicCalendar"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrgAcademicCalendar_organizationId_year_key" ON "OrgAcademicCalendar"("organizationId", "year");

-- CreateIndex
CREATE INDEX "OrgSemester_calendarId_idx" ON "OrgSemester"("calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgSemester_calendarId_order_key" ON "OrgSemester"("calendarId", "order");

-- CreateIndex
CREATE INDEX "StudentEvent_studentId_idx" ON "StudentEvent"("studentId");

-- CreateIndex
CREATE INDEX "StudentEvent_eventType_idx" ON "StudentEvent"("eventType");

-- CreateIndex
CREATE INDEX "StudentEvent_createdAt_idx" ON "StudentEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_studentId_idx" ON "CompetencyEvidence"("studentId");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_competencyId_idx" ON "CompetencyEvidence"("competencyId");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_earnedAt_idx" ON "CompetencyEvidence"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyEvidence_studentId_competencyId_evidenceId_key" ON "CompetencyEvidence"("studentId", "competencyId", "evidenceId");

-- CreateIndex
CREATE INDEX "AIRecommendation_studentId_idx" ON "AIRecommendation"("studentId");

-- CreateIndex
CREATE INDEX "AIRecommendation_type_idx" ON "AIRecommendation"("type");

-- CreateIndex
CREATE INDEX "AIRecommendation_status_idx" ON "AIRecommendation"("status");

-- CreateIndex
CREATE INDEX "AIRecommendation_createdAt_idx" ON "AIRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "ai_tutoring_sessions_studentId_courseId_idx" ON "ai_tutoring_sessions"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "ai_tutoring_sessions_studentId_idx" ON "ai_tutoring_sessions"("studentId");

-- CreateIndex
CREATE INDEX "ai_content_generations_studentId_contentType_idx" ON "ai_content_generations"("studentId", "contentType");

-- CreateIndex
CREATE INDEX "ai_content_generations_studentId_idx" ON "ai_content_generations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_learning_profiles_studentId_key" ON "student_learning_profiles"("studentId");

-- CreateIndex
CREATE INDEX "ai_intervention_campaigns_studentId_status_idx" ON "ai_intervention_campaigns"("studentId", "status");

-- CreateIndex
CREATE INDEX "ai_intervention_campaigns_studentId_idx" ON "ai_intervention_campaigns"("studentId");

-- CreateIndex
CREATE INDEX "adaptive_difficulty_levels_studentId_courseId_idx" ON "adaptive_difficulty_levels"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "adaptive_difficulty_levels_studentId_idx" ON "adaptive_difficulty_levels"("studentId");

-- CreateIndex
CREATE INDEX "resume_ai_reviews_studentId_idx" ON "resume_ai_reviews"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "OntologyVersion_version_key" ON "OntologyVersion"("version");

-- CreateIndex
CREATE INDEX "OntologyVersion_createdAt_idx" ON "OntologyVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessMetrics_studentId_key" ON "SuccessMetrics"("studentId");

-- CreateIndex
CREATE INDEX "SuccessMetrics_universityId_studentId_idx" ON "SuccessMetrics"("universityId", "studentId");

-- CreateIndex
CREATE INDEX "SuccessMetrics_metricDate_idx" ON "SuccessMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "StudentGoal_universityId_studentId_status_idx" ON "StudentGoal"("universityId", "studentId", "status");

-- CreateIndex
CREATE INDEX "StudentGoal_targetDate_idx" ON "StudentGoal"("targetDate");

-- CreateIndex
CREATE INDEX "ProductivitySession_universityId_studentId_sessionDate_idx" ON "ProductivitySession"("universityId", "studentId", "sessionDate");

-- CreateIndex
CREATE INDEX "ProductivitySession_sessionDate_idx" ON "ProductivitySession"("sessionDate");

-- CreateIndex
CREATE INDEX "RiskIndicator_universityId_studentId_idx" ON "RiskIndicator"("universityId", "studentId");

-- CreateIndex
CREATE INDEX "RiskIndicator_riskLevel_idx" ON "RiskIndicator"("riskLevel");

-- CreateIndex
CREATE INDEX "RiskIndicator_lastAssessmentDate_idx" ON "RiskIndicator"("lastAssessmentDate");

-- CreateIndex
CREATE INDEX "ReadinessAssessment_universityId_studentId_assessmentType_idx" ON "ReadinessAssessment"("universityId", "studentId", "assessmentType");

-- CreateIndex
CREATE INDEX "ReadinessAssessment_assessmentDate_idx" ON "ReadinessAssessment"("assessmentDate");

-- CreateIndex
CREATE INDEX "StudentAchievement_universityId_studentId_idx" ON "StudentAchievement"("universityId", "studentId");

-- CreateIndex
CREATE INDEX "StudentAchievement_earnedAt_idx" ON "StudentAchievement"("earnedAt");

-- CreateIndex
CREATE INDEX "StudentAchievement_category_idx" ON "StudentAchievement"("category");

-- CreateIndex
CREATE INDEX "StudentTask_universityId_studentId_status_idx" ON "StudentTask"("universityId", "studentId", "status");

-- CreateIndex
CREATE INDEX "StudentTask_dueDate_idx" ON "StudentTask"("dueDate");

-- CreateIndex
CREATE INDEX "SimulationScenario_universityId_studentId_scenarioType_idx" ON "SimulationScenario"("universityId", "studentId", "scenarioType");

-- CreateIndex
CREATE INDEX "SimulationScenario_startedAt_idx" ON "SimulationScenario"("startedAt");

-- CreateIndex
CREATE INDEX "CapstoneProject_universityId_studentId_idx" ON "CapstoneProject"("universityId", "studentId");

-- CreateIndex
CREATE INDEX "CapstoneProject_status_idx" ON "CapstoneProject"("status");

-- CreateIndex
CREATE INDEX "CapstoneProject_targetCompletionDate_idx" ON "CapstoneProject"("targetCompletionDate");

-- CreateIndex
CREATE INDEX "SuccessCoachSession_universityId_studentId_createdAt_idx" ON "SuccessCoachSession"("universityId", "studentId", "createdAt");

-- CreateIndex
CREATE INDEX "SuccessCoachSession_createdAt_idx" ON "SuccessCoachSession"("createdAt");

-- CreateIndex
CREATE INDEX "JobApplication_studentId_status_idx" ON "JobApplication"("studentId", "status");

-- CreateIndex
CREATE INDEX "JobApplication_jobId_idx" ON "JobApplication"("jobId");

-- CreateIndex
CREATE INDEX "JobApplication_appliedAt_idx" ON "JobApplication"("appliedAt");

-- CreateIndex
CREATE INDEX "JobApplication_universityId_idx" ON "JobApplication"("universityId");

-- CreateIndex
CREATE INDEX "JobOffer_studentId_idx" ON "JobOffer"("studentId");

-- CreateIndex
CREATE INDEX "JobOffer_jobId_idx" ON "JobOffer"("jobId");

-- CreateIndex
CREATE INDEX "JobOffer_status_idx" ON "JobOffer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_studentId_key" ON "Placement"("studentId");

-- CreateIndex
CREATE INDEX "Placement_studentId_idx" ON "Placement"("studentId");

-- CreateIndex
CREATE INDEX "Placement_universityId_idx" ON "Placement"("universityId");

-- CreateIndex
CREATE INDEX "Placement_placementDate_idx" ON "Placement"("placementDate");

-- CreateIndex
CREATE INDEX "ProfessionalNetwork_studentId_connectionType_idx" ON "ProfessionalNetwork"("studentId", "connectionType");

-- CreateIndex
CREATE INDEX "ProfessionalNetwork_universityId_idx" ON "ProfessionalNetwork"("universityId");

-- CreateIndex
CREATE INDEX "NetworkingEvent_studentId_date_idx" ON "NetworkingEvent"("studentId", "date");

-- CreateIndex
CREATE INDEX "NetworkingEvent_universityId_idx" ON "NetworkingEvent"("universityId");

-- CreateIndex
CREATE INDEX "FundingApplication_studentId_status_idx" ON "FundingApplication"("studentId", "status");

-- CreateIndex
CREATE INDEX "FundingApplication_fundingId_idx" ON "FundingApplication"("fundingId");

-- CreateIndex
CREATE INDEX "FundingApplication_universityId_idx" ON "FundingApplication"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerDevelopmentPlan_studentId_key" ON "CareerDevelopmentPlan"("studentId");

-- CreateIndex
CREATE INDEX "CareerDevelopmentPlan_studentId_idx" ON "CareerDevelopmentPlan"("studentId");

-- CreateIndex
CREATE INDEX "CareerDevelopmentPlan_universityId_idx" ON "CareerDevelopmentPlan"("universityId");

-- CreateIndex
CREATE INDEX "CareerResourceAccess_studentId_resourceType_idx" ON "CareerResourceAccess"("studentId", "resourceType");

-- CreateIndex
CREATE INDEX "CareerResourceAccess_universityId_idx" ON "CareerResourceAccess"("universityId");

-- CreateIndex
CREATE INDEX "CareerAIInsight_studentId_insightType_idx" ON "CareerAIInsight"("studentId", "insightType");

-- CreateIndex
CREATE INDEX "CareerAIInsight_universityId_idx" ON "CareerAIInsight"("universityId");

-- CreateIndex
CREATE INDEX "CareerMockInterview_studentId_interviewType_idx" ON "CareerMockInterview"("studentId", "interviewType");

-- CreateIndex
CREATE INDEX "CareerMockInterview_universityId_idx" ON "CareerMockInterview"("universityId");

-- CreateIndex
CREATE INDEX "JobAlertSubscription_studentId_active_idx" ON "JobAlertSubscription"("studentId", "active");

-- CreateIndex
CREATE INDEX "JobAlertSubscription_universityId_idx" ON "JobAlertSubscription"("universityId");

-- CreateIndex
CREATE INDEX "SharedSearch_userId_idx" ON "SharedSearch"("userId");

-- CreateIndex
CREATE INDEX "SharedSearch_createdAt_idx" ON "SharedSearch"("createdAt");

-- CreateIndex
CREATE INDEX "K2ThinkMemory_userId_key_idx" ON "K2ThinkMemory"("userId", "key");

-- CreateIndex
CREATE INDEX "K2ThinkMemory_userId_updatedAt_idx" ON "K2ThinkMemory"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "K2ThinkAudit_userId_timestamp_idx" ON "K2ThinkAudit"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "K2ThinkAudit_providerUsed_timestamp_idx" ON "K2ThinkAudit"("providerUsed", "timestamp");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "CLOMastery_studentId_idx" ON "CLOMastery"("studentId");

-- CreateIndex
CREATE INDEX "CLOMastery_courseId_idx" ON "CLOMastery"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CLOMastery_studentId_courseId_cloId_key" ON "CLOMastery"("studentId", "courseId", "cloId");

-- CreateIndex
CREATE INDEX "GeneratedQuestion_assessmentId_idx" ON "GeneratedQuestion"("assessmentId");

-- CreateIndex
CREATE INDEX "GeneratedQuestion_courseId_idx" ON "GeneratedQuestion"("courseId");

-- CreateIndex
CREATE INDEX "GeneratedQuestion_status_idx" ON "GeneratedQuestion"("status");

-- CreateIndex
CREATE INDEX "CourseContent_courseId_idx" ON "CourseContent"("courseId");

-- CreateIndex
CREATE INDEX "CourseLearningOutcome_courseId_idx" ON "CourseLearningOutcome"("courseId");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPrompt" ADD CONSTRAINT "AiPrompt_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_educationLevelCode_fkey" FOREIGN KEY ("educationLevelCode") REFERENCES "ScedField"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_scedSpecializationCode_fkey" FOREIGN KEY ("scedSpecializationCode") REFERENCES "ScedField"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveParticipation" ADD CONSTRAINT "ActiveParticipation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAdjustment" ADD CONSTRAINT "GradeAdjustment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeanNotification" ADD CONSTRAINT "DeanNotification_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMapping" ADD CONSTRAINT "CareerMapping_sscoCode_fkey" FOREIGN KEY ("sscoCode") REFERENCES "SsccoOccupation"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMapping" ADD CONSTRAINT "CareerMapping_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAgent" ADD CONSTRAINT "StudentAgent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeTeam" ADD CONSTRAINT "ChallengeTeam_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeTeamMember" ADD CONSTRAINT "ChallengeTeamMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeTeamMember" ADD CONSTRAINT "ChallengeTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ChallengeTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSnapshot" ADD CONSTRAINT "AssessmentSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployabilityProfile" ADD CONSTRAINT "EmployabilityProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquityLedger" ADD CONSTRAINT "EquityLedger_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquityEvent" ADD CONSTRAINT "EquityEvent_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "EquityLedger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPath" ADD CONSTRAINT "CareerPath_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerStage" ADD CONSTRAINT "CareerStage_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "CareerPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioReview" ADD CONSTRAINT "PortfolioReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_sscoCode_fkey" FOREIGN KEY ("sscoCode") REFERENCES "SsccoOccupation"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingSave" ADD CONSTRAINT "FundingSave_programId_fkey" FOREIGN KEY ("programId") REFERENCES "FundingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingSave" ADD CONSTRAINT "FundingSave_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBadge" ADD CONSTRAINT "StudentBadge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "R2CArtifact" ADD CONSTRAINT "R2CArtifact_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOnboarding" ADD CONSTRAINT "StudentOnboarding_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTask" ADD CONSTRAINT "OnboardingTask_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "StudentOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPool" ADD CONSTRAINT "TalentPool_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPoolMember" ADD CONSTRAINT "TalentPoolMember_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "TalentPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPoolMember" ADD CONSTRAINT "TalentPoolMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterActivity" ADD CONSTRAINT "RecruiterActivity_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterActivity" ADD CONSTRAINT "RecruiterActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationChecklist" ADD CONSTRAINT "GraduationChecklist_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillExploration" ADD CONSTRAINT "SkillExploration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerCard" ADD CONSTRAINT "CareerCard_sscoCode_fkey" FOREIGN KEY ("sscoCode") REFERENCES "SsccoOccupation"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerInterest" ADD CONSTRAINT "CareerInterest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgress" ADD CONSTRAINT "SkillProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPrep" ADD CONSTRAINT "InterviewPrep_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_sscoCode_fkey" FOREIGN KEY ("sscoCode") REFERENCES "SsccoOccupation"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipSession" ADD CONSTRAINT "MentorshipSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipSession" ADD CONSTRAINT "MentorshipSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonRegistration" ADD CONSTRAINT "HackathonRegistration_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonRegistration" ADD CONSTRAINT "HackathonRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonTeam" ADD CONSTRAINT "HackathonTeam_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonTeamMember" ADD CONSTRAINT "HackathonTeamMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonTeamMember" ADD CONSTRAINT "HackathonTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HackathonTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseConcept" ADD CONSTRAINT "CourseConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseConcept" ADD CONSTRAINT "CourseConcept_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationConcept" ADD CONSTRAINT "CertificationConcept_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationConcept" ADD CONSTRAINT "CertificationConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCredential" ADD CONSTRAINT "IssuedCredential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAgentMessage" ADD CONSTRAINT "StudentAgentMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "StudentAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioEntry" ADD CONSTRAINT "PortfolioEntry_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAchievement" ADD CONSTRAINT "PortfolioAchievement_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSkill" ADD CONSTRAINT "PortfolioSkill_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "PortfolioSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioCareerProfile" ADD CONSTRAINT "PortfolioCareerProfile_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioShareLink" ADD CONSTRAINT "PortfolioShareLink_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioView" ADD CONSTRAINT "PortfolioView_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseTopic" ADD CONSTRAINT "KnowledgeBaseTopic_parentTopicId_fkey" FOREIGN KEY ("parentTopicId") REFERENCES "KnowledgeBaseTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseTopic" ADD CONSTRAINT "KnowledgeBaseTopic_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticle" ADD CONSTRAINT "KnowledgeBaseArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticle" ADD CONSTRAINT "KnowledgeBaseArticle_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "KnowledgeBaseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseView" ADD CONSTRAINT "KnowledgeBaseView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeBaseArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseFeedback" ADD CONSTRAINT "KnowledgeBaseFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeBaseArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_rubricCriterionId_fkey" FOREIGN KEY ("rubricCriterionId") REFERENCES "RubricCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionResponse" ADD CONSTRAINT "AssessmentQuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionResponse" ADD CONSTRAINT "AssessmentQuestionResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RubricCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationScoreAdjustment" ADD CONSTRAINT "CalibrationScoreAdjustment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CalibrationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationScoreAdjustment" ADD CONSTRAINT "CalibrationScoreAdjustment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetAccess" ADD CONSTRAINT "DatasetAccess_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ResearchRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepExecution" ADD CONSTRAINT "WorkflowStepExecution_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSchedule" ADD CONSTRAINT "WorkflowSchedule_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicRoleAssignment" ADD CONSTRAINT "DynamicRoleAssignment_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicRoleAssignment" ADD CONSTRAINT "DynamicRoleAssignment_elevatedRoleId_fkey" FOREIGN KEY ("elevatedRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicRoleAssignment" ADD CONSTRAINT "DynamicRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbacPolicy" ADD CONSTRAINT "AbacPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperation" ADD CONSTRAINT "BulkOperation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperation" ADD CONSTRAINT "BulkOperation_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSubmission" ADD CONSTRAINT "CandidateSubmission_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateLicense" ADD CONSTRAINT "TemplateLicense_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateRating" ADD CONSTRAINT "TemplateRating_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateDeployment" ADD CONSTRAINT "TemplateDeployment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicensePurchase" ADD CONSTRAINT "LicensePurchase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecution" ADD CONSTRAINT "ReportExecution_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAlert" ADD CONSTRAINT "ReportAlert_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Government" ADD CONSTRAINT "Government_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_governmentId_fkey" FOREIGN KEY ("governmentId") REFERENCES "Government"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaBackupCode" ADD CONSTRAINT "MfaBackupCode_mfaSettingsId_fkey" FOREIGN KEY ("mfaSettingsId") REFERENCES "MfaSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_mfaSettingsId_fkey" FOREIGN KEY ("mfaSettingsId") REFERENCES "MfaSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReviewItem" ADD CONSTRAINT "AccessReviewItem_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AccessReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgFaculty" ADD CONSTRAINT "OrgFaculty_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgFaculty" ADD CONSTRAINT "OrgFaculty_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "OrgFaculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgram" ADD CONSTRAINT "AcademicProgram_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgram" ADD CONSTRAINT "AcademicProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgTeam" ADD CONSTRAINT "OrgTeam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgTeam" ADD CONSTRAINT "OrgTeam_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademicProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationHierarchy" ADD CONSTRAINT "OrganizationHierarchy_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationHierarchy" ADD CONSTRAINT "OrganizationHierarchy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_delegateeId_fkey" FOREIGN KEY ("delegateeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationLog" ADD CONSTRAINT "ImpersonationLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationLog" ADD CONSTRAINT "ImpersonationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ApprovalFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ApprovalFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ApprovalStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyDefinition" ADD CONSTRAINT "CompetencyDefinition_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "CompetencyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyDefinition" ADD CONSTRAINT "CompetencyDefinition_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CompetencyDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCompetencyGraph" ADD CONSTRAINT "StudentCompetencyGraph_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "CompetencyDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanGoal" ADD CONSTRAINT "PlanGoal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DevelopmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "HabitTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiRevision" ADD CONSTRAINT "WikiRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteShare" ADD CONSTRAINT "NoteShare_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ResearchPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIngestionJob" ADD CONSTRAINT "KnowledgeIngestionJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAutomationLog" ADD CONSTRAINT "KnowledgeAutomationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "KnowledgeAutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequestLog" ADD CONSTRAINT "AiRequestLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiModelVersion" ADD CONSTRAINT "AiModelVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiModelMetric" ADD CONSTRAINT "AiModelMetric_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentSession" ADD CONSTRAINT "AiAgentSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentMessage" ADD CONSTRAINT "AiAgentMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiAgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPlanStep" ADD CONSTRAINT "AiPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AiPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReflection" ADD CONSTRAINT "AiReflection_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AiPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiToolExecution" ADD CONSTRAINT "AiToolExecution_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AiTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AcademicModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningObjective" ADD CONSTRAINT "LearningObjective_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningJourney" ADD CONSTRAINT "LearningJourney_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestone" ADD CONSTRAINT "LearningMilestone_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "LearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLearningGoal" ADD CONSTRAINT "DailyLearningGoal_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "LearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyLearningGoal" ADD CONSTRAINT "WeeklyLearningGoal_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "LearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyLearningGoal" ADD CONSTRAINT "MonthlyLearningGoal_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "LearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardDeck" ADD CONSTRAINT "FlashcardDeck_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "FlashcardDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyReminder" ADD CONSTRAINT "StudyReminder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMemory" ADD CONSTRAINT "LearningMemory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGap" ADD CONSTRAINT "KnowledgeGap_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacedRepetitionItem" ADD CONSTRAINT "SpacedRepetitionItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryPrediction" ADD CONSTRAINT "MasteryPrediction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStreak" ADD CONSTRAINT "LearningStreak_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperiencePoints" ADD CONSTRAINT "ExperiencePoints_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalCredential" ADD CONSTRAINT "DigitalCredential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicTranscript" ADD CONSTRAINT "AcademicTranscript_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExplainRequest" ADD CONSTRAINT "AIExplainRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedQuiz" ADD CONSTRAINT "AIGeneratedQuiz_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIStudyRecommendation" ADD CONSTRAINT "AIStudyRecommendation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AILearningInsight" ADD CONSTRAINT "AILearningInsight_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchTask" ADD CONSTRAINT "ResearchTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNotebook" ADD CONSTRAINT "ResearchNotebook_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchGoal" ADD CONSTRAINT "ResearchGoal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchHypothesis" ADD CONSTRAINT "ResearchHypothesis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentDesignResearch" ADD CONSTRAINT "ExperimentDesignResearch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentVariable" ADD CONSTRAINT "ExperimentVariable_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "ExperimentVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentVersion" ADD CONSTRAINT "ExperimentVersion_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionTracker" ADD CONSTRAINT "SubmissionTracker_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalRecommendation" ADD CONSTRAINT "JournalRecommendation_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceListItem" ADD CONSTRAINT "ReferenceListItem_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnovationPipeline" ADD CONSTRAINT "InnovationPipeline_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "IdeaSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyTransfer" ADD CONSTRAINT "TechnologyTransfer_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "Patent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApplication" ADD CONSTRAINT "GrantApplication_grantOpportunityId_fkey" FOREIGN KEY ("grantOpportunityId") REFERENCES "GrantOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApplication" ADD CONSTRAINT "GrantApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerProfile" ADD CONSTRAINT "CareerProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerGoal" ADD CONSTRAINT "CareerGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniConnection" ADD CONSTRAINT "AlumniConnection_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniConnection" ADD CONSTRAINT "AlumniConnection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerIntelligenceSnapshot" ADD CONSTRAINT "CareerIntelligenceSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTracking" ADD CONSTRAINT "GoalTracking_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "FacultyMentee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiEndpoint" ADD CONSTRAINT "ApiEndpoint_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ApiVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationInstance" ADD CONSTRAINT "IntegrationInstance_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "IntegrationConnector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncJob" ADD CONSTRAINT "IntegrationSyncJob_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "IntegrationInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginVersion" ADD CONSTRAINT "PluginVersion_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginInstallation" ADD CONSTRAINT "PluginInstallation_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginReview" ADD CONSTRAINT "PluginReview_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginLog" ADD CONSTRAINT "PluginLog_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceItemVersion" ADD CONSTRAINT "MarketplaceItemVersion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceItemReview" ADD CONSTRAINT "MarketplaceItemReview_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceItemInstallation" ADD CONSTRAINT "MarketplaceItemInstallation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaEnrollment" ADD CONSTRAINT "BetaEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "BetaProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAcademicCalendar" ADD CONSTRAINT "OrgAcademicCalendar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgSemester" ADD CONSTRAINT "OrgSemester_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "OrgAcademicCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvent" ADD CONSTRAINT "StudentEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tutoring_sessions" ADD CONSTRAINT "ai_tutoring_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tutoring_sessions" ADD CONSTRAINT "ai_tutoring_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_content_generations" ADD CONSTRAINT "ai_content_generations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_learning_profiles" ADD CONSTRAINT "student_learning_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_intervention_campaigns" ADD CONSTRAINT "ai_intervention_campaigns_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_difficulty_levels" ADD CONSTRAINT "adaptive_difficulty_levels_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_difficulty_levels" ADD CONSTRAINT "adaptive_difficulty_levels_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_ai_reviews" ADD CONSTRAINT "resume_ai_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessMetrics" ADD CONSTRAINT "SuccessMetrics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGoal" ADD CONSTRAINT "StudentGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductivitySession" ADD CONSTRAINT "ProductivitySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskIndicator" ADD CONSTRAINT "RiskIndicator_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessAssessment" ADD CONSTRAINT "ReadinessAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTask" ADD CONSTRAINT "StudentTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapstoneProject" ADD CONSTRAINT "CapstoneProject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessCoachSession" ADD CONSTRAINT "SuccessCoachSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalNetwork" ADD CONSTRAINT "ProfessionalNetwork_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkingEvent" ADD CONSTRAINT "NetworkingEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingApplication" ADD CONSTRAINT "FundingApplication_fundingId_fkey" FOREIGN KEY ("fundingId") REFERENCES "FundingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingApplication" ADD CONSTRAINT "FundingApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerDevelopmentPlan" ADD CONSTRAINT "CareerDevelopmentPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerResourceAccess" ADD CONSTRAINT "CareerResourceAccess_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerAIInsight" ADD CONSTRAINT "CareerAIInsight_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMockInterview" ADD CONSTRAINT "CareerMockInterview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAlertSubscription" ADD CONSTRAINT "JobAlertSubscription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSearch" ADD CONSTRAINT "SharedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "K2ThinkMemory" ADD CONSTRAINT "K2ThinkMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "K2ThinkAudit" ADD CONSTRAINT "K2ThinkAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

