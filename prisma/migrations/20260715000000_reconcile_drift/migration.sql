-- AlterTable
ALTER TABLE "AssessmentModule" ADD COLUMN "authorId" TEXT;
ALTER TABLE "AssessmentModule" ADD COLUMN "signOffState" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "AssessmentModule" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX IF EXISTS "AssessmentModule_code_specialization_key";

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentModule_code_specialization_version_key" ON "AssessmentModule"("code", "specialization", "version");
