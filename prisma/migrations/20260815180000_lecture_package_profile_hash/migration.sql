-- FR-013: lock published packages to the active profile snapshot.
ALTER TABLE "LecturePackageVersion" ADD COLUMN "profileVersionHash" TEXT;
ALTER TABLE "LecturePackageVersion" ADD COLUMN "profileVersionsJson" JSONB;

CREATE INDEX "LecturePackageVersion_profileVersionHash_idx" ON "LecturePackageVersion"("profileVersionHash");
