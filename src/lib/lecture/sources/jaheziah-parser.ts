/**
 * Official Sources Hub — Jaheziah parser (TASK-06 §D).
 * ===========================================================================
 * Extracts structured KLOs/GKUs/SKUs/SLOs/topics/weights from a Jaheziah
 * specialty-standard snapshot using DeepSeek (chatJson). Returns a typed
 * NationalStandard (NFR-12: never fabricates from model memory — the model is
 * given the snapshot text and returns strict JSON only).
 */
import { db } from "@/lib/db";
import { chatJson } from "@/lib/ai-engine";
import { NATIONAL_STANDARD_SCHEMA_HINT } from "./jaheziah-schema";
import type { NationalStandard } from "./types";

const MODEL = "nvidia/nemotron-3-nano-30b-a3b";

export class JaheziahParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JaheziahParseError";
  }
}

export async function parseJaheziahStandard(
  snapshotId: string,
  specialtyKey: string
): Promise<NationalStandard> {
  const snapshot = await db.authoritativeSourceSnapshot.findUnique({
    where: { id: snapshotId },
  });
  if (!snapshot) throw new JaheziahParseError(`Snapshot not found: ${snapshotId}`);

  const system =
    "You are a strict document parser for Saudi Jaheziah (ETEC) specialty standards. " +
    "Extract only what is present in the document. Never invent standards, clauses, " +
    "outcomes, or weights (NFR-12). Return STRICT JSON only, no prose.";
  const user = [
    `Parse this Jaheziah specialty standard document.`,
    `Extract all KLOs, GKUs, SKUs, SLOs, topics and weights.`,
    `Return STRICT JSON only.`,
    `Specialty key: ${specialtyKey}`,
    `Expected shape: ${NATIONAL_STANDARD_SCHEMA_HINT}`,
    `Source: ${snapshot.contentText.slice(0, 8000)}`,
  ].join("\n");

  const result = await chatJson({ system, user, temperature: 0.1, model: MODEL });

  if (!result.json || (result.json as { fallback?: boolean }).fallback === true) {
    throw new JaheziahParseError("Model returned no parseable JSON");
  }

  return normalizeStandard(result.json, specialtyKey);
}

/** Coerce the model's JSON into a well-typed NationalStandard. */
export function normalizeStandard(raw: unknown, specialtyKey: string): NationalStandard {
  const r = (raw ?? {}) as Record<string, unknown>;
  const klos = Array.isArray(r.klos) ? r.klos.map((k: unknown) => {
    const rec = (k ?? {}) as Record<string, unknown>;
    return {
      id: String(rec.id ?? rec.code ?? ""),
      title: String(rec.title ?? rec.name ?? ""),
      description: rec.description != null ? String(rec.description) : undefined,
    };
  }) : [];

  const gkus = Array.isArray(r.gkus) ? r.gkus.map((g: unknown) => {
    const rec = (g ?? {}) as Record<string, unknown>;
    return {
      id: String(rec.id ?? rec.code ?? ""),
      title: String(rec.title ?? rec.name ?? ""),
      description: rec.description != null ? String(rec.description) : undefined,
    };
  }) : [];

  const skus = Array.isArray(r.skus) ? r.skus.map((s: unknown) => {
    const rec = (s ?? {}) as Record<string, unknown>;
    const slos = Array.isArray(rec.slos) ? rec.slos.map((l: unknown) => {
      const lrec = (l ?? {}) as Record<string, unknown>;
      return {
        id: String(lrec.id ?? lrec.code ?? ""),
        text: String(lrec.text ?? lrec.title ?? ""),
      };
    }) : [];
    return {
      id: String(rec.id ?? rec.code ?? ""),
      title: String(rec.title ?? rec.name ?? ""),
      topics: Array.isArray(rec.topics) ? rec.topics.map(String) : [],
      slos,
    };
  }) : [];

  const slos = Array.isArray(r.slos) ? r.slos.map((l: unknown) => {
    const rec = (l ?? {}) as Record<string, unknown>;
    return {
      id: String(rec.id ?? rec.code ?? ""),
      text: String(rec.text ?? rec.title ?? ""),
    };
  }) : [];

  const topics = Array.isArray(r.topics) ? r.topics.map(String) : [];

  const weights: Record<string, number> = {};
  if (r.weights && typeof r.weights === "object" && !Array.isArray(r.weights)) {
    for (const [k, v] of Object.entries(r.weights as Record<string, unknown>)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) weights[k] = n;
    }
  }

  return { specialtyKey, klos, gkus, skus, slos, topics, weights };
}
