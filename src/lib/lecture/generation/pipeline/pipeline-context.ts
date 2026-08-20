/**
 * Strongly-Typed Pipeline Context Container (Milestone 1 — Feature F2).
 * ====================================================================
 * State container for intermediate and final artifacts across the 17-pass pipeline.
 */

import type {
  LearningExperience,
  LearningBlueprint,
  ConceptBlock,
  LearningActivity,
  AssessmentItem,
  VisualArtifact,
  EvidenceReference,
  ExperienceGuide,
  ExperienceGateResult,
  ExperienceExport,
  PedagogicalStage,
} from "../../types/learning-experience";

export interface SourceChunk {
  id: string;
  sourceDocumentId: string;
  locator: string; // e.g. "Ch 4, Sec 2, p. 112"
  text: string;
  tokenCount: number;
  criticality: "critical" | "important" | "supporting";
  sha256Hash: string;
}

export interface ConceptNode {
  id: string;
  name: string;
  definition: string;
  prerequisites: string[]; // ConceptNode IDs
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  sourceChunkIds: string[];
  suggestedStage?: PedagogicalStage;
}

export interface CourseLearningOutcomeInput {
  id: string;
  number?: string;
  text: string;
  bloomLevel?: string;
}

export interface ReviewFinding {
  passNumber: number;
  issue: string;
  componentId?: string;
  repairNeeded: boolean;
  severity: "error" | "warning" | "info";
  guidance?: string;
}

export interface RepairAttempt {
  attempt: number;
  repairedComponents: string[];
  timestamp: Date;
}

export interface PipelineContext {
  // Input parameters
  projectId: string;
  tenantId: string;
  organizationId?: string;
  title: string;
  topicDescription: string;
  targetAudience: string;
  languagePolicy: "en" | "ar" | "bilingual";
  estimatedDurationMin: number;
  rawSourceDocuments: Array<{ id: string; title: string; text: string }>;
  teacherEnteredClos: CourseLearningOutcomeInput[];
  selectedCloIds: string[];

  // Intermediate state artifacts across passes
  sourceChunks: SourceChunk[];                                // Pass 1
  knowledgeGraph: {
    nodes: ConceptNode[];
    edges: Array<{ from: string; to: string; relationship: string }>;
  };                                                          // Pass 2
  scaffoldedBlocks: Array<Partial<ConceptBlock>>;             // Pass 3
  cloAlignmentMap: Map<string, string[]>;                     // Pass 4
  blueprintDraft?: LearningBlueprint;                         // Pass 5
  blueprintReview?: { passed: boolean; score: number };       // Pass 6
  elaboratedBlocks: ConceptBlock[];                           // Pass 7
  activities: LearningActivity[];                             // Pass 8
  assessments: AssessmentItem[];                              // Pass 9
  visuals: VisualArtifact[];                                  // Pass 10
  assetMatches: Map<string, any>;                             // Pass 11
  guideDraft?: ExperienceGuide;                               // Pass 12
  evidenceReferences: EvidenceReference[];                    // Pass 13
  reviewFindings: ReviewFinding[];                            // Pass 14
  repairHistory: RepairAttempt[];                             // Pass 15
  contentRegistry?: any;                                     // Deduplication Registry

  // Canonical Aggregate Root
  canonicalExperience?: LearningExperience;                   // Pass 16

  // Projection Outputs
  projections: {                                              // Pass 17
    studentUxJson?: object;
    pptxOutline?: object;
    qtiPackageJson?: object;
    docxGuideJson?: object;
  };

  // Pipeline execution telemetry
  gateResults: ExperienceGateResult[];
  currentPass: number;
  status: "idle" | "running" | "completed" | "needs_faculty_review" | "failed";
  progressPercent: number;
  errors: string[];
}

/**
 * Creates a fresh, fully initialized PipelineContext.
 */
export function createInitialPipelineContext(
  params: Partial<PipelineContext> & {
    projectId: string;
    tenantId: string;
    title: string;
  }
): PipelineContext {
  return {
    topicDescription: params.title,
    targetAudience: "Undergraduate Students",
    languagePolicy: "en",
    estimatedDurationMin: 50,
    rawSourceDocuments: [],
    teacherEnteredClos: [],
    selectedCloIds: [],

    sourceChunks: [],
    knowledgeGraph: { nodes: [], edges: [] },
    scaffoldedBlocks: [],
    cloAlignmentMap: new Map(),
    elaboratedBlocks: [],
    activities: [],
    assessments: [],
    visuals: [],
    assetMatches: new Map(),
    evidenceReferences: [],
    reviewFindings: [],
    repairHistory: [],

    projections: {},
    gateResults: [],
    currentPass: 0,
    status: "idle",
    progressPercent: 0,
    errors: [],
    ...params,
  };
}
