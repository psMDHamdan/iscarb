/**
 * Lecture Generation — readiness items (TASK-04 §F, FR-019, AC-21).
 * ===========================================================================
 * Exactly 4 readiness checks per lecture: item 1 mapped to a foundation CLO
 * (S5–8), item 2 to a deep-dive CLO (S9–13), item 3 to an application CLO
 * (S14–17), and item 4 the final gate on S20. Each item has 4 options with
 * exactly one correct answer, a difficulty, rationale, and misconception tag.
 * In OFFICIAL_JAHEZIAH mode a sourceLocator (SKU/SLO) is added.
 */
import { db } from "@/lib/db";
import { chatJson } from "@/lib/ai-engine";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import { recordModelRun } from "./model-run";
import type { LectureProjectWithRelations, ReadinessItemJson } from "./types";

const MODEL = "gpt-4o";

/** Fetch accepted alignment links for OFFICIAL_JAHEZIAH mode. */
async function fetchOfficialOutcomes(projectId: string): Promise<{ outcomeId: string; outcomeText: string; sourceLocator: string }[]> {
  const links = await db.lectureAlignmentLink.findMany({
    where: { projectId, decision: "accepted" },
    select: { standardOutcomeId: true, sourceLocator: true, rationale: true },
  });
  return links.map((l) => ({
    outcomeId: l.standardOutcomeId ?? "",
    outcomeText: l.rationale ?? l.sourceLocator ?? "",
    sourceLocator: l.sourceLocator ?? "",
  }));
}

/** Ordered readiness slots: slide range → target slide (first of the range). */
const SLOTS: { label: string; slideNo: number; range: [number, number] }[] = [
  { label: "foundation (slides 5–8)", slideNo: 5, range: [5, 8] },
  { label: "deep-dive (slides 9–13)", slideNo: 9, range: [9, 13] },
  { label: "application (slides 14–17)", slideNo: 14, range: [14, 17] },
];

function promptFor(
  label: string,
  clo: CourseLearningOutcome,
  block: { text: string },
  mode: string,
  official: { outcomeId?: string; outcomeText?: string; sourceLocator?: string } = {},
  languagePolicy: string = "en"
): { system: string; user: string } {
  const langInstruction =
    languagePolicy === "ar"
      ? "\nGenerate ALL output in Arabic. Use dir=\"rtl\" conventions."
      : languagePolicy === "bilingual"
        ? "\nGenerate output in English AND Arabic."
        : "";

  const system =
    "You are an expert university assessment designer. Generate one CLO-aligned conceptual readiness check. Return STRICT valid JSON only. Exactly one option must be correct (isCorrect: true). Ensure questions test deep comprehension, not just basic recall." + langInstruction;
  const user = [
    `Generate one CLO-aligned readiness check for ${label}:`,
    `Course Learning Outcome: ${clo.number}: ${clo.text}`,
    `Source concept context: ${block.text.slice(0, 300)}`,
    `Alignment mode: ${mode}`,
    mode === "OFFICIAL_JAHEZIAH" && official.outcomeId ? `Official standard outcome: ${official.outcomeId} — ${official.outcomeText ?? ""}.` : "",
    "",
    "Return JSON format:",
    '{',
    '  "stem": "Which statement accurately describes...?",',
    '  "options": [',
    '    { "id": "A", "text": "Valid scientific mechanism...", "isCorrect": true },',
    '    { "id": "B", "text": "Common misconception option...", "isCorrect": false },',
    '    { "id": "C", "text": "Plausible but incorrect option...", "isCorrect": false },',
    '    { "id": "D", "text": "Incorrect alternative...", "isCorrect": false }',
    '  ],',
    '  "difficulty": "medium",',
    '  "rationale": "Clear pedagogical explanation of the correct choice...",',
    '  "misconception": "Why students often choose option B or C..."',
    '}'
  ].filter(Boolean).join("\n");
  return { system, user };
}

function normalizeItem(
  raw: Record<string, unknown>,
  cloId: string,
  blockId: string,
  mode: string,
  slideNo: number
): ReadinessItemJson {
  const options = Array.isArray(raw.options)
    ? raw.options.slice(0, 4).map((o: any, i: number) => ({
        id: String.fromCharCode(65 + i),
        text: typeof o === "string" ? o : typeof o?.text === "string" ? o.text : `Option ${i + 1}`,
        isCorrect: typeof o === "object" && o !== null ? Boolean(o.isCorrect) : i === 0,
      }))
    : [
        { id: "A", text: "Primary theoretical principle", isCorrect: true },
        { id: "B", text: "Secondary misconception", isCorrect: false },
        { id: "C", text: "Alternative hypothesis", isCorrect: false },
        { id: "D", text: "Inconclusive deduction", isCorrect: false },
      ];

  let idx = options.findIndex((o) => o.isCorrect);
  if (idx < 0) {
    options[0].isCorrect = true;
    idx = 0;
  }

  return {
    stem: typeof raw.stem === "string" && raw.stem.trim().length > 5 ? raw.stem : `Which mechanism best governs the principles taught in Slide ${slideNo}?`,
    options,
    correctIndex: idx >= 0 ? idx : 0,
    difficulty: ["easy", "medium", "hard"].includes(raw.difficulty as any) ? (raw.difficulty as any) : "medium",
    rationale: typeof raw.rationale === "string" ? raw.rationale : "Core theoretical foundation established in course learning outcomes.",
    misconception: typeof raw.misconception === "string" ? raw.misconception : undefined,
    sourceLocator: mode === "OFFICIAL_JAHEZIAH" ? (typeof raw.sourceLocator === "string" ? raw.sourceLocator : undefined) : undefined,
    cloId,
    sourceBlockId: blockId,
    slideNo,
  };
}

/**
 * Generate the 4 readiness items.
 */
export async function generateReadinessItems(project: LectureProjectWithRelations): Promise<ReadinessItemJson[]> {
  const clos = (project.courseProfile.teacherEnteredClos as unknown as CourseLearningOutcome[]) ?? [];
  const blocks = project.sourceBlocks || [];
  if (clos.length === 0) return [];

  const slidePlans = await db.lectureSlidePlan.findMany({
    where: { projectId: project.id },
    select: { slideNo: true, cloIds: true },
  });

  const cloForRange = (range: [number, number]): CourseLearningOutcome => {
    const usedIds = slidePlans
      .filter((s) => s.slideNo >= range[0] && s.slideNo <= range[1])
      .flatMap((s) => s.cloIds);
    const used = clos.find((c) => usedIds.includes(c.id));
    return used ?? clos[0];
  };

  const items: ReadinessItemJson[] = [];
  const officialOutcomes = project.nationalAlignmentMode === "OFFICIAL_JAHEZIAH"
    ? await fetchOfficialOutcomes(project.id)
    : [];

  // Generate all 4 checks concurrently — independent LLM calls, each with a
  // deterministic fallback — so readiness finishes in ~1 call latency instead
  // of 4 sequential round-trips.
  const gateClo = clos[clos.length - 1] || clos[0];
  const block0 = blocks[0] ?? { text: project.title, id: "sb-1" };
  const official = officialOutcomes[0];

  const slotTasks = SLOTS.map(async (slot) => {
    const clo = cloForRange(slot.range);
    const block = blocks.find((b) => b.criticality === "critical") ?? blocks[0] ?? { text: project.title, id: "sb-1" };

    try {
      const { system, user } = promptFor(slot.label, clo, block, project.nationalAlignmentMode, official, project.courseProfile.languagePolicy as string);
      const result = await chatJson({ system, user, temperature: 0.3, model: MODEL });
      await recordModelRun({ projectId: project.id, kind: "readiness", result });
      const json = result.json as Record<string, unknown> | null;
      if (json && (json as any).fallback !== true) {
        return normalizeItem(json, clo.id, block.id, project.nationalAlignmentMode, slot.slideNo);
      }
    } catch (e) {
      console.warn(`[readiness-generator] Slot S${slot.slideNo} LLM call failed, using normalized fallback`, e);
    }

    // Fallback item if LLM failed
    return normalizeItem(
      {
        stem: `Which statement accurately identifies the core principle of ${clo.text}?`,
        options: [
          { id: "A", text: "The foundational framework aligns with verified academic theory.", isCorrect: true },
          { id: "B", text: "The phenomenon occurs randomly without governing laws.", isCorrect: false },
          { id: "C", text: "The concept contradicts empirical observation.", isCorrect: false },
          { id: "D", text: "The interaction depends entirely on extraneous noise.", isCorrect: false },
        ],
        difficulty: "medium",
        rationale: `Understanding ${clo.number} requires mastery of the validated mechanisms.`,
        misconception: "Assuming passive unguided progression.",
      },
      clo.id,
      block.id,
      project.nationalAlignmentMode,
      slot.slideNo
    );
  });

  // Item 4 — final gate on S20
  const gateTask = (async () => {
    try {
      const { system, user } = promptFor("Gate 20 Final Milestone", gateClo, block0, project.nationalAlignmentMode, official, project.courseProfile.languagePolicy as string);
      const result = await chatJson({ system, user, temperature: 0.3, model: MODEL });
      await recordModelRun({ projectId: project.id, kind: "readiness", result });
      const json = result.json as Record<string, unknown> | null;
      if (json && (json as any).fallback !== true) {
        return normalizeItem(json, gateClo.id, block0.id, project.nationalAlignmentMode, 20);
      }
    } catch (e) {
      console.warn("[readiness-generator] Gate S20 LLM call failed, using normalized fallback", e);
    }

    return normalizeItem(
      {
        stem: `In the comprehensive synthesis of ${project.title}, how are key outcomes validated?`,
        options: [
          { id: "A", text: "By rigorous quantitative evaluation and systemic modeling.", isCorrect: true },
          { id: "B", text: "By subjective intuition without empirical verification.", isCorrect: false },
          { id: "C", text: "By isolating components from their environmental matrix.", isCorrect: false },
          { id: "D", text: "By ignoring boundary constraints and conservation theorems.", isCorrect: false },
        ],
        difficulty: "hard",
        rationale: "Comprehensive mastery integrates theoretical deduction with experimental standards.",
        misconception: "Overlooking systematic boundary constraints.",
      },
      gateClo.id,
      block0.id,
      project.nationalAlignmentMode,
      20
    );
  })();

  items.push(...(await Promise.all([...slotTasks, gateTask])));
  return items;
}
