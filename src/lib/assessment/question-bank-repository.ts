/**
 * Employability Question Bank — Phase 1 storage API.
 *
 * Schema + repository only. Not wired into the exam, review gateways, or
 * publish routes yet. Correct answers (`correctIndex`) stay on the server
 * record; use `toPublicBankQuestion` (or the existing public-question-payload
 * sanitizer once exam wiring lands) before any client response.
 */
import "server-only";

import { createHash } from "crypto";
import {
  BankQuestionProvenance,
  BankQuestionStatus,
  type EmployabilityBankQuestion,
  type Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";

export { BankQuestionProvenance, BankQuestionStatus };

export type BankQuestionRecord = EmployabilityBankQuestion;

export type BankQuestionRubricCriterion = {
  criterion: string;
  weight: number;
  descriptor?: string;
  gate?: boolean;
};

export type CreateBankQuestionInput = {
  moduleCode: string;
  dimension: string;
  specialization?: string | null;
  title?: string | null;
  titleAr?: string | null;
  level?: string | null;
  framework?: string | null;
  focus?: string | null;
  estimateMinutes?: number | null;
  passThreshold?: number;
  scenario: string;
  instructions: string;
  /** Exactly 4 non-empty choice strings. */
  choices: [string, string, string, string] | string[];
  /** 0..3 — server-side only. */
  correctIndex: number;
  rubric: BankQuestionRubricCriterion[];
  provenance: BankQuestionProvenance;
  status?: BankQuestionStatus;
  aiModelUsed?: string | null;
  version?: number;
  /** Phase 5: auto-published AI content awaiting faculty review. */
  needsHumanReview?: boolean;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  reviewId?: string | null;
};

export type UpdateBankQuestionInput = Partial<
  Omit<CreateBankQuestionInput, "provenance">
> & {
  provenance?: BankQuestionProvenance;
  contentHash?: never;
};

export type ListBankQuestionsFilter = {
  moduleCode?: string;
  specialization?: string | null;
  /** When true with specialization undefined, only universal (null) rows. */
  universalOnly?: boolean;
  status?: BankQuestionStatus | BankQuestionStatus[];
  dimension?: string;
  provenance?: BankQuestionProvenance;
  /** Phase 5: filter auto-published / unreviewed AI rows. */
  needsHumanReview?: boolean;
  /**
   * Faculty review queue: status=in_review OR needsHumanReview=true
   * (auto-published still servable, but awaiting human confirm).
   */
  reviewQueue?: boolean;
  take?: number;
  skip?: number;
};

/** Candidate-safe view — omits correctIndex and other correctness fields. */
export type PublicBankQuestion = Omit<
  BankQuestionRecord,
  "correctIndex" | "reviewNotes"
> & {
  choices: string[];
  rubric: Array<{ criterion: string; weight: number }>;
};

function assertFourChoices(choices: string[]): asserts choices is [
  string,
  string,
  string,
  string,
] {
  const cleaned = choices.map((c) => String(c ?? "").trim()).filter(Boolean);
  if (cleaned.length !== 4) {
    throw new Error(
      `EmployabilityBankQuestion requires exactly 4 choices (got ${cleaned.length})`,
    );
  }
}

function assertCorrectIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error(
      `correctIndex must be an integer 0..3 (got ${String(index)})`,
    );
  }
}

/**
 * Canonical content hash for change detection.
 * Includes identity + scored content; excludes lifecycle / review metadata.
 */
export function computeBankQuestionContentHash(input: {
  moduleCode: string;
  specialization?: string | null;
  scenario: string;
  instructions: string;
  choices: string[];
  correctIndex: number;
  rubric: unknown;
}): string {
  const payload = JSON.stringify({
    moduleCode: input.moduleCode.trim(),
    specialization: input.specialization ?? null,
    scenario: input.scenario.trim(),
    instructions: input.instructions.trim(),
    choices: input.choices.map((c) => String(c).trim()),
    correctIndex: input.correctIndex,
    rubric: input.rubric,
  });
  return createHash("sha256").update(payload).digest("hex");
}

function parseChoicesJson(choicesJson: string): string[] {
  const parsed = JSON.parse(choicesJson) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((c) => String(c ?? ""));
}

function parseRubricJson(rubricJson: string): BankQuestionRubricCriterion[] {
  const parsed = JSON.parse(rubricJson) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      criterion: String(row.criterion ?? ""),
      weight: Number(row.weight ?? 0),
      ...(row.descriptor != null
        ? { descriptor: String(row.descriptor) }
        : {}),
      ...(row.gate === true ? { gate: true } : {}),
    };
  });
}

/** Strip server-only correctness; thin rubric for candidate-facing use. */
export function toPublicBankQuestion(
  record: BankQuestionRecord,
): PublicBankQuestion {
  const {
    correctIndex: _correctIndex,
    reviewNotes: _reviewNotes,
    ...rest
  } = record;
  return {
    ...rest,
    choices: parseChoicesJson(record.choicesJson),
    rubric: parseRubricJson(record.rubricJson).map((r) => ({
      criterion: r.criterion,
      weight: r.weight,
    })),
  };
}

function normalizeCreateInput(input: CreateBankQuestionInput): {
  data: Prisma.EmployabilityBankQuestionCreateInput;
  choices: string[];
  rubric: BankQuestionRubricCriterion[];
} {
  const choices = input.choices.map((c) => String(c ?? "").trim());
  assertFourChoices(choices);
  assertCorrectIndex(input.correctIndex);

  const rubric = input.rubric ?? [];
  const contentHash = computeBankQuestionContentHash({
    moduleCode: input.moduleCode,
    specialization: input.specialization,
    scenario: input.scenario,
    instructions: input.instructions,
    choices,
    correctIndex: input.correctIndex,
    rubric,
  });

  return {
    choices,
    rubric,
    data: {
      moduleCode: input.moduleCode.trim(),
      dimension: input.dimension.trim(),
      specialization:
        input.specialization == null || input.specialization === ""
          ? null
          : input.specialization.trim(),
      title: input.title ?? null,
      titleAr: input.titleAr ?? null,
      level: input.level ?? null,
      framework: input.framework ?? null,
      focus: input.focus ?? null,
      estimateMinutes: input.estimateMinutes ?? null,
      passThreshold: input.passThreshold ?? 70,
      scenario: input.scenario.trim(),
      instructions: input.instructions.trim(),
      choicesJson: JSON.stringify(choices),
      correctIndex: input.correctIndex,
      rubricJson: JSON.stringify(rubric),
      status: input.status ?? BankQuestionStatus.draft,
      provenance: input.provenance,
      contentHash,
      aiModelUsed: input.aiModelUsed ?? null,
      version: input.version ?? 1,
      needsHumanReview: input.needsHumanReview ?? false,
      reviewedBy: input.reviewedBy ?? null,
      reviewedAt: input.reviewedAt ?? null,
      reviewNotes: input.reviewNotes ?? null,
      reviewId: input.reviewId ?? null,
    },
  };
}

function buildListWhere(
  filter: ListBankQuestionsFilter = {},
): Prisma.EmployabilityBankQuestionWhereInput {
  const where: Prisma.EmployabilityBankQuestionWhereInput = {};

  if (filter.moduleCode) where.moduleCode = filter.moduleCode;
  if (filter.dimension) where.dimension = filter.dimension;
  if (filter.provenance) where.provenance = filter.provenance;

  if (filter.status) {
    where.status = Array.isArray(filter.status)
      ? { in: filter.status }
      : filter.status;
  }

  if (filter.needsHumanReview !== undefined) {
    where.needsHumanReview = filter.needsHumanReview;
  }

  if (filter.universalOnly) {
    where.specialization = null;
  } else if (filter.specialization !== undefined) {
    where.specialization = filter.specialization;
  }

  if (filter.reviewQueue) {
    // Union: classic in_review drafts + auto-published awaiting human confirm.
    const reviewOr: Prisma.EmployabilityBankQuestionWhereInput[] = [
      { status: BankQuestionStatus.in_review },
      { needsHumanReview: true },
    ];
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: reviewOr }];
  }

  return where;
}

export async function createBankQuestion(
  input: CreateBankQuestionInput,
): Promise<BankQuestionRecord> {
  const { data } = normalizeCreateInput(input);
  return db.employabilityBankQuestion.create({ data });
}

export async function getBankQuestionById(
  id: string,
): Promise<BankQuestionRecord | null> {
  return db.employabilityBankQuestion.findUnique({ where: { id } });
}

export async function updateBankQuestion(
  id: string,
  patch: UpdateBankQuestionInput,
): Promise<BankQuestionRecord> {
  const existing = await db.employabilityBankQuestion.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error(`EmployabilityBankQuestion not found: ${id}`);
  }

  const nextChoices =
    patch.choices != null
      ? patch.choices.map((c) => String(c ?? "").trim())
      : parseChoicesJson(existing.choicesJson);
  if (patch.choices != null) assertFourChoices(nextChoices);

  const nextCorrectIndex =
    patch.correctIndex != null ? patch.correctIndex : existing.correctIndex;
  if (patch.correctIndex != null) assertCorrectIndex(nextCorrectIndex);

  const nextRubric =
    patch.rubric != null ? patch.rubric : parseRubricJson(existing.rubricJson);

  const nextModuleCode = patch.moduleCode?.trim() ?? existing.moduleCode;
  const nextSpecialization =
    patch.specialization !== undefined
      ? patch.specialization == null || patch.specialization === ""
        ? null
        : patch.specialization.trim()
      : existing.specialization;
  const nextScenario =
    patch.scenario != null ? patch.scenario.trim() : existing.scenario;
  const nextInstructions =
    patch.instructions != null
      ? patch.instructions.trim()
      : existing.instructions;

  const contentHash = computeBankQuestionContentHash({
    moduleCode: nextModuleCode,
    specialization: nextSpecialization,
    scenario: nextScenario,
    instructions: nextInstructions,
    choices: nextChoices,
    correctIndex: nextCorrectIndex,
    rubric: nextRubric,
  });

  const data: Prisma.EmployabilityBankQuestionUpdateInput = {
    contentHash,
  };

  if (patch.moduleCode != null) data.moduleCode = nextModuleCode;
  if (patch.dimension != null) data.dimension = patch.dimension.trim();
  if (patch.specialization !== undefined) data.specialization = nextSpecialization;
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.titleAr !== undefined) data.titleAr = patch.titleAr;
  if (patch.level !== undefined) data.level = patch.level;
  if (patch.framework !== undefined) data.framework = patch.framework;
  if (patch.focus !== undefined) data.focus = patch.focus;
  if (patch.estimateMinutes !== undefined) {
    data.estimateMinutes = patch.estimateMinutes;
  }
  if (patch.passThreshold !== undefined) data.passThreshold = patch.passThreshold;
  if (patch.scenario != null) data.scenario = nextScenario;
  if (patch.instructions != null) data.instructions = nextInstructions;
  if (patch.choices != null) data.choicesJson = JSON.stringify(nextChoices);
  if (patch.correctIndex != null) data.correctIndex = nextCorrectIndex;
  if (patch.rubric != null) data.rubricJson = JSON.stringify(nextRubric);
  if (patch.status != null) data.status = patch.status;
  if (patch.provenance != null) data.provenance = patch.provenance;
  if (patch.aiModelUsed !== undefined) data.aiModelUsed = patch.aiModelUsed;
  if (patch.version != null) data.version = patch.version;
  if (patch.reviewedBy !== undefined) data.reviewedBy = patch.reviewedBy;
  if (patch.reviewedAt !== undefined) data.reviewedAt = patch.reviewedAt;
  if (patch.reviewNotes !== undefined) data.reviewNotes = patch.reviewNotes;
  if (patch.reviewId !== undefined) data.reviewId = patch.reviewId;
  if (patch.needsHumanReview !== undefined) {
    data.needsHumanReview = patch.needsHumanReview;
  }

  return db.employabilityBankQuestion.update({ where: { id }, data });
}

export async function listBankQuestions(
  filter: ListBankQuestionsFilter = {},
): Promise<BankQuestionRecord[]> {
  return db.employabilityBankQuestion.findMany({
    where: buildListWhere(filter),
    orderBy: [{ moduleCode: "asc" }, { version: "desc" }],
    take: filter.take,
    skip: filter.skip,
  });
}

/** Convenience: published (exam-ready) rows for a module, optional specialty. */
export async function listPublishedBankQuestions(opts: {
  moduleCode?: string;
  specialization?: string | null;
  universalOnly?: boolean;
  take?: number;
}): Promise<BankQuestionRecord[]> {
  return listBankQuestions({
    ...opts,
    status: BankQuestionStatus.published,
  });
}

export async function deleteBankQuestion(id: string): Promise<BankQuestionRecord> {
  return db.employabilityBankQuestion.delete({ where: { id } });
}

/** Lookup by natural key (moduleCode + specialization + version). */
export async function findBankQuestionByIdentity(opts: {
  moduleCode: string;
  specialization?: string | null;
  version?: number;
}): Promise<BankQuestionRecord | null> {
  const specialization =
    opts.specialization == null || opts.specialization === ""
      ? null
      : opts.specialization.trim();
  return db.employabilityBankQuestion.findFirst({
    where: {
      moduleCode: opts.moduleCode.trim(),
      specialization,
      version: opts.version ?? 1,
    },
  });
}

export type UpsertBankQuestionResult = {
  record: BankQuestionRecord;
  action: "created" | "updated" | "unchanged";
};

/**
 * Idempotent write keyed by moduleCode + specialization + version.
 * Same contentHash → no-op. Content change → update fields (preserves status).
 */
export async function upsertBankQuestionByIdentity(
  input: CreateBankQuestionInput,
): Promise<UpsertBankQuestionResult> {
  const version = input.version ?? 1;
  const choices = input.choices.map((c) => String(c ?? "").trim());
  assertFourChoices(choices);
  assertCorrectIndex(input.correctIndex);

  const specialization =
    input.specialization == null || input.specialization === ""
      ? null
      : input.specialization.trim();

  const contentHash = computeBankQuestionContentHash({
    moduleCode: input.moduleCode,
    specialization,
    scenario: input.scenario,
    instructions: input.instructions,
    choices,
    correctIndex: input.correctIndex,
    rubric: input.rubric,
  });

  const existing = await findBankQuestionByIdentity({
    moduleCode: input.moduleCode,
    specialization,
    version,
  });

  if (!existing) {
    return {
      record: await createBankQuestion({ ...input, version }),
      action: "created",
    };
  }

  if (existing.contentHash === contentHash) {
    return { record: existing, action: "unchanged" };
  }

  // Content changed — refresh storage fields; keep lifecycle status stable on re-seed
  // unless caller explicitly supplies status / needsHumanReview (Phase 5 signup).
  const record = await updateBankQuestion(existing.id, {
    moduleCode: input.moduleCode,
    dimension: input.dimension,
    specialization,
    title: input.title,
    titleAr: input.titleAr,
    level: input.level,
    framework: input.framework,
    focus: input.focus,
    estimateMinutes: input.estimateMinutes,
    passThreshold: input.passThreshold,
    scenario: input.scenario,
    instructions: input.instructions,
    choices,
    correctIndex: input.correctIndex,
    rubric: input.rubric,
    provenance: input.provenance,
    aiModelUsed: input.aiModelUsed,
    version,
    ...(input.status != null ? { status: input.status } : {}),
    ...(input.needsHumanReview !== undefined
      ? { needsHumanReview: input.needsHumanReview }
      : {}),
    ...(input.reviewNotes !== undefined
      ? { reviewNotes: input.reviewNotes }
      : {}),
  });

  return { record, action: "updated" };
}
