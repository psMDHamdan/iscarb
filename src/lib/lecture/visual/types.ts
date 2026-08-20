/**
 * Visual Engine Types & Interface Contracts
 * ==========================================
 * Canonical types for the 7 visual families, structured visual specifications,
 * NVIDIA NIM VLM Quality Gate, and Semantic Visual Deduplication Registry.
 */

export type VisualFamily =
  | "PROCESS"
  | "SYSTEM_ARCHITECTURE"
  | "DATA_FLOW"
  | "COMPARISON_MATRIX"
  | "CAUSE_EFFECT"
  | "QUANTITATIVE"
  | "HIERARCHY";

export const CANONICAL_VISUAL_FAMILIES: readonly VisualFamily[] = [
  "PROCESS",
  "SYSTEM_ARCHITECTURE",
  "DATA_FLOW",
  "COMPARISON_MATRIX",
  "CAUSE_EFFECT",
  "QUANTITATIVE",
  "HIERARCHY",
] as const;

export type VisualLayoutDirection = "LR" | "TB" | "RADIAL" | "GRID";

export interface VisualNode {
  id: string;
  label: string;
  type?: string;
  description?: string;
  x?: number;
  y?: number;
  metadata?: Record<string, unknown>;
}

export interface VisualConnection {
  from: string;
  to: string;
  label?: string;
  relationType?: string;
  bidirectional?: boolean;
  style?: string;
}

export interface VisualLayout {
  type: string;
  direction?: VisualLayoutDirection;
  properties?: Record<string, unknown>;
}

export interface VisualSpecification {
  id: string;
  visualType?: string;
  visualFamily: VisualFamily;
  title: string;
  description: string;
  layout: VisualLayout;
  nodes: VisualNode[];
  connections: VisualConnection[];
  studentFocusQuestion: string;
  pedagogicalRationale: string;
  rawLatexOrData?: string;
  svgMarkup?: string;
  // Backward compatibility fields for legacy consumers
  elements?: VisualNode[];
  labels?: string[];
  annotations?: string[];
}

export interface VisualGenerationContext {
  topic: string;
  conceptTitle: string;
  academicTruth?: string;
  intuitionMentalModel?: string;
  mechanismExplanation?: string;
  realWorldTransfer?: string;
  misconceptionAlert?: string;
  discipline?: string;
  preferredFamily?: VisualFamily;
  slideNo?: number;
}

export interface VlmScores {
  relevance: number; // >= 85 required to pass
  educationalValue: number; // >= 80 required to pass
  scientificConsistency: number; // >= 90 required to pass
}

export interface VlmEvaluationResult {
  passed: boolean;
  scores: VlmScores;
  rationale: string;
  detectedErrors?: string[];
  feedback?: string;
}

export interface VlmEvaluationOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  forceMock?: boolean;
  timeoutMs?: number;
}

export interface VisualDeduplicationResult {
  isUnique: boolean;
  similarityScore: number;
  conflictingVisualId?: string;
  reason?: string;
}
