/**
 * Official Sources Hub — shared types.
 * ===========================================================================
 * NationalStandard structures extracted by the Jaheziah parser, plus the
 * NFR-11 allow-list of official Saudi domains.
 */

/** NFR-11 — only these hosts may be fetched by the source sync. */
export const ALLOWED_DOMAINS = [
  "etec.gov.sa",
  "media.etec.gov.sa",
  "f.etec.gov.sa",
  "ncaaa.gov.sa",
  "vision2030.gov.sa",
] as const;

export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

/** Key Learning Outcome from a Jaheziah standard. */
export interface KLO {
  id: string;
  title: string;
  description?: string;
}

/** Graduate Knowledge Unit. */
export interface GKU {
  id: string;
  title: string;
  description?: string;
}

/** Specialty Knowledge Unit, e.g. SKU 8.2. */
export interface SKU {
  id: string;
  title: string;
  topics: string[];
  slos: SLO[];
}

/** Student Learning Outcome within a SKU. */
export interface SLO {
  id: string;
  text: string;
}

/** Parsed weights of topics (e.g. { "SE Process": 30 }). */
export type TopicWeights = Record<string, number>;

/** Structured extraction of a Jaheziah specialty standard. */
export interface NationalStandard {
  specialtyKey: string;
  klos: KLO[];
  gkus: GKU[];
  skus: SKU[];
  slos: SLO[];
  topics: string[];
  weights: TopicWeights;
}

/** A vision-2030 context item synced from the official site. */
export interface VisionContextItem {
  title: string;
  officialUrl: string;
  description: string;
  relatedPrograms: string[];
  retrievedAt: string;
  /** AC-18 — derived opportunities are always labeled system-suggested. */
  derivedOpportunityLabel?: "system-suggested";
}
