/**
 * Lecture Generation — shared types.
 * ===========================================================================
 * LectureProjectWithRelations is the loaded project shape the generation
 * layer operates on. SlideContentJson is the structured per-slide artifact
 * (never rendered directly to PPTX — that is T-08's job).
 */
import { Prisma } from "@prisma/client";

export type LectureProjectWithRelations = Prisma.LectureProjectGetPayload<{
  include: { courseProfile: true; sourceBlocks: true; sourceDocuments: true };
}>;

export interface CitationJson {
  sourceBlockId: string;
  locator: string;
  excerpt: string;
}

export interface Claim {
  id: string;
  text: string;
  type: "SOURCE_FACT" | "EXTERNAL_FACT" | "DERIVED" | "ILLUSTRATIVE" | "HYPOTHETICAL" | "INFERENCE";
  sourceIds: string[];
  locator?: string;
  confidence?: number;
  retrievalDate?: string;
  verificationStatus: "VERIFIED" | "PARTIALLY_SUPPORTED" | "UNSUPPORTED" | "CONFLICTING";
}

export interface QualityScore {
  overall: number;
  accuracy: number;
  depth: number;
  pedagogy: number;
  sourceGrounding: number;
  coherence: number;
  exampleQuality: number;
  assessmentQuality: number;
  misconceptionQuality: number;
  visualExplanatoryValue: number;
}

export interface ReviewResult {
  status: "PASS" | "SOFT_FAIL" | "HARD_FAIL" | "NEEDS_FACULTY_REVIEW";
  score: number;
  criticalIssues: string[];
  majorIssues: string[];
  minorIssues: string[];
  failedRules: string[];
  unsupportedClaims: string[];
  weakQuestions: string[];
  weakExamples: string[];
  missingConcepts: string[];
  repairActions: string[];
}

export interface VisualSpecification {
  visualType: "PROCESS" | "ARCHITECTURE" | "DATA_FLOW" | "COMPARISON" | "CAUSE_EFFECT" | "DECISION_TREE" | "MATRIX" | "TIMELINE" | "CHART" | "CALCULATION" | "MISCONCEPTION" | "CASE_STUDY" | "WORKSPACE" | "QUESTION_ONLY";
  purpose: string;
  learningMessage: string;
  layout: string;
  elements: any[];
  connections: any[];
  labels: string[];
  annotations: string[];
  emphasis: string[];
  studentQuestion: string;
  suggestedSearchQuery?: string;
  fetchedImageUrl?: string;
  /** Resolved image display fields (set by the visual resolver). */
  title?: string;
  caption?: string;
  imageUrl?: string;
}

export interface SlideContentJson {
  slideNo?: number;
  function?: string;
  title: string;
  body: {
    visibleCopy: string;
    bullets: string[];
    studentAction?: {
      type: "poll" | "pause_discuss" | "collaboration" | "calculation";
      stem: string;
      options?: string[];
    };
  };
  visualIntent?: {
    description: string;
    sourceFigureRef: string | null;
    generateDiagram: boolean;
    diagramType?: "mechanism" | "comparison" | "workflow" | "data_chart" | "concept_map";
  };
  notes?: {
    instructorNotes: string;
    timingMinutes: number;
    facilitationMoves: string[];
    answers: string;
  };
  sourceCoverage?: {
    mappedBlockIds: string[];
    omissionReason: string | null;
  };
  cloLinks?: string[];
  
  // Internal generation metadata tracking
  wordCount: number;
  qualityScore?: QualityScore;
  reviewStatus?: string;
  textAr?: { title?: string; bullets?: string[] };
  [key: string]: any; // allow additional properties from LLM output
}

/** Result of the per-slide generation step, before persistence. */
export interface SlideArtifactDraft {
  slideNo: number;
  slidePlanId: string;
  content: SlideContentJson;
  errors: string[];
  flagged: boolean;
  error?: string;
}

export interface ReadinessItemJson {
  stem: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctIndex: number;
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
  misconception?: string;
  sourceLocator?: string;
  cloId: string;
  sourceBlockId?: string;
  slideNo: number;
}
