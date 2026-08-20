-- CreateEnum
CREATE TYPE "BankQuestionStatus" AS ENUM ('draft', 'in_review', 'approved', 'published', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "BankQuestionProvenance" AS ENUM ('curated', 'pregenerated', 'ai_generated');

-- CreateTable
CREATE TABLE "EmployabilityBankQuestion" (
    "id" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "specialization" TEXT,
    "title" TEXT,
    "titleAr" TEXT,
    "level" TEXT,
    "framework" TEXT,
    "focus" TEXT,
    "estimateMinutes" INTEGER,
    "passThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "scenario" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "choicesJson" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "rubricJson" TEXT NOT NULL,
    "status" "BankQuestionStatus" NOT NULL DEFAULT 'draft',
    "provenance" "BankQuestionProvenance" NOT NULL,
    "contentHash" TEXT NOT NULL,
    "aiModelUsed" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "reviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployabilityBankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_moduleCode_status_idx" ON "EmployabilityBankQuestion"("moduleCode", "status");

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_specialization_status_idx" ON "EmployabilityBankQuestion"("specialization", "status");

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_status_idx" ON "EmployabilityBankQuestion"("status");

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_dimension_status_idx" ON "EmployabilityBankQuestion"("dimension", "status");

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_contentHash_idx" ON "EmployabilityBankQuestion"("contentHash");

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_provenance_status_idx" ON "EmployabilityBankQuestion"("provenance", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployabilityBankQuestion_moduleCode_specialization_version_key" ON "EmployabilityBankQuestion"("moduleCode", "specialization", "version");
