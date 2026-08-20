/**
 * Official Sources Hub — source syncer (TASK-06 §A).
 * ===========================================================================
 * Fetches an official source, computes a SHA-256 hash, and creates a pending
 * AuthoritativeSourceSnapshot only when content changed. No changes are used
 * in production until an admin approves the snapshot (AC-17).
 */
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { assertAllowedUrl, assertAllowedRedirect } from "./domain-validator";

const USER_AGENT = "iSCARB-SourceSync/1.0";

export interface SyncOutcome {
  sourceKey: string;
  changed: boolean;
  snapshotId: string | null;
  contentHash: string;
  url: string;
  status: "synced" | "unchanged";
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Sync one source. `fetchImpl` is injectable for tests; production uses the
 * real global fetch against the source's configured URL (real fetch).
 */
export async function syncSource(
  sourceKey: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis)
): Promise<SyncOutcome> {
  const source = await db.authoritativeSource.findUnique({
    where: { sourceKey },
  });
  if (!source) throw new Error(`Unknown source: ${sourceKey}`);

  assertAllowedUrl(source.originalUrl);

  const res = await fetchImpl(source.originalUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/plain,*/*" },
    redirect: "follow",
  });

  // NFR-11 — the final URL after redirects must stay in the allow-list.
  assertAllowedRedirect(source.originalUrl, res.url);

  if (!res.ok) {
    throw new Error(`Fetch failed for ${source.originalUrl}: HTTP ${res.status}`);
  }

  const body = await res.text();
  const contentHash = createHash("sha256").update(body).digest("hex");

  const active = await db.authoritativeSourceSnapshot.findFirst({
    where: { sourceKey, approvalStatus: { in: ["approved", "pending"] }, translationOfSnapshotId: null },
    orderBy: { retrievedAt: "desc" },
  });

  if (active && active.contentHash === contentHash) {
    return {
      sourceKey,
      changed: false,
      snapshotId: active.id,
      contentHash,
      url: source.originalUrl,
      status: "unchanged",
    };
  }

  const snapshot = await db.authoritativeSourceSnapshot.create({
    data: {
      sourceKey,
      url: source.originalUrl,
      language: source.originalLanguage || "en",
      contentText: body,
      contentHash,
      approvalStatus: "pending",
    },
  });

  // AC-17 — notify admin for approval before production use.
  await db.auditLog.create({
    data: {
      actorId: null,
      action: "source_sync_pending_approval",
      entityType: "AuthoritativeSourceSnapshot",
      entityId: snapshot.id,
      category: "source_sync",
      severity: "info",
      details: {
        sourceKey,
        url: source.originalUrl,
        contentHash,
        changed: true,
      },
    },
  });

  return {
    sourceKey,
    changed: true,
    snapshotId: snapshot.id,
    contentHash,
    url: source.originalUrl,
    status: "synced",
  };
}
