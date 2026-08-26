/*
  Warnings:

  - You are about to drop the column `embedding` on the `LectureSourceBlock` table. All the data in the column will be lost.
  - You are about to drop the column `embeddingModel` on the `LectureSourceBlock` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "LectureSourceBlock_embedding_idx";

-- AlterTable
ALTER TABLE "LectureSourceBlock" DROP COLUMN "embedding",
DROP COLUMN "embeddingModel";

-- AlterTable
ALTER TABLE "UserRole" ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LectureStudentMastery" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "masteredAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureStudentMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningExperience" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "topicDescription" TEXT,
    "targetAudience" TEXT,
    "languagePolicy" TEXT NOT NULL DEFAULT 'en',
    "bloomLevel" TEXT NOT NULL DEFAULT 'apply',
    "estimatedDurationMin" INTEGER NOT NULL DEFAULT 50,
    "pedagogicalFramework" TEXT NOT NULL DEFAULT 'iSCARB_7_STAGE',
    "contentHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningBlueprint" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "narrativeArc" TEXT NOT NULL,
    "learningOutcomes" JSONB NOT NULL,
    "stagePlanJson" JSONB NOT NULL,
    "prerequisiteGraph" JSONB,
    "pacingStrategy" JSONB,
    "structuralReviewScore" DOUBLE PRECISION,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptBlock" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "stageCategory" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "cloIds" TEXT[],
    "sourceBlockIds" TEXT[],
    "academicTruth" TEXT NOT NULL,
    "intuitionMentalModel" TEXT NOT NULL,
    "mechanismExplanation" TEXT NOT NULL,
    "realWorldTransfer" TEXT NOT NULL,
    "misconceptionAlert" TEXT NOT NULL,
    "coreIdea" TEXT NOT NULL,
    "keyTakeaways" TEXT[],
    "keywords" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningActivity" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "conceptBlockId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptAr" TEXT,
    "actionVerb" TEXT NOT NULL,
    "scaffoldingLevel" TEXT NOT NULL DEFAULT 'guided',
    "initialContext" JSONB,
    "expectedResponseCriteria" JSONB,
    "modelAnswer" TEXT,
    "progressiveHints" TEXT[],
    "misconceptionTriggers" JSONB,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "conceptBlockId" TEXT,
    "assessmentType" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "stem" TEXT NOT NULL,
    "stemAr" TEXT,
    "options" JSONB NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "instructorRationale" TEXT NOT NULL,
    "distractorExplanations" JSONB,
    "cloId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "isFinalGate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualArtifact" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "conceptBlockId" TEXT,
    "visualType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "learningMessage" TEXT NOT NULL,
    "specificationJson" JSONB NOT NULL,
    "assetSourceTier" TEXT NOT NULL,
    "primaryAssetUrl" TEXT,
    "vectorSvgCode" TEXT,
    "thumbnailUrl" TEXT,
    "licenseType" TEXT,
    "attributionText" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisualArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceReference" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "conceptBlockId" TEXT NOT NULL,
    "sourceBlockId" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "sourceLocator" TEXT NOT NULL,
    "verbatimExcerpt" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceGuide" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "facultyGuideJson" JSONB NOT NULL,
    "studentCompanionJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceGateResult" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "passNumber" INTEGER NOT NULL,
    "gateName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "findingsJson" JSONB NOT NULL,
    "waivedBy" TEXT,
    "waiveReason" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceGateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceExport" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExperienceSession" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentBlockIndex" INTEGER NOT NULL DEFAULT 1,
    "currentStage" TEXT NOT NULL DEFAULT 'discover',
    "completedStageKeys" TEXT[],
    "xpScore" INTEGER NOT NULL DEFAULT 0,
    "masteryPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentExperienceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentBlockInteraction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conceptBlockId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "studentInput" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN,
    "confidenceLevel" TEXT,
    "aiCoachFeedback" TEXT,
    "hintsRequested" INTEGER NOT NULL DEFAULT 0,
    "evaluatedMasteryScore" DOUBLE PRECISION,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentBlockInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureStudentMastery_projectId_idx" ON "LectureStudentMastery"("projectId");

-- CreateIndex
CREATE INDEX "LectureStudentMastery_studentId_idx" ON "LectureStudentMastery"("studentId");

-- CreateIndex
CREATE INDEX "LectureStudentMastery_conceptId_idx" ON "LectureStudentMastery"("conceptId");

-- CreateIndex
CREATE INDEX "LectureStudentMastery_mastered_idx" ON "LectureStudentMastery"("mastered");

-- CreateIndex
CREATE UNIQUE INDEX "LectureStudentMastery_projectId_studentId_conceptId_key" ON "LectureStudentMastery"("projectId", "studentId", "conceptId");

-- CreateIndex
CREATE INDEX "LearningExperience_projectId_status_idx" ON "LearningExperience"("projectId", "status");

-- CreateIndex
CREATE INDEX "LearningExperience_tenantId_idx" ON "LearningExperience"("tenantId");

-- CreateIndex
CREATE INDEX "LearningExperience_organizationId_idx" ON "LearningExperience"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningExperience_projectId_version_key" ON "LearningExperience"("projectId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LearningBlueprint_experienceId_key" ON "LearningBlueprint"("experienceId");

-- CreateIndex
CREATE INDEX "LearningBlueprint_experienceId_idx" ON "LearningBlueprint"("experienceId");

-- CreateIndex
CREATE INDEX "ConceptBlock_experienceId_stageCategory_idx" ON "ConceptBlock"("experienceId", "stageCategory");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptBlock_experienceId_orderIndex_key" ON "ConceptBlock"("experienceId", "orderIndex");

-- CreateIndex
CREATE INDEX "LearningActivity_experienceId_idx" ON "LearningActivity"("experienceId");

-- CreateIndex
CREATE INDEX "LearningActivity_conceptBlockId_activityType_idx" ON "LearningActivity"("conceptBlockId", "activityType");

-- CreateIndex
CREATE INDEX "AssessmentItem_experienceId_isFinalGate_idx" ON "AssessmentItem"("experienceId", "isFinalGate");

-- CreateIndex
CREATE INDEX "AssessmentItem_conceptBlockId_idx" ON "AssessmentItem"("conceptBlockId");

-- CreateIndex
CREATE INDEX "VisualArtifact_experienceId_idx" ON "VisualArtifact"("experienceId");

-- CreateIndex
CREATE INDEX "VisualArtifact_conceptBlockId_idx" ON "VisualArtifact"("conceptBlockId");

-- CreateIndex
CREATE INDEX "EvidenceReference_experienceId_idx" ON "EvidenceReference"("experienceId");

-- CreateIndex
CREATE INDEX "EvidenceReference_conceptBlockId_idx" ON "EvidenceReference"("conceptBlockId");

-- CreateIndex
CREATE INDEX "EvidenceReference_sourceBlockId_idx" ON "EvidenceReference"("sourceBlockId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceGuide_experienceId_key" ON "ExperienceGuide"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceGuide_experienceId_idx" ON "ExperienceGuide"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceGateResult_experienceId_passNumber_idx" ON "ExperienceGateResult"("experienceId", "passNumber");

-- CreateIndex
CREATE INDEX "ExperienceExport_experienceId_exportFormat_idx" ON "ExperienceExport"("experienceId", "exportFormat");

-- CreateIndex
CREATE INDEX "StudentExperienceSession_studentId_idx" ON "StudentExperienceSession"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExperienceSession_experienceId_studentId_key" ON "StudentExperienceSession"("experienceId", "studentId");

-- CreateIndex
CREATE INDEX "StudentBlockInteraction_sessionId_conceptBlockId_idx" ON "StudentBlockInteraction"("sessionId", "conceptBlockId");

-- CreateIndex
CREATE INDEX "LectureProfileVersion_tenantId_profileType_status_idx" ON "LectureProfileVersion"("tenantId", "profileType", "status");

-- AddForeignKey
ALTER TABLE "LearningExperience" ADD CONSTRAINT "LearningExperience_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningExperience" ADD CONSTRAINT "LearningExperience_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningBlueprint" ADD CONSTRAINT "LearningBlueprint_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptBlock" ADD CONSTRAINT "ConceptBlock_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_conceptBlockId_fkey" FOREIGN KEY ("conceptBlockId") REFERENCES "ConceptBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_conceptBlockId_fkey" FOREIGN KEY ("conceptBlockId") REFERENCES "ConceptBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualArtifact" ADD CONSTRAINT "VisualArtifact_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualArtifact" ADD CONSTRAINT "VisualArtifact_conceptBlockId_fkey" FOREIGN KEY ("conceptBlockId") REFERENCES "ConceptBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceReference" ADD CONSTRAINT "EvidenceReference_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceReference" ADD CONSTRAINT "EvidenceReference_conceptBlockId_fkey" FOREIGN KEY ("conceptBlockId") REFERENCES "ConceptBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceReference" ADD CONSTRAINT "EvidenceReference_sourceBlockId_fkey" FOREIGN KEY ("sourceBlockId") REFERENCES "LectureSourceBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceGuide" ADD CONSTRAINT "ExperienceGuide_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceGateResult" ADD CONSTRAINT "ExperienceGateResult_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceExport" ADD CONSTRAINT "ExperienceExport_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExperienceSession" ADD CONSTRAINT "StudentExperienceSession_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExperienceSession" ADD CONSTRAINT "StudentExperienceSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBlockInteraction" ADD CONSTRAINT "StudentBlockInteraction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudentExperienceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBlockInteraction" ADD CONSTRAINT "StudentBlockInteraction_conceptBlockId_fkey" FOREIGN KEY ("conceptBlockId") REFERENCES "ConceptBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
