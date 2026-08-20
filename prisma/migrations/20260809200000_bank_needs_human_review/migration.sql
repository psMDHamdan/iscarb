-- AlterTable
ALTER TABLE "EmployabilityBankQuestion" ADD COLUMN "needsHumanReview" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "EmployabilityBankQuestion_needsHumanReview_status_idx" ON "EmployabilityBankQuestion"("needsHumanReview", "status");
