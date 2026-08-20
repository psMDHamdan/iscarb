/**
 * Employability Question Bank — Phase 3 lifecycle gateway (server-only).
 *
 * Governed transitions on EmployabilityBankQuestion.status. Does not wire the
 * exam. Reviewer payloads may include correctIndex; candidate payloads must
 * continue to use toPublicBankQuestion (stripped).
 */
import "server-only";

import {
  BankQuestionStatus,
  type BankQuestionRecord,
  type BankQuestionRubricCriterion,
  type UpdateBankQuestionInput,
  computeBankQuestionContentHash,
  getBankQuestionById,
  updateBankQuestion,
} from "@/lib/assessment/question-bank-repository";

export class BankLifecycleError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "BankLifecycleError";
    this.statusCode = statusCode;
  }
}

export type LifecycleAction =
  | "submit"
  | "approve"
  | "reject"
  | "publish"
  | "archive"
  | "edit";

/** Valid directed transitions (reject/archive are handled separately as fan-in). */
const TRANSITIONS: Record<
  LifecycleAction,
  Partial<Record<BankQuestionStatus, BankQuestionStatus>>
> = {
  submit: {
    [BankQuestionStatus.draft]: BankQuestionStatus.in_review,
    [BankQuestionStatus.rejected]: BankQuestionStatus.in_review,
    [BankQuestionStatus.archived]: BankQuestionStatus.in_review,
  },
  approve: {
    [BankQuestionStatus.in_review]: BankQuestionStatus.approved,
  },
  reject: {
    // Reject from reviewable / pre-publish states (not from archived)
    [BankQuestionStatus.draft]: BankQuestionStatus.rejected,
    [BankQuestionStatus.in_review]: BankQuestionStatus.rejected,
    [BankQuestionStatus.approved]: BankQuestionStatus.rejected,
    [BankQuestionStatus.published]: BankQuestionStatus.rejected,
  },
  publish: {
    [BankQuestionStatus.approved]: BankQuestionStatus.published,
  },
  archive: {
    [BankQuestionStatus.draft]: BankQuestionStatus.archived,
    [BankQuestionStatus.in_review]: BankQuestionStatus.archived,
    [BankQuestionStatus.approved]: BankQuestionStatus.archived,
    [BankQuestionStatus.published]: BankQuestionStatus.archived,
    [BankQuestionStatus.rejected]: BankQuestionStatus.archived,
  },
  edit: {}, // content edit has its own policy
};

const CONTENT_PATCH_KEYS = [
  "scenario",
  "instructions",
  "choices",
  "correctIndex",
  "rubric",
  "moduleCode",
  "dimension",
  "specialization",
  "title",
  "titleAr",
  "level",
  "framework",
  "focus",
  "estimateMinutes",
  "passThreshold",
  "provenance",
  "aiModelUsed",
] as const;

type ContentPatchKey = (typeof CONTENT_PATCH_KEYS)[number];

export type ReviewerBankQuestion = BankQuestionRecord & {
  choices: string[];
  rubric: BankQuestionRubricCriterion[];
  lifecycleLog: LifecycleLogEntry[];
};

export type LifecycleLogEntry = {
  at: string;
  by: string;
  action: LifecycleAction | string;
  from: BankQuestionStatus | string;
  to: BankQuestionStatus | string;
  notes?: string;
};

const LIFECYCLE_PREFIX = "@@lifecycle@@";

function parseLifecycleLog(reviewNotes: string | null): {
  log: LifecycleLogEntry[];
  humanNotes: string;
} {
  if (!reviewNotes) return { log: [], humanNotes: "" };
  const lines = reviewNotes.split("\n");
  const log: LifecycleLogEntry[] = [];
  const human: string[] = [];
  for (const line of lines) {
    if (line.startsWith(LIFECYCLE_PREFIX)) {
      try {
        log.push(
          JSON.parse(line.slice(LIFECYCLE_PREFIX.length)) as LifecycleLogEntry,
        );
      } catch {
        human.push(line);
      }
    } else if (line.length) {
      human.push(line);
    }
  }
  return { log, humanNotes: human.join("\n") };
}

function serializeReviewNotes(
  log: LifecycleLogEntry[],
  humanNotes: string,
): string {
  const logLines = log.map((e) => `${LIFECYCLE_PREFIX}${JSON.stringify(e)}`);
  return [...logLines, humanNotes.trim()].filter(Boolean).join("\n");
}

function appendLifecycle(
  existingNotes: string | null,
  entry: LifecycleLogEntry,
  extraHumanNotes?: string | null,
): string {
  const { log, humanNotes } = parseLifecycleLog(existingNotes);
  log.push(entry);
  const mergedHuman = [humanNotes, extraHumanNotes?.trim()]
    .filter(Boolean)
    .join("\n");
  return serializeReviewNotes(log, mergedHuman);
}

function assertTransition(
  action: LifecycleAction,
  from: BankQuestionStatus,
): BankQuestionStatus {
  const map = TRANSITIONS[action];
  const to = map[from];
  if (!to) {
    throw new BankLifecycleError(
      `Invalid transition: cannot ${action} from status "${from}"`,
      400,
    );
  }
  return to;
}

function parseChoices(choicesJson: string): string[] {
  const parsed = JSON.parse(choicesJson) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((c) => String(c ?? ""));
}

function parseRubric(rubricJson: string): BankQuestionRubricCriterion[] {
  const parsed = JSON.parse(rubricJson) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      criterion: String(row.criterion ?? ""),
      weight: Number(row.weight ?? 0),
      ...(row.descriptor != null ? { descriptor: String(row.descriptor) } : {}),
      ...(row.gate === true ? { gate: true } : {}),
    };
  });
}

/** Full record for authorized reviewers — includes correctIndex + descriptors. */
export function toReviewerBankQuestion(
  record: BankQuestionRecord,
): ReviewerBankQuestion {
  const { log } = parseLifecycleLog(record.reviewNotes);
  return {
    ...record,
    choices: parseChoices(record.choicesJson),
    rubric: parseRubric(record.rubricJson),
    lifecycleLog: log,
  };
}

async function loadOrThrow(id: string): Promise<BankQuestionRecord> {
  const row = await getBankQuestionById(id);
  if (!row) throw new BankLifecycleError(`Question not found: ${id}`, 404);
  return row;
}

export async function submitBankQuestionForReview(
  id: string,
  actorUserId: string,
): Promise<BankQuestionRecord> {
  const row = await loadOrThrow(id);
  const to = assertTransition("submit", row.status);
  const notes = appendLifecycle(row.reviewNotes, {
    at: new Date().toISOString(),
    by: actorUserId,
    action: "submit",
    from: row.status,
    to,
  });
  return updateBankQuestion(id, {
    status: to,
    reviewedBy: actorUserId,
    reviewedAt: new Date(),
    reviewNotes: notes,
  });
}

export async function approveBankQuestion(
  id: string,
  actorUserId: string,
  reviewNotes?: string | null,
): Promise<BankQuestionRecord> {
  const row = await loadOrThrow(id);

  // Phase 5: human confirms auto-published AI Job-Fit — stay published, clear flag.
  if (
    row.status === BankQuestionStatus.published &&
    row.needsHumanReview
  ) {
    const notes = appendLifecycle(
      row.reviewNotes,
      {
        at: new Date().toISOString(),
        by: actorUserId,
        action: "approve",
        from: row.status,
        to: BankQuestionStatus.published,
        notes: reviewNotes ?? "Human confirmed auto-published Job-Fit",
      },
      reviewNotes,
    );
    return updateBankQuestion(id, {
      needsHumanReview: false,
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });
  }

  const to = assertTransition("approve", row.status);
  const notes = appendLifecycle(
    row.reviewNotes,
    {
      at: new Date().toISOString(),
      by: actorUserId,
      action: "approve",
      from: row.status,
      to,
      notes: reviewNotes ?? undefined,
    },
    reviewNotes,
  );
  return updateBankQuestion(id, {
    status: to,
    needsHumanReview: false,
    reviewedBy: actorUserId,
    reviewedAt: new Date(),
    reviewNotes: notes,
  });
}

export async function rejectBankQuestion(
  id: string,
  actorUserId: string,
  reason: string,
): Promise<BankQuestionRecord> {
  const trimmed = reason?.trim();
  if (!trimmed) {
    throw new BankLifecycleError("Rejection reason is required", 400);
  }
  const row = await loadOrThrow(id);
  const to = assertTransition("reject", row.status);
  const notes = appendLifecycle(
    row.reviewNotes,
    {
      at: new Date().toISOString(),
      by: actorUserId,
      action: "reject",
      from: row.status,
      to,
      notes: trimmed,
    },
    `Rejection: ${trimmed}`,
  );
  return updateBankQuestion(id, {
    status: to,
    reviewedBy: actorUserId,
    reviewedAt: new Date(),
    reviewNotes: notes,
    // Rejected content must leave the exam serve set and review flag.
    needsHumanReview: false,
  });
}

export async function publishBankQuestion(
  id: string,
  actorUserId: string,
): Promise<BankQuestionRecord> {
  const row = await loadOrThrow(id);
  const to = assertTransition("publish", row.status);
  const notes = appendLifecycle(row.reviewNotes, {
    at: new Date().toISOString(),
    by: actorUserId,
    action: "publish",
    from: row.status,
    to,
  });
  return updateBankQuestion(id, {
    status: to,
    needsHumanReview: false,
    reviewedBy: actorUserId,
    reviewedAt: new Date(),
    reviewNotes: notes,
  });
}

export async function archiveBankQuestion(
  id: string,
  actorUserId: string,
  reason?: string | null,
): Promise<BankQuestionRecord> {
  const row = await loadOrThrow(id);
  const to = assertTransition("archive", row.status);
  const notes = appendLifecycle(
    row.reviewNotes,
    {
      at: new Date().toISOString(),
      by: actorUserId,
      action: "archive",
      from: row.status,
      to,
      notes: reason ?? undefined,
    },
    reason ? `Archive: ${reason}` : null,
  );
  return updateBankQuestion(id, {
    status: to,
    reviewedBy: actorUserId,
    reviewedAt: new Date(),
    reviewNotes: notes,
  });
}

/**
 * Re-review policy on content edit:
 * - If status is approved or published and content changes → reset to in_review
 *   (must be re-approved before publish / re-publish).
 * - draft / in_review / rejected / archived: content may change; status unchanged
 *   (archived/rejected still need submit to re-enter review).
 */
export async function editBankQuestionContent(
  id: string,
  actorUserId: string,
  patch: Pick<UpdateBankQuestionInput, ContentPatchKey>,
): Promise<{ record: BankQuestionRecord; rereviewRequired: boolean }> {
  const row = await loadOrThrow(id);

  const hasContentChange = CONTENT_PATCH_KEYS.some(
    (k) => patch[k] !== undefined,
  );
  if (!hasContentChange) {
    throw new BankLifecycleError("No editable content fields provided", 400);
  }

  // Preview next hash to detect no-op content updates
  const nextChoices =
    patch.choices != null
      ? patch.choices.map((c) => String(c ?? "").trim())
      : parseChoices(row.choicesJson);
  const nextCorrect =
    patch.correctIndex != null ? patch.correctIndex : row.correctIndex;
  const nextRubric =
    patch.rubric != null ? patch.rubric : parseRubric(row.rubricJson);
  const nextScenario =
    patch.scenario != null ? patch.scenario.trim() : row.scenario;
  const nextInstructions =
    patch.instructions != null ? patch.instructions.trim() : row.instructions;
  const nextModuleCode = patch.moduleCode?.trim() ?? row.moduleCode;
  const nextSpec =
    patch.specialization !== undefined
      ? patch.specialization == null || patch.specialization === ""
        ? null
        : patch.specialization.trim()
      : row.specialization;

  const nextHash = computeBankQuestionContentHash({
    moduleCode: nextModuleCode,
    specialization: nextSpec,
    scenario: nextScenario,
    instructions: nextInstructions,
    choices: nextChoices,
    correctIndex: nextCorrect,
    rubric: nextRubric,
  });

  const contentActuallyChanged = nextHash !== row.contentHash;
  const rereviewRequired =
    contentActuallyChanged &&
    (row.status === BankQuestionStatus.approved ||
      row.status === BankQuestionStatus.published);

  const nextStatus = rereviewRequired
    ? BankQuestionStatus.in_review
    : row.status;

  const notes = contentActuallyChanged
    ? appendLifecycle(row.reviewNotes, {
        at: new Date().toISOString(),
        by: actorUserId,
        action: "edit",
        from: row.status,
        to: nextStatus,
        notes: rereviewRequired
          ? "Content changed; returned to in_review for re-approval"
          : "Content updated",
      })
    : row.reviewNotes;

  const record = await updateBankQuestion(id, {
    ...patch,
    status: nextStatus,
    reviewedBy: actorUserId,
    reviewedAt: new Date(),
    reviewNotes: notes ?? undefined,
    ...(rereviewRequired ? { needsHumanReview: true } : {}),
  });

  return { record, rereviewRequired };
}
