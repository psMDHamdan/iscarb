-- Remove fabricated "official" data seeded manually outside migrations.
-- ===========================================================================
-- The NCAAA + Jaheziah product surfaces must only ever show data derived from
-- REAL, approved AuthoritativeSourceSnapshots (BRD NFR-11/12, AC-17). The rows
-- removed here were placeholders that *looked* official:
--
--   1. A fake ncaaa snapshot (83-char placeholder text, url "https://ncaaa.gs.sa",
--      status pending) + 5 NCAAARequirement rows linked to it.
--   2. 20 NationalStandard rows pointing at fabricated snapshot/document ids
--      (e.g. "SNAP-CS-2025", "JAH-CS-2025-V1") that exist nowhere.
--
-- Nothing is deleted that could be re-derived from a real synced+approved
-- snapshot; the sync → approve → parse pipeline recreates rows from real
-- content. Evidence links are deleted first (FK RESTRICT on requirementId).

-- 1. Evidence links tied to the fabricated requirements (per-project rows).
DELETE FROM "LectureNCAAAEvidenceLink"
WHERE "requirementId" IN (
  SELECT r.id FROM "NCAAARequirement" r
  JOIN "AuthoritativeSourceSnapshot" s ON s.id = r."sourceSnapshotId"
  WHERE s."sourceKey" = 'ncaaa'
    AND s."approvalStatus" <> 'approved'
);

-- 2. Fabricated NCAAA requirements (their snapshot was never a real approved doc).
DELETE FROM "NCAAARequirement"
WHERE "sourceSnapshotId" IN (
  SELECT id FROM "AuthoritativeSourceSnapshot"
  WHERE "sourceKey" = 'ncaaa' AND "approvalStatus" <> 'approved'
);

-- 3. The placeholder ncaaa snapshot itself.
DELETE FROM "AuthoritativeSourceSnapshot"
WHERE "sourceKey" = 'ncaaa' AND "approvalStatus" <> 'approved';

-- 4. Fabricated Jaheziah standards — any row whose snapshot/document ids do not
--    reference a real snapshot row in this database (free-form string columns,
--    so the fabricated "SNAP-*-2025" / "JAH-*-2025-V1" ids are detectable).
DELETE FROM "NationalStandard"
WHERE "snapshotId" NOT IN (SELECT id FROM "AuthoritativeSourceSnapshot");

-- 5. Align the configured source URLs with the real official hosts (NFR-11).
--    ncaaa → National Center for Academic Accreditation & Evaluation.
--    jaheziah → Education & Training Evaluation Commission (ETEC) professional
--    standards portal. Syncing fetches these; approval gates usage (AC-17).
UPDATE "AuthoritativeSource" SET "originalUrl" = 'https://ncaaa.gov.sa/' WHERE "sourceKey" = 'ncaaa';
UPDATE "AuthoritativeSource" SET "originalUrl" = 'https://etec.gov.sa/' WHERE "sourceKey" = 'jaheziah';
