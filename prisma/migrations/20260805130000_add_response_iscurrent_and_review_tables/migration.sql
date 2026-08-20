-- AlterTable
ALTER TABLE "AssessmentResponse" ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "blueprintJson" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentValidationReview" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "originalScore" DOUBLE PRECISION NOT NULL,
    "originalBand" TEXT NOT NULL,
    "overriddenScore" DOUBLE PRECISION,
    "overriddenBand" TEXT,
    "facultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentValidationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCalibrationReview" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "aiScore" DOUBLE PRECISION NOT NULL,
    "facultyScore" DOUBLE PRECISION NOT NULL,
    "absoluteError" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentCalibrationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentAttempt_studentId_idx" ON "AssessmentAttempt"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentValidationReview_responseId_key" ON "AssessmentValidationReview"("responseId");

-- CreateIndex
CREATE INDEX "AssessmentValidationReview_status_idx" ON "AssessmentValidationReview"("status");

-- CreateIndex
CREATE INDEX "AssessmentCalibrationReview_facultyId_idx" ON "AssessmentCalibrationReview"("facultyId");

-- CreateIndex
CREATE INDEX "AssessmentCalibrationReview_responseId_idx" ON "AssessmentCalibrationReview"("responseId");

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentValidationReview" ADD CONSTRAINT "AssessmentValidationReview_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "AssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCalibrationReview" ADD CONSTRAINT "AssessmentCalibrationReview_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "AssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
