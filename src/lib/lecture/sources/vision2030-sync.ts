/**
 * Official Sources Hub — Vision 2030 sync (TASK-06 §F).
 * ===========================================================================
 * Reads the latest approved vision2030 snapshot and parses English pages into
 * context items (title, officialUrl, description, relatedPrograms[],
 * retrievedAt). Derived opportunities are always labeled
 * derivedOpportunityLabel: "system-suggested" (AC-18).
 */
import { db } from "@/lib/db";
import type { VisionContextItem } from "./types";

const VISION_SOURCE_KEY = "vision2030";

export interface VisionSyncOutcome {
  sourceKey: string;
  items: VisionContextItem[];
  snapshotId: string;
  retrievedAt: string;
}

export async function syncVision2030(
  snapshotId: string | null = null
): Promise<VisionSyncOutcome> {
  const snapshot = await db.authoritativeSourceSnapshot.findFirst({
    where: {
      sourceKey: VISION_SOURCE_KEY,
      ...(snapshotId ? { id: snapshotId } : {}),
    },
    orderBy: { retrievedAt: "desc" },
  });
  if (!snapshot) {
    throw new Error("No vision2030 snapshot found — run source sync first");
  }

  const items = parseVisionItems(snapshot.contentText, snapshot.url);
  const retrievedAt = snapshot.retrievedAt.toISOString();

  return {
    sourceKey: VISION_SOURCE_KEY,
    items: items.map((i) => ({ ...i, retrievedAt })),
    snapshotId: snapshot.id,
    retrievedAt,
  };
}

/** Split snapshot text into coarse vision items (heading + description). */
export function parseVisionItems(contentText: string, baseUrl: string): VisionContextItem[] {
  const lines = contentText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: VisionContextItem[] = [];
  let current: Partial<VisionContextItem> | null = null;

  const flush = () => {
    if (current && current.title && current.description) {
      items.push({
        title: current.title,
        officialUrl: current.officialUrl ?? baseUrl,
        description: current.description,
        relatedPrograms: current.relatedPrograms ?? [],
        retrievedAt: current.retrievedAt ?? new Date().toISOString(),
        // AC-18 — derived opportunities are always labeled system-suggested.
        derivedOpportunityLabel: "system-suggested",
      });
    }
    current = null;
  };

  for (const line of lines) {
    // A likely heading: short line ending without sentence punctuation.
    if (line.length <= 80 && !/[.!?:]$/.test(line)) {
      flush();
      current = { title: line };
      continue;
    }
    if (current) {
      current.description = current.description
        ? `${current.description} ${line}`
        : line;
    }
  }
  flush();

  return items;
}
