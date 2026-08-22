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
import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import { recordModelRun } from "./model-run";
import type { LectureProjectWithRelations, ReadinessItemJson } from "./types";

const MODEL = DEFAULT_AI_MODEL;

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

  const system = [
    "You are an expert university assessment designer specializing in MECHANISTIC questions.",
    "",
    "Generate one CLO-aligned conceptual readiness check. Return STRICT valid JSON only.",
    "",
    "RULES:",
    "1. The question MUST test MECHANISM understanding, not just recall.",
    "   BAD: 'What is recombinant cloning?'",
    "   GOOD: 'You cut both a plasmid and a DNA insert with the same restriction enzyme. The fragments have compatible sticky ends, but many transformed colonies contain empty vector. Which additional step most directly reduces this outcome?'",
    "",
    "2. Distractors must be PLAUSIBLE and represent REAL misconceptions students actually hold.",
    "   Each wrong option should reflect a common misunderstanding of the mechanism.",
    "",
    "3. The question stem should present a SPECIFIC SCENARIO with concrete details, not a vague abstract question.",
    "",
    "4. Exactly one option must be correct (isCorrect: true).",
    "",
    "5. Rationale must explain WHY the correct answer is correct AND WHY each wrong answer is wrong.",
    "",
    "6. Never generate questions like: 'Which statement accurately describes...?' or 'Which of the following is true?' — these are too generic.",
    "Instead: present a specific scenario and ask what would happen, why, or how to fix it.",
    "",
    "7. FORMULAS: When the question involves equations or formulas, use LaTeX notation:",
    "   - Inline: $F = ma$, $E = mc^2$, $\Delta G = -RT \ln K_{eq}$",
    "   - Explain variables: '$F$ is force (N), $m$ is mass (kg), $a$ is acceleration (m/s²)'",
    "   - For chemistry: $\text{CH}_3\text{COOH} + \text{NaOH} \rightarrow \text{CH}_3\text{COONa} + \text{H}_2\text{O}$",
    "   - NEVER write formulas as plain text — always use LaTeX $...$ notation"
  ].join("\n") + langInstruction;
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

  // Load what was actually TAUGHT in the slides (for validation)
  const latestArtifacts = await db.lectureSlideArtifact.findMany({
    where: { projectId: project.id },
    orderBy: [{ slideNo: "asc" }, { version: "desc" }],
  });
  const latestMap = new Map<number, typeof latestArtifacts[0]>();
  for (const a of latestArtifacts) {
    if (!latestMap.has(a.slideNo)) latestMap.set(a.slideNo, a);
  }
  const taughtContent = [...latestMap.values()].map((a) => {
    const c = a.contentJson as any;
    return `${c?.title || ""} ${(c?.body?.bullets || []).join(" ")}`;
  }).join(" ");

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
  const official = officialOutcomes[0];    const slotTasks = SLOTS.map(async (slot) => {
    const clo = cloForRange(slot.range);
    const block = blocks.find((b) => b.criticality === "critical") ?? blocks[0] ?? { text: project.title, id: "sb-1" };

    // CRITICAL: Pass taught content to the LLM so questions come from what was taught
    const taughtBlock = { text: `${block.text}\n\nWHAT WAS ACTUALLY TAUGHT IN THIS LESSON:\n${taughtContent.slice(0, 1500)}` };

    try {
      const { system, user } = promptFor(slot.label, clo, taughtBlock, project.nationalAlignmentMode, official, project.courseProfile.languagePolicy as string);
      const result = await chatJson({ system, user, temperature: 0.3, model: MODEL });
      await recordModelRun({ projectId: project.id, kind: "readiness", result });
      const json = result.json as Record<string, unknown> | null;
      if (json && (json as any).fallback !== true) {
        return normalizeItem(json, clo.id, block.id, project.nationalAlignmentMode, slot.slideNo);
      }
    } catch (e) {
      console.warn(`[readiness-generator] Slot S${slot.slideNo} LLM call failed, using normalized fallback`, e);
    }

    // Fallback item if LLM failed — use taught content for specificity
    const fallbackTitle = latestMap.get(slot.slideNo)?.contentJson?.title || clo.text;
    const fallbackBullets = (latestMap.get(slot.slideNo)?.contentJson?.body?.bullets || []).slice(0, 3);
    return normalizeItem(
      {
        stem: `Based on the lesson content about: ${fallbackTitle}. ${fallbackBullets[0] ? `The lesson explained that ${fallbackBullets[0].slice(0, 100)}.` : ""} Which of the following correctly describes this concept?`,
        options: [
          { id: "A", text: fallbackBullets[0] || "This is the correct understanding of the concept.", isCorrect: true },
          { id: "B", text: `This concept does not apply to ${clo.text}.`, isCorrect: false },
          { id: "C", text: `The mechanism works in reverse.`, isCorrect: false },
          { id: "D", text: `This is unrelated to the course material.`, isCorrect: false },
        ],
        difficulty: "medium",
        rationale: `This question tests understanding of: ${fallbackTitle}.`,
        misconception: "Confusing this concept with unrelated topics.",
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
