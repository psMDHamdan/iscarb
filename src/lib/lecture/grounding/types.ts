/**
 * Types and interfaces for Source Grounding, Concept Graph DAG,
 * 4-Tier Claim Ledger, and Zero Invention Engine (M1).
 */

export type CriticalityTier = "critical" | "normal" | "low";

export interface SourceBlock {
  id: string;
  locator: string; // e.g. "page:3#p2" or "slide:5#bullet:1"
  text: string;
  criticality: CriticalityTier;
  sha256Hash: string; // Hex-encoded 64-char SHA-256 fingerprint
  metadata?: Record<string, any>;
}

export interface ChunkOptions {
  maxChunkChars?: number;
  minChunkChars?: number;
  documentTitle?: string;
  documentType?: "pdf" | "pptx" | "docx" | "html" | "text";
}

export type LearningStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LearningStageName =
  | "DISCOVER"
  | "UNDERSTAND"
  | "EXPLORE"
  | "PRACTICE"
  | "APPLY"
  | "CHALLENGE"
  | "MASTER";

export const STAGE_NAME_MAP: Record<LearningStage, LearningStageName> = {
  1: "DISCOVER",
  2: "UNDERSTAND",
  3: "EXPLORE",
  4: "PRACTICE",
  5: "APPLY",
  6: "CHALLENGE",
  7: "MASTER",
};

export const STAGE_NUMBER_MAP: Record<LearningStageName, LearningStage> = {
  DISCOVER: 1,
  UNDERSTAND: 2,
  EXPLORE: 3,
  PRACTICE: 4,
  APPLY: 5,
  CHALLENGE: 6,
  MASTER: 7,
};

export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  stage: LearningStage;
  sourceBlockIds: string[];
  prerequisites: string[]; // ConceptNode IDs
  metadata?: Record<string, any>;
}

export interface DAGValidationResult {
  isAcyclic: boolean;
  cycle?: string[];
}

export interface StagePrerequisitesResult {
  satisfied: boolean;
  missing: ConceptNode[];
}

export type ClaimType =
  | "DIRECTLY_SUPPORTED"
  | "PEDAGOGICAL_PARAPHRASE"
  | "INFERRED"
  | "UNSUPPORTED";

export interface ClaimClassification {
  claimText: string;
  claimType: ClaimType;
  sourceBlockId?: string;
  sha256Hash?: string;
  confidence: number;
  rationale: string;
  matchedExcerpt?: string;
  metadata?: Record<string, any>;
}

export interface AuditReport {
  directlySupportedCount: number;
  paraphraseCount: number;
  inferredCount: number;
  unsupportedCount: number;
  totalClaims: number;
  passed: boolean;
  unsupportedClaims: ClaimClassification[];
}

export type QuantitativeCategory =
  | "percentage"
  | "multiplier"
  | "unit"
  | "performance"
  | "cohort_size"
  | "date"
  | "citation"
  | "chemical_concentration"
  | "approximate";

export interface FoundFigure {
  value: string | number;
  rawMatch: string;
  category: QuantitativeCategory;
  isGrounded: boolean;
  context?: string;
}

export interface QuantitativeScanResult {
  foundFigures: FoundFigure[];
  hallucinatedFigures: string[];
  passed: boolean;
}

export interface ZeroInventionResult {
  output: string;
  hasMissingDataFallback: boolean;
  fabricatedNumbers: string[];
  isClean: boolean;
}
