-- AlterTable
ALTER TABLE "LectureAlignmentLink" ADD COLUMN     "sourceSnapshotId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'current';
