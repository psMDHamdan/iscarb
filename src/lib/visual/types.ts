/**
 * AI Visual Learning System — Core Type Definitions & Data Contracts
 *
 * Defines all domain types, scoring rubrics, candidate metadata,
 * rejection taxonomies, and pipeline contracts for educational visual search.
 */

export type EducationalSubject =
  | "biology"
  | "physics"
  | "economics"
  | "computer_science"
  | "history"
  | "chemistry"
  | "mathematics"
  | "engineering"
  | "general";

export type DiagramType =
  | "diagram"
  | "schematic"
  | "chart"
  | "flowchart"
  | "map"
  | "cross_section"
  | "model"
  | "illustration"
  | "graph";

export type RejectionCode =
  | "REJECT_PORTRAIT_OR_PERSON"
  | "REJECT_FLAG_OR_EMBLEM"
  | "REJECT_CURRENCY_OR_STAMP"
  | "REJECT_DECORATIVE_ART"
  | "REJECT_BOOK_OR_DOCUMENT_SCAN"
  | "REJECT_RAW_UNLABELED_PHOTO"
  | "REJECT_OFF_TOPIC"
  | "REJECT_LOW_PEDAGOGICAL_VALUE"
  | "REJECT_HEURISTIC_FILTER";

export type ReformulationStrategy =
  | "KEYWORD_MODIFIER_INFUSION"
  | "DOMAIN_SYNONYM_SUBSTITUTION"
  | "TAXONOMIC_BROADENING"
  | "CATEGORY_SEARCH_PIVOT";

/**
 * Input query for educational visual search
 */
export interface VisualSearchQuery {
  topic: string;
  subject: EducationalSubject;
  diagramType?: DiagramType;
  targetAudience?: "university" | "k12" | "general";
  minConfidenceThreshold?: number; // 0 to 100, default: 70
  maxCandidates?: number; // default: 8
  keywords?: string[];
}

/**
 * Normalized metadata for a candidate visual retrieved from Wikimedia Commons or academic repositories
 */
export interface CandidateImageMetadata {
  id: string; // Wikimedia pageid or unique identifier
  title: string; // Raw title (e.g. "File:Human_heart_diagram-en.svg")
  fileName: string; // Stripped filename (e.g. "Human_heart_diagram-en.svg")
  cleanTitle: string; // Human-readable title (e.g. "Human heart diagram en")
  url: string; // Canonical full-resolution image URL
  thumbUrl: string; // High-quality preview thumbnail URL (e.g., 1200px)
  descriptionUrl?: string; // Wikimedia Commons page URL
  description: string; // Cleaned, HTML-stripped description
  categories: string[]; // Parsed category tags
  artist?: string; // Cleaned author / creator attribution
  license?: string; // Short license name (e.g. "CC BY-SA 4.0", "Public domain")
  licenseUrl?: string; // License terms URL
  attributionRequired?: boolean; // Whether attribution is legally required
  width: number; // Native pixel width
  height: number; // Native pixel height
  aspectRatio: number; // Width / Height ratio (e.g. 1.33)
  fileSize?: number; // Size in bytes
  mimeType: string; // MIME type (e.g. "image/svg+xml", "image/png")
}

/**
 * Search options passed to Wikimedia search client
 */
export interface DiagramSearchOptions {
  query: string;
  limit?: number; // default: 8
  thumbWidth?: number; // default: 1200
  allowedMimeTypes?: string[]; // default: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
  userAgent?: string;
  timeoutMs?: number;
}

/**
 * Result of deterministic heuristic pre-filter
 */
export interface HeuristicFilterResult {
  passed: boolean;
  rejectedReason?: string;
  rejectionCode?: RejectionCode;
  matchedPattern?: string;
}

/**
 * Orthogonal 4-factor scoring rubric
 * Total weighted score formula:
 * (educationalValue * 0.35 + relevance * 0.30 + clarity * 0.20 + diagrammaticNature * 0.15) * 10
 */
export interface ScoringBreakdown {
  educationalValue: number; // 0 - 10 (Weight: 35%)
  relevance: number; // 0 - 10 (Weight: 30%)
  clarity: number; // 0 - 10 (Weight: 20%)
  diagrammaticNature: number; // 0 - 10 (Weight: 15%)
  totalWeightedScore: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
}

/**
 * Evaluation record for an individual candidate image
 */
export interface CandidateEvaluation {
  candidateId: string;
  title: string;
  url: string;
  thumbUrl: string;
  status: "ACCEPTED" | "REJECTED";
  rejectionCode?: RejectionCode;
  rejectionReason?: string;
  scores: ScoringBreakdown;
  reasoningChain: string;
  metadata?: CandidateImageMetadata;
}

/**
 * Output of LLM metadata verification pass
 */
export interface VerificationResult {
  status: "SUCCESS" | "RETRY_NEEDED" | "EXHAUSTED";
  selectedCandidate: CandidateEvaluation | null;
  evaluatedCandidates: CandidateEvaluation[];
  discardedCandidates: CandidateEvaluation[];
  attemptCount: number;
  queriesAttempted: string[];
  suggestedReformulation?: string;
  llmRawOutput?: string;
}

/**
 * Result of query reformulation
 */
export interface ReformulationResult {
  newQuery: string;
  strategy: ReformulationStrategy;
  attempt: number;
  explanation: string;
}

/**
 * Final selected educational diagram emitted by the visual pipeline
 */
export interface SelectedDiagram {
  topic: string;
  subject: EducationalSubject;
  title: string;
  cleanTitle: string;
  url: string;
  thumbUrl: string;
  sourceUrl: string;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  attribution: {
    artist?: string;
    license?: string;
    licenseUrl?: string;
    attributionRequired?: boolean;
  };
  confidenceScore: number; // 0 - 100
  scoringBreakdown: ScoringBreakdown;
  pedagogicalRationale: string;
  searchHistory: {
    attempts: number;
    queriesUsed: string[];
    totalCandidatesEvaluated: number;
    totalCandidatesDiscarded: number;
    discardLog: Array<{
      title: string;
      reason: string;
      rejectionCode?: RejectionCode;
      score?: number;
    }>;
  };
}

/**
 * Pipeline execution options
 */
export interface VisualPipelineOptions {
  maxRetries?: number; // default: 3
  minConfidenceThreshold?: number; // default: 70
  enableHeuristicPreFilter?: boolean; // default: true
  timeoutMs?: number; // default: 15000
  userAgent?: string;
  aiModel?: string;
  apiKey?: string;
  baseUrl?: string;
}
