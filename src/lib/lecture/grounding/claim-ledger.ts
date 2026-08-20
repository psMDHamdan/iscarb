import { scanQuantitativeFigures } from "./quantitative-scanner";
import type {
  AuditReport,
  ClaimClassification,
  ClaimType,
  SourceBlock,
} from "./types";

const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "al",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "et",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

/**
 * 4-Tier Claim Ledger & Epistemic Grounding Classifier.
 * Classifies factual assertions into:
 * - DIRECTLY_SUPPORTED (>= 0.90 confidence, verbatim/exact evidence link)
 * - PEDAGOGICAL_PARAPHRASE (0.70-0.89 confidence, accurate semantic paraphrase)
 * - INFERRED (0.50-0.69 confidence, logical deduction)
 * - UNSUPPORTED (< 0.50 confidence, missing evidence or hallucinated figures)
 */
export class ClaimLedger {
  /**
   * Classifies a claim against a list of SourceBlocks.
   */
  classifyClaim(claimText: string, sources: SourceBlock[]): ClaimClassification {
    const trimmed = (claimText || "").trim();
    if (!trimmed) {
      return {
        claimText: "",
        claimType: "UNSUPPORTED",
        confidence: 0,
        rationale: "Empty claim text",
      };
    }

    if (!sources || sources.length === 0) {
      return {
        claimText: trimmed,
        claimType: "UNSUPPORTED",
        confidence: 0,
        rationale: "No source blocks provided for verification",
      };
    }

    // 1. Quantitative Hallucination Pre-Check
    const scan = scanQuantitativeFigures(trimmed, sources);
    if (!scan.passed && scan.hallucinatedFigures.length > 0) {
      return {
        claimText: trimmed,
        claimType: "UNSUPPORTED",
        confidence: 0.1,
        rationale: `Contains ungrounded quantitative figure: "${scan.hallucinatedFigures.join(", ")}"`,
      };
    }

    const cleanClaim = this.normalizeSentence(trimmed);

    // 2. Verbatim Substring Match Check
    for (const source of sources) {
      const cleanSource = this.normalizeSentence(source.text);
      if (
        cleanSource.includes(cleanClaim) ||
        (cleanClaim.length > 30 && cleanClaim.includes(cleanSource))
      ) {
        return {
          claimText: trimmed,
          claimType: "DIRECTLY_SUPPORTED",
          sourceBlockId: source.id,
          sha256Hash: source.sha256Hash,
          confidence: 0.95,
          rationale: "Direct verbatim match with source block content",
          matchedExcerpt: source.text.slice(0, 180),
        };
      }
    }

    // 3. Token Overlap & Similarity Scorer
    const claimTokens = this.tokenize(trimmed);
    if (claimTokens.size === 0) {
      return {
        claimText: trimmed,
        claimType: "UNSUPPORTED",
        confidence: 0.0,
        rationale: "Claim contains no meaningful content tokens",
      };
    }

    let bestDice = 0;
    let bestJaccard = 0;
    let bestOverlap = 0;
    let bestSource: SourceBlock | undefined;

    for (const source of sources) {
      const sourceTokens = this.tokenize(source.text);
      const { dice, jaccard, overlap } = this.calculateSimilarity(
        claimTokens,
        sourceTokens
      );
      if (dice > bestDice) {
        bestDice = dice;
        bestJaccard = jaccard;
        bestOverlap = overlap;
        bestSource = source;
      }
    }

    // Pedagogical paraphrase: strong conceptual token alignment
    if ((bestDice >= 0.55 || (bestOverlap >= 0.70 && bestJaccard >= 0.40)) && bestSource) {
      const confidence = Number((0.72 + Math.min(0.16, bestDice * 0.2)).toFixed(2));
      return {
        claimText: trimmed,
        claimType: "PEDAGOGICAL_PARAPHRASE",
        sourceBlockId: bestSource.id,
        sha256Hash: bestSource.sha256Hash,
        confidence,
        rationale: `Pedagogical rephrasing with high token correspondence (${(bestDice * 100).toFixed(1)}% alignment)`,
        matchedExcerpt: bestSource.text.slice(0, 180),
      };
    }

    // Inferred: moderate conceptual deduction
    if ((bestDice >= 0.28 || bestOverlap >= 0.35) && bestSource) {
      const confidence = Number((0.52 + Math.min(0.16, bestDice * 0.25)).toFixed(2));
      return {
        claimText: trimmed,
        claimType: "INFERRED",
        sourceBlockId: bestSource.id,
        sha256Hash: bestSource.sha256Hash,
        confidence,
        rationale: `Conceptually inferred from source block principles (${(bestDice * 100).toFixed(1)}% token alignment)`,
        matchedExcerpt: bestSource.text.slice(0, 180),
      };
    }

    return {
      claimText: trimmed,
      claimType: "UNSUPPORTED",
      confidence: 0.0,
      rationale: "No supporting evidence found in provided source blocks",
    };
  }

  /**
   * Batch verifies a collection of claims against the source corpus.
   */
  verifyBatch(claims: string[], sources: SourceBlock[]): ClaimClassification[] {
    return claims.map((c) => this.classifyClaim(c, sources));
  }

  /**
   * Generates a comprehensive audit report for a set of claim classifications.
   */
  generateAuditReport(claims: ClaimClassification[]): AuditReport {
    let directlySupportedCount = 0;
    let paraphraseCount = 0;
    let inferredCount = 0;
    let unsupportedCount = 0;
    const unsupportedClaims: ClaimClassification[] = [];

    for (const c of claims) {
      switch (c.claimType) {
        case "DIRECTLY_SUPPORTED":
          directlySupportedCount++;
          break;
        case "PEDAGOGICAL_PARAPHRASE":
          paraphraseCount++;
          break;
        case "INFERRED":
          inferredCount++;
          break;
        case "UNSUPPORTED":
          unsupportedCount++;
          unsupportedClaims.push(c);
          break;
      }
    }

    const totalClaims = claims.length;
    const passed = unsupportedCount === 0 && totalClaims > 0;

    return {
      directlySupportedCount,
      paraphraseCount,
      inferredCount,
      unsupportedCount,
      totalClaims,
      passed,
      unsupportedClaims,
    };
  }

  /**
   * Normalizes a sentence for substring comparison.
   */
  private normalizeSentence(text: string): string {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Tokenizes text into a set of normalized keywords, filtering out common stop words.
   */
  private tokenize(text: string): Set<string> {
    const words = (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
    return new Set(words);
  }

  /**
   * Computes similarity metrics (Dice F1, Jaccard, Overlap) between two token sets.
   */
  private calculateSimilarity(
    setA: Set<string>,
    setB: Set<string>
  ): { dice: number; jaccard: number; overlap: number } {
    if (setA.size === 0 || setB.size === 0) {
      return { dice: 0, jaccard: 0, overlap: 0 };
    }
    let intersection = 0;
    for (const item of Array.from(setA)) {
      if (setB.has(item)) {
        intersection++;
      }
    }
    const union = setA.size + setB.size - intersection;
    const jaccard = union > 0 ? intersection / union : 0;
    const dice = (2 * intersection) / (setA.size + setB.size);
    const minSize = Math.min(setA.size, setB.size);
    const overlap = minSize > 0 ? intersection / minSize : 0;

    return { dice, jaccard, overlap };
  }
}
