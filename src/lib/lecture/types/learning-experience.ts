/**
 * Canonical Types for iSCARB Learning Experience Platform (Revamp M1).
 * ===================================================================
 * Fully decoupled from legacy 20-slide presentations.
 * Matches Prisma schema and runtime E2E test contracts.
 */

export type PedagogicalStage =
  | "DISCOVER"
  | "UNDERSTAND"
  | "EXPLORE"
  | "PRACTICE"
  | "APPLY"
  | "CHALLENGE"
  | "MASTER";

export const PEDAGOGICAL_STAGES: PedagogicalStage[] = [
  "DISCOVER",
  "UNDERSTAND",
  "EXPLORE",
  "PRACTICE",
  "APPLY",
  "CHALLENGE",
  "MASTER",
];

export type DistractorMisconceptionType =
  | "OVER_GENERALIZATION"
  | "REVERSE_CAUSALITY"
  | "EDGE_CASE_NEGLECT"
  | "CONFUSION_OF_TERMS";

export interface Misconception {
  commonBelief: string;
  whyIncorrect: string;
  correction: string;
  distractorType: DistractorMisconceptionType;
}

export type MisconceptionModel = Misconception;

export interface ConceptBlock {
  id: string;
  experienceId: string;
  orderIndex: number;
  slug: string;
  title: string;
  titleAr?: string;
  stageCategory: PedagogicalStage;
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  cloIds: string[];
  sourceBlockIds: string[];

  // 5-Layer Pedagogical Depth
  academicTruth: string;
  intuitionMentalModel: string;
  mechanismExplanation: string;
  realWorldTransfer: string;
  misconceptionAlert: string;
  misconceptions: Misconception[];

  // Pedagogical Metadata
  coreIdea: string;
  keyTakeaways: string[];
  keywords: string[];
  estimatedMinutes: number;
  visualId?: string;
  activityId?: string;
  assessmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ConceptBlockModel = ConceptBlock;

export type ActivityType =
  | "PREDICT"
  | "TEACH_IT_BACK"
  | "ACTIVE_RECALL"
  | "WORKED_EXAMPLE"
  | "GUIDED_DISCUSSION"
  | "CALCULATION_LAB"
  | "PEER_POLL";

export interface LearningActivity {
  id: string;
  experienceId: string;
  conceptBlockId: string;
  activityType: ActivityType;
  title: string;
  prompt: string;
  promptAr?: string;
  actionVerb: string;
  scaffoldingLevel: "guided" | "fading" | "independent";
  initialContext?: Record<string, any>;
  expectedResponseCriteria?: Array<{ criterion: string; weight: number; rubricDescriptor: string }>;
  modelAnswer?: string;
  progressiveHints: [string, string, string, string] | string[];
  misconceptionTriggers?: Array<{ triggerPhrase: string; diagnosisMessage: string; repairGuidance: string }>;
  orderIndex: number;
  createdAt: Date;
}

export type LearningActivityModel = LearningActivity;

export type AssessmentType =
  | "FORMATIVE_CHECK"
  | "DIAGNOSTIC_MCQ"
  | "TRANSFER_CHALLENGE"
  | "CAPSTONE_CASE";

export interface AssessmentOption {
  id: "A" | "B" | "C" | "D";
  text: string;
  textAr?: string;
  isCorrect: boolean;
  misconceptionKey?: DistractorMisconceptionType;
  misconceptionExplanation?: string;
}

export type AssessmentOptionModel = AssessmentOption;

export interface AssessmentItem {
  id: string;
  experienceId: string;
  conceptBlockId?: string;
  assessmentType: AssessmentType;
  bloomLevel: "understand" | "apply" | "analyze" | "evaluate";
  difficulty: "easy" | "medium" | "hard" | "expert";
  stem: string;
  stemAr?: string;
  options: AssessmentOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  instructorRationale: string;
  distractorExplanations: Record<string, string>;
  progressiveHints?: [string, string, string, string] | string[];
  cloId?: string;
  orderIndex: number;
  isFinalGate: boolean;
  createdAt: Date;
}

export type AssessmentItemModel = AssessmentItem;

export type VisualType =
  | "PROCESS"
  | "SYSTEM_ARCHITECTURE"
  | "DATA_FLOW"
  | "COMPARISON_MATRIX"
  | "CAUSE_EFFECT"
  | "QUANTITATIVE"
  | "HIERARCHY";

export type AssetSourceTier =
  | "SOURCE_DOCUMENT"
  | "ACADEMIC_SEARCH"
  | "AI_SYNTHESIS"
  | "SEMANTIC_TEMPLATE"
  | "NATIVE_SVG";

export interface VisualSpecification {
  id?: string;
  visualType?: string;
  visualFamily?: VisualType;
  title?: string;
  description?: string;
  layout:
    | string
    | {
        type: string;
        direction?: "LR" | "TB" | "RADIAL" | "GRID";
        properties?: Record<string, unknown>;
      };
  elements?: Array<{ id: string; label: string; type: string; x?: number; y?: number }>;
  nodes?: Array<{ id: string; label: string; type?: string; description?: string; x?: number; y?: number; metadata?: Record<string, unknown> }>;
  connections: Array<{ from: string; to: string; label?: string; style?: string; relationType?: string; bidirectional?: boolean }>;
  labels?: string[];
  annotations?: string[];
  studentFocusQuestion: string;
  pedagogicalRationale?: string;
  rawLatexOrData?: string;
  svgMarkup?: string;
}

export interface VisualArtifact {
  id: string;
  experienceId: string;
  conceptBlockId?: string;
  visualType: VisualType;
  title: string;
  purpose: string;
  learningMessage: string;
  specificationJson: VisualSpecification;
  assetSourceTier: AssetSourceTier;
  sourcePriority: 1 | 2 | 3 | 4 | 5;
  primaryAssetUrl?: string;
  vectorSvgCode?: string;
  thumbnailUrl?: string;
  licenseType?: "CREATIVE_COMMONS" | "PUBLIC_DOMAIN" | "FAIR_USE_ACADEMIC" | string;
  attributionText?: string;
  attribution?: {
    author?: string;
    license: string;
    sourceUrl: string;
    domain: string;
  };
  altText: string;
  orderIndex: number;
  createdAt: Date;
}

export type VisualArtifactModel = VisualArtifact;

export type ClaimType =
  | "SOURCE_FACT"
  | "EXTERNAL_FACT"
  | "DERIVED"
  | "ILLUSTRATIVE"
  | "HYPOTHETICAL";

export type VerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED"
  | "CONFLICTING";

export interface EvidenceCitation {
  sourceKey: string;
  url?: string;
  doi?: string;
  hash: string;
  retrievedAt: string;
}

export interface EvidenceReference {
  id: string;
  experienceId: string;
  conceptBlockId: string;
  sourceBlockId: string;
  claimText: string;
  claimType: ClaimType;
  sourceLocator: string;
  verbatimExcerpt: string;
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  citation: EvidenceCitation;
  createdAt: Date;
}

export type EvidenceReferenceModel = EvidenceReference;

export interface BlueprintStagePlan {
  stageKey: PedagogicalStage;
  title: string;
  goal: string;
  conceptBlockIds: string[];
  durationMin: number;
}

export interface PrerequisiteGraph {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string; relationship: string }>;
}

export interface PacingStrategy {
  totalDurationMin: number;
  checkpoints: Array<{ stage: PedagogicalStage; targetMinute: number; requiredMastery: number }>;
}

export interface LearningBlueprint {
  id: string;
  experienceId: string;
  narrativeArc: string;
  learningOutcomes: Array<{ id: string; number: string; text: string; bloomLevel: string }>;
  stagePlanJson: BlueprintStagePlan[];
  prerequisiteGraph: PrerequisiteGraph;
  pacingStrategy: PacingStrategy;
  structuralReviewScore?: number;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LearningBlueprintModel = LearningBlueprint;

export interface ExperienceGuide {
  id: string;
  experienceId: string;
  facultyGuideJson: {
    facilitationScript: string;
    pacingGuide: Array<{ stage: PedagogicalStage; minutes: number; focus: string }>;
    discussionPrompts: string[];
    commonMisconceptions: Array<{ belief: string; repair: string }>;
    solutionKeys: Record<string, string>;
  };
  studentCompanionJson: {
    executiveSummary: string;
    keyConcepts: Array<{ title: string; summary: string }>;
    reflectionQuestions: string[];
    glossary: Record<string, string>;
    furtherReading: Array<{ title: string; url: string }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ExperienceGuideModel = ExperienceGuide;

export type GateStatus = "PASS" | "SOFT_FAIL" | "HARD_FAIL" | "WAIVED";

export interface GateFinding {
  severity: "error" | "warning" | "info";
  componentId?: string;
  message: string;
  repairGuidance?: string;
}

export interface ExperienceGateResult {
  id: string;
  experienceId: string;
  passNumber: number;
  gateName: string;
  status: GateStatus;
  score: number;
  findingsJson: GateFinding[];
  waivedBy?: string;
  waiveReason?: string;
  checkedAt: Date;
}

export type ExperienceGateResultModel = ExperienceGateResult;

export type ExportFormat =
  | "PPTX"
  | "STUDENT_UX_JSON"
  | "QTI_ZIP"
  | "PDF_HANDOUT"
  | "NCAAA_PACK"
  | "DOCX_GUIDE"
  | "JSON";

export interface ExperienceExport {
  id: string;
  experienceId: string;
  exportFormat: ExportFormat;
  storageKey: string;
  fileSize: number;
  mimeType: string;
  downloadUrl?: string;
  payload?: any;
  generatedAt: Date;
}

export type ExperienceExportModel = ExperienceExport;

export interface StudentBlockInteraction {
  id: string;
  sessionId: string;
  conceptBlockId: string;
  activityType: ActivityType | "MCQ_ANSWER" | "TRANSFER_RESPONSE";
  studentInput: string;
  selectedOptionId?: "A" | "B" | "C" | "D";
  isCorrect?: boolean;
  confidenceLevel?: "guessing" | "somewhat_confident" | "completely_sure";
  aiCoachFeedback?: string;
  hintsRequested: number;
  evaluatedMasteryScore?: number;
  timeSpentSeconds: number;
  createdAt: Date;
}

export type StudentBlockInteractionModel = StudentBlockInteraction;

export interface StudentExperienceSession {
  id: string;
  experienceId: string;
  studentId: string;
  currentBlockIndex: number;
  currentStage: PedagogicalStage | string;
  completedStageKeys: PedagogicalStage[] | string[];
  xpScore: number;
  masteryPercent: number;
  startedAt: Date;
  completedAt?: Date;
  lastActiveAt: Date;
  interactions: StudentBlockInteraction[];
}

export type StudentExperienceSessionModel = StudentExperienceSession;

export interface LearningExperienceSummary {
  title: string;
  targetAudience: string;
  estimatedDurationMinutes: number;
  prerequisites: string[];
  outcomes: string[];
}

export interface LearningExperience {
  id: string;
  organizationId?: string;
  tenantId: string;
  projectId: string;
  version: number;
  status: "draft" | "review" | "approved" | "published" | "archived" | "superseded";
  title: string;
  topicDescription?: string;
  targetAudience: string;
  languagePolicy: "en" | "ar" | "bilingual";
  bloomLevel: string;
  estimatedDurationMin: number;
  pedagogicalFramework: string;
  contentHash?: string;
  publishedAt?: Date;
  publishedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  summary?: LearningExperienceSummary;
  blueprint: LearningBlueprint;
  conceptBlocks: ConceptBlock[];
  activities: LearningActivity[];
  assessments: AssessmentItem[];
  visuals: VisualArtifact[];
  evidenceReferences: EvidenceReference[];
  evidenceMap?: EvidenceReference[];
  guide?: ExperienceGuide;
  gateResults?: ExperienceGateResult[];
  exports?: ExperienceExport[];
  studentSessions?: StudentExperienceSession[];
}

export type LearningExperienceModel = LearningExperience;
