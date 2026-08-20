-- AlterTable
ALTER TABLE "LectureProject" ADD COLUMN     "blueprintJson" JSONB,
ADD COLUMN     "cloMapJson" JSONB,
ADD COLUMN     "conceptGraphJson" JSONB,
ADD COLUMN     "finalReviewJson" JSONB,
ADD COLUMN     "generationStateJson" JSONB,
ADD COLUMN     "slideArchitectureJson" JSONB;

-- AlterTable
ALTER TABLE "LectureSlideArtifact" ADD COLUMN     "evidenceJson" JSONB,
ADD COLUMN     "learningUnitId" TEXT,
ADD COLUMN     "qualityScoreJson" JSONB,
ADD COLUMN     "repairHistoryJson" JSONB,
ADD COLUMN     "reviewNotesJson" JSONB;

-- AlterTable
ALTER TABLE "LectureSlidePlan" ADD COLUMN     "learningUnitId" TEXT;

-- CreateTable
CREATE TABLE "LectureLearningUnit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "why" TEXT,
    "prerequisites" TEXT[],
    "mentalModel" TEXT,
    "mechanism" TEXT,
    "relationship" TEXT,
    "example" TEXT,
    "counterexample" TEXT,
    "misconception" TEXT,
    "tradeOff" TEXT,
    "guidedPractice" TEXT,
    "independentPractice" TEXT,
    "application" TEXT,
    "transfer" TEXT,
    "explanation" TEXT,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureLearningUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureStudentProgress" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "versionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "completedSlides" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "reflections" JSONB,
    "answers" JSONB,
    "lastSlideNo" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureStudentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLectureSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentSlideNo" INTEGER NOT NULL DEFAULT 0,
    "completedStages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLectureSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptMastery" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "masteryState" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "evidence" JSONB,

    CONSTRAINT "ConceptMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentInteraction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slideNo" INTEGER NOT NULL,
    "interactionType" TEXT NOT NULL,
    "studentResponse" TEXT NOT NULL,
    "confidence" TEXT,
    "isCorrect" BOOLEAN,
    "feedbackReceived" TEXT,
    "hintLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureLearningUnit_projectId_idx" ON "LectureLearningUnit"("projectId");

-- CreateIndex
CREATE INDEX "LectureLearningUnit_organizationId_idx" ON "LectureLearningUnit"("organizationId");

-- CreateIndex
CREATE INDEX "LectureStudentProgress_versionId_idx" ON "LectureStudentProgress"("versionId");

-- CreateIndex
CREATE INDEX "LectureStudentProgress_studentId_idx" ON "LectureStudentProgress"("studentId");

-- CreateIndex
CREATE INDEX "LectureStudentProgress_organizationId_idx" ON "LectureStudentProgress"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LectureStudentProgress_versionId_studentId_key" ON "LectureStudentProgress"("versionId", "studentId");

-- AddForeignKey
ALTER TABLE "LectureSlidePlan" ADD CONSTRAINT "LectureSlidePlan_learningUnitId_fkey" FOREIGN KEY ("learningUnitId") REFERENCES "LectureLearningUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlideArtifact" ADD CONSTRAINT "LectureSlideArtifact_learningUnitId_fkey" FOREIGN KEY ("learningUnitId") REFERENCES "LectureLearningUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureLearningUnit" ADD CONSTRAINT "LectureLearningUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureLearningUnit" ADD CONSTRAINT "LectureLearningUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudentLectureSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInteraction" ADD CONSTRAINT "StudentInteraction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudentLectureSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
