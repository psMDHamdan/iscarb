/**
 * Types & Contracts for Multi-Format Projection Adapters (Milestone 1 — F3).
 * =========================================================================
 * Decouples Canonical LearningExperience models from presentation renderers.
 */

import type {
  LearningExperience,
  ConceptBlock,
  LearningActivity,
  AssessmentItem,
  VisualArtifact,
  LearningBlueprint,
  PedagogicalStage,
} from "../types/learning-experience";

export type PedagogicalPhase = PedagogicalStage;

export interface ProjectionError {
  code: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface ProjectionMetadata {
  adapterName: string;
  targetFormat: "STUDENT_UX" | "PPTX" | "QTI_ZIP" | "DOCX_GUIDE" | "JSON";
  projectedAt: Date;
  sourceExperienceId: string;
  sourceVersion?: number;
  itemCount?: number;
  checksum?: string;
  executionDurationMs?: number;
}

export interface ProjectionResult<TOutput> {
  success: boolean;
  data?: TOutput;
  errors: ProjectionError[];
  warnings: ProjectionError[];
  metadata: ProjectionMetadata;
}

export interface ProjectionAdapter<
  TInput = LearningExperience,
  TOutput = unknown,
  TOptions = unknown
> {
  readonly format: string;
  readonly name: string;
  project(input: TInput, options?: TOptions): Promise<ProjectionResult<TOutput>> | ProjectionResult<TOutput>;
  validate?(input: TInput): boolean | Promise<boolean>;
}

// -----------------------------------------------------------------------------
// Student UX ViewModel Types
// -----------------------------------------------------------------------------

export interface StudentStageNavViewModel {
  stageKey: PedagogicalPhase;
  displayName: string;
  stageNumber: number; // 1..7
  conceptCount: number;
  conceptSummaries: {
    id: string;
    orderIndex: number;
    title: string;
    bloomLevel: string;
    estimatedMinutes: number;
  }[];
}

export interface StudentConceptViewModel {
  id: string;
  stage: PedagogicalPhase;
  orderIndex: number;
  title: string;
  titleAr?: string;
  bloomLevel: string;
  estimatedMinutes: number;

  // 5-Layer Student View (No technical field jargon)
  coreInsight: string;
  mentalModel: {
    analogy: string;
    framework: string;
  };
  mechanism: {
    explanation: string;
    steps?: string[];
  };
  realWorldTransfer: {
    scenario: string;
    application: string;
  };
  commonPitfalls: {
    misconception: string;
    whyIncorrect: string;
    howToThinkAboutIt: string;
  }[];

  // Visual Scaffolding
  visual?: {
    visualType: string;
    title: string;
    caption: string;
    svgCode?: string;
    imageUrl?: string;
    attribution?: string;
  };

  // Interactive Activities (Student safe - answers stripped)
  activity?: {
    id: string;
    type: string;
    actionVerb: string;
    title: string;
    prompt: string;
    promptAr?: string;
    scaffoldingLevel: string;
    progressiveHints: string[]; // Level 1..3 or 4 hints
  };

  // Formative Assessment (Hidden answer architecture - NO isCorrect, NO correctOptionId, NO rationales)
  assessment?: {
    id: string;
    stem: string;
    stemAr?: string;
    difficulty: string;
    options: { id: string; text: string; textAr?: string }[];
  };

  // Grounded source citation reference (if student wishes to see reference)
  sourceCitation?: {
    sourceKey: string;
    citationText: string;
    hash?: string;
  };
}

export interface StudentFinalChallengeViewModel {
  id: string;
  title: string;
  scenario: string;
  prompt: string;
  rubricCriteria: string[];
}

export interface StudentExperienceViewModel {
  experienceId: string;
  projectId?: string;
  courseTitle: string;
  targetAudience: string;
  estimatedDurationMinutes: number;
  overview: {
    hookNarrative: string;
    learningOutcomes: string[];
    prerequisites: string[];
  };
  navigation: {
    stages: StudentStageNavViewModel[];
    totalConcepts: number;
    initialActiveStage: PedagogicalPhase;
    initialActiveConceptId: string;
  };
  concepts: Record<string, StudentConceptViewModel>;
  finalChallenge?: StudentFinalChallengeViewModel;
}

// -----------------------------------------------------------------------------
// PPTX Projection Types
// -----------------------------------------------------------------------------

export interface PptxProjectionOptions {
  theme?: "ztm-dark" | "light";
  includeNotes?: boolean;
  language?: "en" | "ar" | "bilingual";
}

export interface PptxSlideViewModel {
  slideNumber: number;
  stage: PedagogicalPhase;
  header: string;
  coreIdea: string;
  bodyBullets: string[];
  actionCallout?: string; // e.g. "▶ Predict: ..."
  visualType?: string;
  visualSvg?: string;
  speakerNotes?: string;
  layout: "TITLE" | "CONCEPT_DUAL" | "MECHANISM_VISUAL" | "ACTIVITY_CHECKPOINT" | "FINAL_CHALLENGE";
  isRtl?: boolean;
}

export interface PptxOutlineViewModel {
  presentationId: string;
  title: string;
  subtitle?: string;
  theme: string;
  totalSlides: number;
  slides: PptxSlideViewModel[];
  binaryBuffer?: Buffer;
}

// -----------------------------------------------------------------------------
// QTI Projection Types
// -----------------------------------------------------------------------------

export interface QtiProjectionOptions {
  qtiVersion?: "2.1" | "3.0";
  includeModalFeedback?: boolean;
  packageIdentifier?: string;
}

export interface QtiPackageResult {
  zipBuffer?: Buffer;
  filename: string;
  manifestXml: string;
  testXml: string;
  itemXmls: Record<string, string>;
  itemCount: number;
}

// -----------------------------------------------------------------------------
// DOCX Projection Types
// -----------------------------------------------------------------------------

export interface DocxProjectionOptions {
  includeAnswerKey?: boolean;
  includeStudentCompanion?: boolean;
  includeRubrics?: boolean;
}

export interface DocxGuideResult {
  buffer?: Buffer;
  filename: string;
  title: string;
  sectionsCount: number;
}
