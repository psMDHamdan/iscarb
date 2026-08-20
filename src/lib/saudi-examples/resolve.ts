/**
 * Saudi Context Injector — concept resolver.
 * Given a free-text technical concept (EN or AR, any case, with/without
 * diacritics), find the matching Saudi example mapping. Deterministic and
 * model-free; returns null when there is no confident match (never invents).
 */
import { CONCEPT_MAPPINGS, type ConceptMapping, type ConceptCategory, type Bilingual } from "./data";

function normalize(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670]/g, "") // strip Arabic harakat + superscript alef
    .replace(/\u0640/g, "") // tatweel
    .trim()
    .toLowerCase();
}

/** A compact, response-ready Saudi-context entry for a matched concept. */
export interface SaudiContextHit {
  id: string;
  concept: Bilingual;
  category: ConceptCategory;
  example: { name: Bilingual; by: Bilingual; note: Bilingual };
  why: Bilingual;
}

function toHit(m: ConceptMapping): SaudiContextHit {
  const ex = m.saudi[0];
  return {
    id: m.id,
    concept: m.concept,
    category: m.category,
    example: { name: ex.name, by: ex.by, note: ex.note },
    why: m.why,
  };
}

const BY_ID = new Map(CONCEPT_MAPPINGS.map((m) => [m.id, m]));

/** Resolve a single concept query to its mapping, or null. */
export function injectSaudiContext(query: string | null | undefined): ConceptMapping | null {
  if (!query) return null;
  const q = normalize(query);
  if (!q) return null;

  // 1) exact id / concept-label match
  const direct =
    BY_ID.get(q) ??
    CONCEPT_MAPPINGS.find(
      (m) => normalize(m.concept.en) === q || normalize(m.concept.ar) === q,
    );
  if (direct) return direct;

  // 2) keyword containment (longest keyword first for specificity)
  let best: { m: ConceptMapping; len: number } | null = null;
  for (const m of CONCEPT_MAPPINGS) {
    for (const k of m.keywords) {
      const nk = normalize(k);
      if (nk && (q.includes(nk) || nk.includes(q))) {
        if (!best || nk.length > best.len) best = { m, len: nk.length };
      }
    }
  }
  return best?.m ?? null;
}

/** Filter mappings by category (or return all). */
export function mappingsByCategory(category?: ConceptCategory | null): ConceptMapping[] {
  if (!category) return CONCEPT_MAPPINGS;
  return CONCEPT_MAPPINGS.filter((m) => m.category === category);
}

/**
 * Scan a free-text blob (a unit's title + content, a concept list, …) and return
 * every DISTINCT Saudi mapping whose keyword appears in it, deduped and capped.
 * Deterministic and model-free — used to inject Saudi context into pipeline
 * INFORM/ASSESS responses without inventing matches. To keep precision high on
 * arbitrary prose, only keywords of length ≥ 4 are scanned (short tokens like
 * "api"/"sso" would over-match); exact concept lookups still use injectSaudiContext.
 */
export function scanSaudiContext(text: string | null | undefined, limit = 4): SaudiContextHit[] {
  if (!text) return [];
  const q = normalize(text);
  if (!q) return [];
  const out: SaudiContextHit[] = [];
  const seen = new Set<string>();
  for (const m of CONCEPT_MAPPINGS) {
    if (seen.has(m.id)) continue;
    const hit = m.keywords.some((k) => {
      const nk = normalize(k);
      return nk.length >= 4 && q.includes(nk);
    });
    if (hit) {
      seen.add(m.id);
      out.push(toHit(m));
      if (out.length >= limit) break;
    }
  }
  return out;
}
