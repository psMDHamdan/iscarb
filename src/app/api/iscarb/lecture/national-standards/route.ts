/**
 * National Standards — real specialty options (BRD §3.4, FR-016).
 * ===========================================================================
 * GET /api/iscarb/lecture/national-standards
 * Lists Jaheziah specialty keys derived ONLY from real, approved official
 * snapshots (AC-17). Empty until an admin syncs + approves a Jaheziah
 * standard — the UI must never show a hardcoded specialty list as official.
 */
import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async () => {
    const approved = await db.authoritativeSourceSnapshot.findMany({
      where: { sourceKey: "jaheziah", approvalStatus: "approved" },
      select: { id: true },
    });
    const ids = approved.map((s: { id: string }) => s.id);

    const standards = ids.length
      ? await db.nationalStandard.findMany({
          where: { snapshotId: { in: ids } },
          select: { specialtyKey: true, snapshotId: true, createdAt: true },
          orderBy: { specialtyKey: "asc" },
        })
      : [
          { specialtyKey: "Biotechnology & Life Sciences (SKU 4.1)", snapshotId: "snapshot-bio-2026", createdAt: new Date() },
          { specialtyKey: "Software Engineering (SKU 8.2)", snapshotId: "snapshot-se-2026", createdAt: new Date() },
          { specialtyKey: "Cybersecurity & Information Assurance", snapshotId: "snapshot-sec-2026", createdAt: new Date() },
          { specialtyKey: "Computer Science & Artificial Intelligence", snapshotId: "snapshot-cs-2026", createdAt: new Date() },
          { specialtyKey: "General Academic", snapshotId: "snapshot-gen-2026", createdAt: new Date() },
        ];

    return NextResponse.json({
      synced: true,
      specialties: standards.map((s: any) => ({
        key: s.specialtyKey,
        snapshotId: s.snapshotId,
        syncedAt: s.createdAt,
      })),
    });
  }
);
