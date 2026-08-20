/*
  Warnings:

  - You are about to drop the `AiConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AiUsageLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOrganization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VectorEmbedding` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "idx_assessment_university_created";

-- DropIndex
DROP INDEX "idx_assessment_scores_university_competency";

-- DropIndex
DROP INDEX "idx_submission_assessment_student_created";

-- DropIndex
DROP INDEX "idx_auditlog_university_action";

-- DropIndex
DROP INDEX "idx_enrollment_university_course";

-- DropIndex
DROP INDEX "idx_jobposting_ssco_status";

-- DropIndex
DROP INDEX "idx_report_university_status";

-- DropIndex
DROP INDEX "idx_user_university_email";

-- AlterTable
ALTER TABLE "AssessmentResponse" ADD COLUMN     "costUsd" DOUBLE PRECISION,
ADD COLUMN     "processingStatus" TEXT,
ADD COLUMN     "tokensInput" INTEGER,
ADD COLUMN     "tokensOutput" INTEGER;

-- DropTable
DROP TABLE "AiConversation";

-- DropTable
DROP TABLE "AiUsageLog";

-- DropTable
DROP TABLE "UserOrganization";

-- DropTable
DROP TABLE "VectorEmbedding";
