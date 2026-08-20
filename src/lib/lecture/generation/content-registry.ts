/**
 * Global Content Registry & Anti-Duplication Engine.
 * ===========================================================================
 * Tracks generated content across lecture decks, activities, application tasks,
 * and readiness assessments to prevent exact, wording, semantic, question, answer,
 * visual, or cognitive task duplicates.
 *
 * Also exposes a SentenceRegistry (Fix 6) that tracks every individual sentence
 * emitted across all slides so the generation layer can detect and reject
 * cross-slide sentence reuse before it reaches the student.
 */

export interface RegisteredContentItem {
  contentId: string;
  conceptId: string;
  contentType: "deck_slide" | "activity" | "application" | "readiness" | "visual";
  title: string;
  promptOrStem: string;
  answerOrSolution?: string;
  semanticSignature: string;
  answerSignature?: string;
  sourceIds: string[];
  visualId?: string;
  bloomLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

export interface DuplicationMatrixEntry {
  itemA: string;
  itemB: string;
  similarity: number;
  type: "semantic" | "answer" | "visual";
}

export class ContentRegistry {
  private items: Map<string, RegisteredContentItem> = new Map();

  /** Normalize string to compute a deterministic semantic signature. */
  public static computeSignature(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
      .sort()
      .join("_");
  }

  /** Calculate Jaccard similarity between two semantic signatures. */
  public static calculateSimilarity(sig1: string, sig2: string): number {
    if (!sig1 || !sig2) return 0;
    if (sig1 === sig2) return 1.0;
    const tokens1 = new Set(sig1.split("_"));
    const tokens2 = new Set(sig2.split("_"));
    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /** Compare visual IDs for deduplication. */
  public compareVisuals(visualId1: string, visualId2: string): boolean {
    if (!visualId1 || !visualId2) return false;
    return visualId1 === visualId2;
  }

  /** Register an item if unique; returns true if accepted, false if rejected. */
  public register(item: RegisteredContentItem): { accepted: boolean; reason?: string } {
    const newSig = ContentRegistry.computeSignature(item.promptOrStem);
    const newAnswerSig = item.answerOrSolution ? ContentRegistry.computeSignature(item.answerOrSolution) : "";

    for (const existing of this.items.values()) {
      // 1. Exact Duplicate
      if (existing.promptOrStem.trim().toLowerCase() === item.promptOrStem.trim().toLowerCase()) {
        return { accepted: false, reason: `Exact duplicate of item ${existing.contentId}` };
      }

      // 2. Semantic Duplicate (Jaccard similarity >= 0.70)
      const similarity = ContentRegistry.calculateSimilarity(existing.semanticSignature, newSig);
      if (similarity >= 0.70) {
        return {
          accepted: false,
          reason: `Semantic duplicate (${Math.round(similarity * 100)}% match) of item '${existing.title}'`,
        };
      }

      // 3. Same Question with Different Wording / Same Answer Signature
      if (newAnswerSig && existing.answerSignature && existing.answerSignature === newAnswerSig) {
        return { accepted: false, reason: `Duplicate answer signature matching item '${existing.title}'` };
      }

      // 4. Visual Duplicate Check
      if (item.visualId && this.compareVisuals(item.visualId, existing.visualId || "")) {
        return { accepted: false, reason: `Same visual used by item '${existing.title}'` };
      }
    }

    item.semanticSignature = newSig;
    if (newAnswerSig) item.answerSignature = newAnswerSig;
    this.items.set(item.contentId, item);
    return { accepted: true };
  }

  /** Generate a duplication matrix for pre-publish audit. */
  public generateDuplicationMatrix(): DuplicationMatrixEntry[] {
    const entries: DuplicationMatrixEntry[] = [];
    const allItems = Array.from(this.items.values());

    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        const a = allItems[i];
        const b = allItems[j];

        const semSim = ContentRegistry.calculateSimilarity(a.semanticSignature, b.semanticSignature);
        if (semSim >= 0.40) {
          entries.push({ itemA: a.contentId, itemB: b.contentId, similarity: semSim, type: "semantic" });
        }

        if (a.answerSignature && b.answerSignature && a.answerSignature === b.answerSignature) {
          entries.push({ itemA: a.contentId, itemB: b.contentId, similarity: 1.0, type: "answer" });
        }

        if (a.visualId && b.visualId && a.visualId === b.visualId) {
          entries.push({ itemA: a.contentId, itemB: b.contentId, similarity: 1.0, type: "visual" });
        }
      }
    }

    return entries.sort((a, b) => b.similarity - a.similarity);
  }

  public getAll(): RegisteredContentItem[] {
    return Array.from(this.items.values());
  }

  public clear(): void {
    this.items.clear();
  }
}

const STOP_WORDS = new Set([
  "the", "and", "is", "in", "it", "of", "to", "for", "with", "on", "at", "by", "from",
  "this", "that", "these", "those", "which", "what", "where", "how", "why", "who",
]);

// ---------------------------------------------------------------------------
// SentenceRegistry — per-session sentence-level deduplication (Fix 6).
//
// Problem: The LLM reuses the same sentence verbatim across multiple slides
// (e.g. "CRISPR-Cas9 ribonucleoprotein complex binds target DNA complementary
// to gRNA adjacent" appeared on 7 of 20 slides). The ContentRegistry catches
// full-item duplicates but not individual bullet/copy sentences.
//
// Solution: A flat set of normalised sentence fingerprints. Before persisting
// any slide artifact the generation layer calls `recordSlide()` then checks
// `findDuplicateSentences()` against upcoming content.
// ---------------------------------------------------------------------------

/** Normalise a sentence to a fingerprint (lowercase, strip punctuation, collapse spaces). */
function normaliseSentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a block of text into individual sentences. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|[\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12); // ignore very short fragments
}

export interface SentenceConflict {
  sentence: string;
  firstSeenInSlide: number;
}

export class SentenceRegistry {
  /** Map from normalised fingerprint → slideNo where first seen */
  private seen: Map<string, number> = new Map();

  /**
   * Record all sentences emitted by a slide artifact.
   * Call this AFTER a slide is accepted so future slides can be checked.
   */
  recordSlide(slideNo: number, texts: string[]): void {
    for (const text of texts) {
      for (const sentence of splitSentences(text)) {
        const fp = normaliseSentence(sentence);
        if (fp && !this.seen.has(fp)) {
          this.seen.set(fp, slideNo);
        }
      }
    }
  }

  /**
   * Check candidate texts for sentences that already appeared in a previous slide.
   * Returns an array of conflicts (empty = clean).
   */
  findDuplicateSentences(candidateTexts: string[]): SentenceConflict[] {
    const conflicts: SentenceConflict[] = [];
    for (const text of candidateTexts) {
      for (const sentence of splitSentences(text)) {
        const fp = normaliseSentence(sentence);
        if (fp && this.seen.has(fp)) {
          conflicts.push({ sentence, firstSeenInSlide: this.seen.get(fp)! });
        }
      }
    }
    return conflicts;
  }

  /** True if any candidate text contains a repeated sentence. */
  hasDuplicates(candidateTexts: string[]): boolean {
    return this.findDuplicateSentences(candidateTexts).length > 0;
  }

  /** Reset between generation sessions. */
  clear(): void {
    this.seen.clear();
  }

  /** Number of unique sentences tracked. */
  get size(): number {
    return this.seen.size;
  }
}

/** Module-level singleton — shared across a single generation pipeline run. */
export const globalSentenceRegistry = new SentenceRegistry();

