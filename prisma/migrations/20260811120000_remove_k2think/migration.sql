-- Remove K2Think models (K2ThinkMemory, K2ThinkAudit) and their User relations.
-- These tables backed the removed K2Think services. Dropping them is safe:
-- nothing in the remaining codebase reads or writes them.

DROP TABLE IF EXISTS "K2ThinkAudit";
DROP TABLE IF EXISTS "K2ThinkMemory";

-- FacultyBriefing.generatedBy default switches from the removed K2Think to GPT-OSS.
ALTER TABLE "FacultyBriefing" ALTER COLUMN "generatedBy" SET DEFAULT 'gpt-oss';
