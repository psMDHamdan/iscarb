/**
 * Lecture Planning — S1–S20 plan generation worker.
 * ===========================================================================
 * Given a project with approved CLOs and parsed source blocks, calls chatJson
 * (ai-engine) to produce a 20-slide iSCARB plan, validates it against the
 * §7.1 slot contract, then persists it with regeneration-aware merging:
 *
 *   preserved = approved | faculty-edited (updatedAt>createdAt) | fixed slots
 *   replaced  = untouched slides from the freshly generated plan
 *
 * Progress is published to Redis at `lecture:plan:{projectId}` so the POST
 * /plan endpoint can report job status. Failures set project.status="failed"
 * and the job error — never silent.
 */
import { db } from "@/lib/db";
import { redis } from "@/config/redis";
import { chatJson } from "@/lib/ai-engine";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import { validatePlanStructure, FIXED_SLOTS, FIXED_SLOT_FUNCTION } from "./plan-validator";
import { bindUnmappedSourceBlocks } from "@/lib/lecture/generation/persist-handoffs";
import { cleanJargon } from "@/lib/lecture/projections/utils/jargon-cleaner";

const JOB_PREFIX = "lecture:plan:";

export function planJobKey(projectId: string): string {
  return `${JOB_PREFIX}${projectId}`;
}

async function setProgress(projectId: string, data: { status: string; progress: number; error?: string }): Promise<void> {
  try {
    await redis.hset(planJobKey(projectId), data);
  } catch {
    // Redis unavailable (e.g. Vercel without Redis) — plan still works,
    // just without live progress polling.
  }
}

export interface AiSlide {
  slideNo: number;
  function: string;
  title: string;
  cloIds: string[];
  sourceBlockIds: string[];
  interactionType: string | null;
  visualIntent?: string;
}

export interface PlanIdClo {
  id: string;
  number: string;
}

export interface PlanIdBlock {
  id: string;
  locator: string;
}

/** Alias keys a model might emit for a faculty CLO number (CLO1, CLO-1, 1). */
export function cloAliasKeys(number: string): string[] {
  const raw = String(number ?? "").trim();
  if (!raw) return [];
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const digitsMatch = compact.match(/(\d+)$/);
  const digits = digitsMatch ? digitsMatch[1] : "";
  const keys = new Set<string>([raw, raw.toUpperCase(), compact, compact.toLowerCase()]);
  if (digits) {
    keys.add(digits);
    keys.add(`CLO${digits}`);
    keys.add(`CLO-${digits}`);
    keys.add(`clo${digits}`);
    keys.add(`clo-${digits}`);
  }
  return [...keys];
}

function uniqueKeepOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function buildCloAliasMap(clos: PlanIdClo[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const clo of clos) {
    if (!clo?.id) continue;
    if (!map.has(clo.id)) map.set(clo.id, clo.id);
    for (const key of cloAliasKeys(clo.number)) {
      if (!map.has(key)) map.set(key, clo.id);
    }
  }
  return map;
}

function buildBlockAliasMap(blocks: PlanIdBlock[]): Map<string, string> {
  const map = new Map<string, string>();
  blocks.forEach((block, index) => {
    if (!block?.id) return;
    if (!map.has(block.id)) map.set(block.id, block.id);
    const locator = String(block.locator ?? "").trim();
    if (locator && !map.has(locator)) map.set(locator, block.id);
    const indexKey = String(index + 1);
    if (!map.has(indexKey)) map.set(indexKey, block.id);
  });
  return map;
}

/**
 * Map model-emitted cloIds / sourceBlockIds onto real Prisma CUIDs.
 * Exact ids, CLO number aliases, 1-based block index, and locators resolve;
 * unknown tokens (e.g. JAH-CS-101) are dropped — never persisted.
 */
export function remapPlanIds<T extends { cloIds: string[]; sourceBlockIds: string[] }>(
  slides: T[],
  clos: PlanIdClo[],
  blocks: PlanIdBlock[],
): T[] {
  const cloMap = buildCloAliasMap(clos);
  const blockMap = buildBlockAliasMap(blocks);
  return slides.map((slide) => ({
    ...slide,
    cloIds: uniqueKeepOrder(
      (slide.cloIds ?? []).map((token) => cloMap.get(String(token).trim()) ?? "").filter(Boolean),
    ),
    sourceBlockIds: uniqueKeepOrder(
      (slide.sourceBlockIds ?? []).map((token) => blockMap.get(String(token).trim()) ?? "").filter(Boolean),
    ),
  }));
}

export function buildPlanPrompt(
  blocks: { id: string; locator: string; criticality: string; text: string }[],
  selectedClos: CourseLearningOutcome[],
  course: { courseCode: string; title: string; specialty: string; projectTitle?: string; languagePolicy?: string }
): { system: string; user: string } {
  const topic = course.projectTitle || course.title;
  const langInstruction =
    course.languagePolicy === "ar"
      ? "\nGenerate ALL output in Arabic (including slide titles). Use dir=\"rtl\" conventions."
      : course.languagePolicy === "bilingual"
        ? "\nGenerate slide titles in Arabic."
        : "";

  const system = [
    "You are a world-class academic educational designer producing a 20-slide learning plan.",
    `Your job is to produce EXACTLY a 20-slide plan for the lecture topic: "${topic}".`,
    `DISCIPLINE & SPECIALTY: "${course.specialty || "General Academic"}".`,
    "",
    "DOMAIN-SPECIFIC DESIGN RULES:",
    "- COMPUTER SCIENCE & SOFTWARE: Focus on systemic trade-offs, architecture, Big-O complexity $O(N \\log N)$, algorithms, and security threat models.",
    "- MATHEMATICS & STATISTICS: Use rigorous formula derivations $\\sum_{i=1}^n x_i$, theorems, distributions, and step-by-step worked calculations.",
    "- PHYSICS: Apply fundamental physical laws $F = m a$, conservation equations, vector diagrams, and quantitative problem solving.",
    "- ENGINEERING: Focus on transfer functions $H(s)$, stress-strain relationships $\\sigma = E \\cdot \\epsilon$, load analysis, and design constraints.",
    "- BIOLOGY & LIFE SCIENCES: Focus on biochemical pathways, reaction rates $\\frac{d[P]}{dt}$, enzyme kinetics, and molecular mechanisms.",
    "- CHEMISTRY: Support chemical equations via \\ce{} notation, equilibrium, stoichiometry, and molecular mechanisms.",
    "- BUSINESS & MANAGEMENT: Focus on frameworks, decision models, case analysis, and quantitative metrics.",
    "- LATEX MATH FORMATTING: Format mathematical formulas in standard LaTeX math syntax ($...$ inline or $$...$$ block).",
    "",
    "SOURCE FIDELITY — HARD RULES:",
    "1. NEVER invent scientific numbers, percentages, experimental results, mechanisms, citations, references, product specifications, protocol conditions, clinical outcomes, or safety claims.",
    "2. If the source does not provide a value, do NOT fill it from model memory. State: 'Value from source material.'",
    "3. Every factual claim must be classifiable as: SOURCE_FACT | PEDAGOGICAL_PARAPHRASE | INFERRED | UNSUPPORTED.",
    "4. Only SOURCE_FACT and PEDAGOGICAL_PARAPHRASE may enter student-facing content.",
    "",
    "STUDENT-FACING LANGUAGE — HARD RULES:",
    "5. FORBIDDEN IN TITLES: Problem Context:, Mental Model:, Core Principle:, Key Requirement:, Application Context:, Evidence of Mastery:, H-Stack Architecture:, Foundation:, Deep Dive:, Worked Example:, Scenario Visual:, Pedagogical Role:, Bloom Level:, Generation Stage:, Source Block:, iSCARB Framework:, Learning Compiler:, Domain Spine:, Trade-offs:.",
    "6. Slide titles MUST be direct, natural, student-facing academic headers describing what is taught.",
    "7. Use natural language: 'Why does this matter?', 'How does it work?', 'What changes if...?', 'Try it yourself', 'Compare these two cases', 'Can you predict the outcome?'",
    "",
    "GROUNDING & SLOT CONTRACT RULES:",
    "8. Derive all slide titles and plans STRICTLY from the provided SOURCE BLOCKS and faculty CLOs.",
    "9. Maintain the fixed S1–S20 progression. Do NOT alter mandatory slot functions.",
    "10. COPY faculty CLO text verbatim into S3 — do NOT rewrite or summarize CLOs.",
    "11. cloIds and sourceBlockIds MUST be the exact id= values from the provided lists below.",
    "12. Return STRICT JSON only.",
    langInstruction
  ].join("\n");

  const user = [
    `TARGET LECTURE TOPIC: ${topic}`,
    `COURSE CODE: ${course.courseCode}`,
    `SPECIALTY: ${course.specialty}`,
    "",
    `SOURCE BLOCKS (${blocks.length} blocks):`,
    blocks.map((b) => `id=${b.id} locator=${b.locator} (${b.criticality}): ${b.text.slice(0, 350)}`).join("\n"),
    "",
    "COURSE CLOs (faculty-entered, do not alter):",
    selectedClos.map((c) => `id=${c.id} number=${c.number}: ${c.text} [Bloom: ${c.bloomLevel}]`).join("\n"),
    "",
    `Generate a 20-slide iSCARB plan specifically for "${topic}". For each slide return:`,
    '{',
    '  "slideNo": 1-20,',
    '  "title": "...",',
    '  "learningObjective": "...",',
    '  "cloIds": ["..."],           // copy exact id= from COURSE CLOs',
    '  "sourceBlockIds": ["..."],   // copy exact id= from SOURCE BLOCKS',
    '  "interactionType": "poll|pause_discuss|collaboration|practice|worked_example|null",',
    '  "visualIntent": "..."',
    "}",
    "",
    "MANDATORY S1–S20 SLOT CONTRACT:",
    "S1: hook_question (One high-stakes question, tension, or real-world problem)",
    "S2: simple_explanation (Domain spine or overview)",
    "S3: clos (Verbatim faculty CLOs — do NOT alter text)",
    "S4: analogy or simple_explanation (Prior knowledge connection)",
    "S5-S7: labeled_diagram, process_steps, comparison, or simple_explanation (Core concepts)",
    "S8: misconception_challenge (MANDATORY: 'Why Simple X Lies' - correct misconceptions)",
    "S9: worked_example or calculation (MANDATORY: Step-by-step)",
    "S10-S12: concept_map, comparison, or process_steps (Deep dive into mechanisms)",
    "S13: comparison (Systemic trade-offs and parameter balancing)",
    "S14-S15: case_study, prediction, or application (Real-world domain application)",
    "S16: interactive_activity (Collaborative workshop or scenario exercise)",
    "S17: application (Saudi/local career context + practice problems)",
    "S18: rubric (Four performance levels with observable criteria)",
    "S19: evidence (Triangulation: product, process, and oral explanation)",
    "S20: readiness (Final readiness gate, score, and exit ticket)",
    "",
    "- Interaction Quotas: At least 3 pause_discuss, at least 2 polls, at least 1 collaboration, at least 1 worked_example.",
    "- Total: exactly 20 slides.",
  ].join("\n");

  return { system, user };
}

export function extractSlideArray(json: unknown): any[] {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== "object") return [];
  const obj = json as Record<string, any>;
  if (Array.isArray(obj.slides)) return obj.slides;
  if (obj.slides && typeof obj.slides === "object") {
    const vals = Object.values(obj.slides);
    if (vals.length > 0 && vals.some((v) => v && typeof v === "object")) return vals;
  }
  const values = Object.values(obj);
  if (values.length > 0 && values.some((v) => v && typeof v === "object" && ("title" in v || "slideNo" in v || "cloIds" in v))) {
    return values;
  }
  return [];
}

export function sanitizeAiSlides(json: unknown): AiSlide[] {
  const raw = extractSlideArray(json);
  const list: AiSlide[] = raw.map((s: any, i: number) => ({
    slideNo: typeof s?.slideNo === "number" ? s.slideNo : i + 1,
    function: typeof s?.function === "string" ? s.function : "foundation",
    title: cleanJargon(typeof s?.title === "string" && s.title.trim() ? s.title.trim() : `Slide ${i + 1}`),
    cloIds: Array.isArray(s?.cloIds) ? s.cloIds.map(String) : [],
    sourceBlockIds: Array.isArray(s?.sourceBlockIds) ? s.sourceBlockIds.map(String) : [],
    interactionType: typeof s?.interactionType === "string" && s.interactionType !== "null" ? s.interactionType : null,
    visualIntent: typeof s?.visualIntent === "string" ? s.visualIntent : undefined,
  }));

  const slidesByNo = new Map<number, AiSlide>();
  list.forEach((s) => {
    if (s.slideNo >= 1 && s.slideNo <= 20) slidesByNo.set(s.slideNo, s);
  });

  const result: AiSlide[] = [];
  for (let n = 1; n <= 20; n++) {
    const existing = slidesByNo.get(n);
    let fn = existing?.function ?? "foundation";
    if (n in FIXED_SLOT_FUNCTION) fn = FIXED_SLOT_FUNCTION[n];

    result.push({
      slideNo: n,
      function: fn,
      title: cleanJargon(existing?.title || `Slide ${n}`),
      cloIds: existing?.cloIds ?? [],
      sourceBlockIds: existing?.sourceBlockIds ?? [],
      interactionType: existing?.interactionType ?? null,
      visualIntent: existing?.visualIntent,
    });
  }

  // 1. Enforce poll count >= 2
  let pollsCount = result.filter((s) => s.interactionType === "poll").length;
  if (pollsCount < 2) {
    const candidatePollSlots = [4, 14, 9, 15, 5, 11];
    for (const num of candidatePollSlots) {
      if (pollsCount >= 2) break;
      const s = result[num - 1];
      if (s && s.interactionType !== "poll" && s.interactionType !== "worked_example" && s.interactionType !== "pause_discuss" && s.interactionType !== "collaboration") {
        s.interactionType = "poll";
        pollsCount++;
      }
    }
    for (const num of candidatePollSlots) {
      if (pollsCount >= 2) break;
      const s = result[num - 1];
      if (s && s.interactionType !== "poll" && s.interactionType !== "worked_example") {
        s.interactionType = "poll";
        pollsCount++;
      }
    }
  }

  // 2. Enforce pause_discuss count >= 3
  let pauseCount = result.filter((s) => s.interactionType === "pause_discuss").length;
  if (pauseCount < 3) {
    const candidatePauseSlots = [5, 11, 16, 6, 12, 17, 7, 10];
    for (const num of candidatePauseSlots) {
      if (pauseCount >= 3) break;
      const s = result[num - 1];
      if (s && s.interactionType !== "pause_discuss" && s.interactionType !== "worked_example" && s.interactionType !== "poll" && s.interactionType !== "collaboration") {
        s.interactionType = "pause_discuss";
        pauseCount++;
      }
    }
    for (const num of candidatePauseSlots) {
      if (pauseCount >= 3) break;
      const s = result[num - 1];
      if (s && s.interactionType !== "pause_discuss" && s.interactionType !== "worked_example" && s.interactionType !== "poll") {
        s.interactionType = "pause_discuss";
        pauseCount++;
      }
    }
    for (const num of candidatePauseSlots) {
      if (pauseCount >= 3) break;
      const s = result[num - 1];
      if (s && s.interactionType !== "pause_discuss" && s.interactionType !== "worked_example") {
        s.interactionType = "pause_discuss";
        pauseCount++;
      }
    }
  }

  // 3. Enforce collaboration count >= 1
  if (!result.some((s) => s.interactionType === "collaboration")) {
    const colSlot = result[12] ?? result[13];
    if (colSlot) colSlot.interactionType = "collaboration";
  }

  return result;
}

/**
 * Merge a freshly generated plan with existing rows so faculty edits and
 * approvals survive regeneration. Returns rows ready for createMany.
 */
export function mergePlanRows(
  existing: { slideNo: number; title?: string; approved: boolean; updatedAt: Date; createdAt: Date }[],
  generated: AiSlide[]
): AiSlide[] {
  const preservedNos = new Set<number>();
  for (const row of existing) {
    const isPlaceholder = !row.title || /^Slide \d+$/i.test(row.title.trim());
    if (!isPlaceholder && (row.approved || row.updatedAt.getTime() > row.createdAt.getTime() + 2000)) {
      preservedNos.add(row.slideNo);
    }
  }
  return generated.filter((s) => !preservedNos.has(s.slideNo));
}

function formatTopicTitle(t: string): string {
  if (!t) return "Lecture Topic";
  let cleaned = t.trim();
  cleaned = cleaned
    .replace(/\bcrispr\b/gi, "CRISPR")
    .replace(/\bdna\b/gi, "DNA")
    .replace(/\brna\b/gi, "RNA")
    .replace(/\bcas9\b/gi, "Cas9")
    .replace(/\bsgrna\b/gi, "sgRNA")
    .replace(/\bpcr\b/gi, "PCR")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bml\b/gi, "ML")
    .replace(/\bcv\b/gi, "CV")
    .replace(/\bnlp\b/gi, "NLP")
    .replace(/\bsql\b/gi, "SQL")
    .replace(/\bcpu\b/gi, "CPU")
    .replace(/\bgpu\b/gi, "GPU")
    .replace(/\bapi\b/gi, "API")
    .replace(/\bhttp\b/gi, "HTTP")
    .replace(/\biot\b/gi, "IoT")
    .replace(/\bcad\b/gi, "CAD")
    .replace(/\bcam\b/gi, "CAM");

  return cleaned
    .split(/\s+/)
    .map((word) => (/^[A-Z0-9$]+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

export function generateTopicGroundedFallbackSlides(
  topic: string,
  clos: CourseLearningOutcome[],
  blocks: { id: string; locator: string; criticality: string; text: string }[]
): AiSlide[] {
  const cleanTopic = (topic || "Lecture Topic").trim();
  const topicTitle = formatTopicTitle(cleanTopic);
  const cloIds = clos.map((c) => c.id);
  const blockIds = blocks.map((b) => b.id);
  const getBlockId = (idx: number) => (blockIds[idx % Math.max(1, blockIds.length)] ? [blockIds[idx % Math.max(1, blockIds.length)]] : []);
  const getCloId = (idx: number) => (cloIds[idx % Math.max(1, cloIds.length)] ? [cloIds[idx % Math.max(1, cloIds.length)]] : []);

  const calcTitle = `Quantitative Analysis & Worked Example for ${topicTitle}`;
  const tradeOffTitle = `Systemic Trade-offs & Parameter Balancing in ${topicTitle}`;

  const progression: { fn: string; title: string; interaction: string | null }[] = [
    { fn: "hook", title: `What Makes ${topicTitle} Essential?`, interaction: "poll" },
    { fn: "domain_spine", title: `Pillars & Domain Spine of ${topicTitle}`, interaction: null },
    { fn: "clos", title: `Core Learning Outcomes for ${topicTitle}`, interaction: null },
    { fn: "h_stack", title: `${topicTitle} Technical & Human Readiness`, interaction: "pause_discuss" },
    { fn: "foundation", title: `Core Concepts of ${topicTitle}`, interaction: null },
    { fn: "foundation", title: `${topicTitle} System Workflows & Operations`, interaction: "poll" },
    { fn: "foundation", title: `In-Depth Component Analysis of ${topicTitle}`, interaction: "pause_discuss" },
    { fn: "misconception", title: `Why Simple ${topicTitle} Assumptions Fail`, interaction: "pause_discuss" },
    { fn: "calculation", title: calcTitle, interaction: "worked_example" },
    { fn: "deep_dive", title: `Advanced Technical Mechanisms in ${topicTitle}`, interaction: null },
    { fn: "deep_dive", title: `System Requirements & Constraints for ${topicTitle}`, interaction: "pause_discuss" },
    { fn: "deep_dive", title: `Layered Protection & System Robustness in ${topicTitle}`, interaction: null },
    { fn: "trade_off", title: tradeOffTitle, interaction: "collaboration" },
    { fn: "application", title: `Practical ${topicTitle} Case Study`, interaction: null },
    { fn: "application", title: `Guided Industrial & Clinical Scenarios for ${topicTitle}`, interaction: "pause_discuss" },
    { fn: "application", title: `Independent Scenario Analysis for ${topicTitle}`, interaction: null },
    { fn: "application", title: `Saudi Vision 2030 & Career Context for ${topicTitle}`, interaction: null },
    { fn: "rubric", title: `Evaluation Rubric & Mastery Standards for ${topicTitle}`, interaction: null },
    { fn: "evidence", title: `Triangulated Evidence & Portfolio Assessment for ${topicTitle}`, interaction: null },
    { fn: "readiness", title: `Final Capstone Assessment & Sovereign Readiness for ${topicTitle}`, interaction: null },
  ];

  return progression.map((item, i) => ({
    slideNo: i + 1,
    function: FIXED_SLOT_FUNCTION[i + 1] || item.fn,
    title: item.title,
    cloIds: getCloId(i),
    sourceBlockIds: getBlockId(i),
    interactionType: item.interaction,
  }));
}

export async function generateISCARBPlan(projectId: string, regenerate = false): Promise<void> {
  const key = planJobKey(projectId);
  console.log(`[plan-generator] Starting plan generation for ${projectId} (regenerate=${regenerate})`);
  try {
    await setProgress(projectId, { status: "generating", progress: 10 });

    const project = await db.lectureProject.findUnique({
      where: { id: projectId },
      include: { courseProfile: true },
    });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const blocks = await db.lectureSourceBlock.findMany({
      where: { projectId },
      select: { id: true, locator: true, criticality: true, text: true },
    });
    await setProgress(projectId, { status: "generating", progress: 40 });

    const clos = (project.courseProfile.teacherEnteredClos as unknown as CourseLearningOutcome[]) ?? [];
    const selected = clos.filter((c) => project.courseProfile.selectedLectureCloIds.includes(c.id));

    // Sync courseProfile title with project.title if project.title is more specific
    if (project.title && project.courseProfile.title !== project.title) {
      await db.lectureCourseProfile.update({
        where: { id: project.courseProfile.id },
        data: { title: project.title },
      });
    }

    const { system, user } = buildPlanPrompt(blocks, selected, {
      courseCode: project.courseProfile.courseCode,
      title: project.courseProfile.title,
      specialty: project.courseProfile.specialty,
      projectTitle: project.title,
      languagePolicy: project.courseProfile.languagePolicy as string,
    });

    // 45s High-Quality Timeout Race: Allow AI model time to generate deep, content-grounded titles & objectives
    let result: { json: unknown } = { json: null };
    try {
      result = await Promise.race([
        chatJson({ system, user, temperature: 0.3 }),
        new Promise<{ json: null }>((_, reject) =>
          setTimeout(() => reject(new Error("Plan AI generation timeout (45s max)")), 45000)
        ),
      ]);
    } catch (err: any) {
      console.error(`[plan-generator] AI generation failed: ${err.message}`);
      result = { json: null };
    }

    let slides = result.json ? remapPlanIds(sanitizeAiSlides(result.json), selected, blocks) : [];

    // If chatJson returned null/fallback or placeholder titles, apply topic-grounded generator
    const hasPlaceholders = slides.length === 0 || slides.some((s) => !s.title || /^Slide \d+$/i.test(s.title.trim()));
    if (hasPlaceholders || (result.json as any)?.fallback) {
      const fallbackSlides = generateTopicGroundedFallbackSlides(project.title || project.courseProfile.title, selected, blocks);
      if (slides.length === 0) {
        slides = fallbackSlides;
      } else {
        slides = slides.map((s, i) => {
          if (!s.title || /^Slide \d+$/i.test(s.title.trim())) {
            return fallbackSlides[i] ?? s;
          }
          return s;
        });
      }
    }

    slides = bindUnmappedSourceBlocks(slides, blocks);

    await setProgress(projectId, { status: "generating", progress: 70 });

    const errors = validatePlanStructure(slides);
    if (errors.length > 0) {
      console.warn(`[plan-generator] Validation warnings for ${projectId}:`, errors.map((e) => e.message).join("; "));
      // Don't throw — save what we have rather than blocking the faculty.
      // The fallback generator produces valid plans; warnings are informational.
    }

    // Regeneration-aware persist. `regenerate=true` = spec Step 4 (delete all +
    // recreate all 20). Default (false) preserves approved/edited/fixed slides
    // so faculty edits survive regeneration of unrelated sections (AC).
    if (regenerate) {
      await db.lectureSlidePlan.deleteMany({ where: { projectId } });
      await db.lectureSlidePlan.createMany({
        data: slides.map((s) => ({
          projectId,
          slideNo: s.slideNo,
          function: s.function,
          title: s.title,
          cloIds: s.cloIds,
          sourceBlockIds: s.sourceBlockIds,
          interactionType: s.interactionType,
          visualIntent: s.visualIntent,
        })),
      });
    } else {
      const existing = await db.lectureSlidePlan.findMany({
        where: { projectId },
        select: { slideNo: true, title: true, approved: true, updatedAt: true, createdAt: true },
      });
      const toReplace = mergePlanRows(existing, slides);

      if (existing.length === 0 || toReplace.length === slides.length) {
        // Clean slate or replace all
        await db.lectureSlidePlan.deleteMany({ where: { projectId } });
        await db.lectureSlidePlan.createMany({
          data: slides.map((s) => ({
            projectId,
            slideNo: s.slideNo,
            function: s.function,
            title: s.title,
            cloIds: s.cloIds,
            sourceBlockIds: s.sourceBlockIds,
            interactionType: s.interactionType,
            visualIntent: s.visualIntent,
          })),
        });
      } else if (toReplace.length > 0) {
        const replaceNos = toReplace.map((s) => s.slideNo);
        await db.lectureSlidePlan.deleteMany({ where: { projectId, slideNo: { in: replaceNos } } });
        await db.lectureSlidePlan.createMany({
          data: toReplace.map((s) => ({
            projectId,
            slideNo: s.slideNo,
            function: s.function,
            title: s.title,
            cloIds: s.cloIds,
            sourceBlockIds: s.sourceBlockIds,
            interactionType: s.interactionType,
            visualIntent: s.visualIntent,
          })),
        });
      }
    }

    await db.lectureProject.update({ where: { id: projectId }, data: { status: "planning" } });
    await setProgress(projectId, { status: "done", progress: 100 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await db.lectureProject.update({ where: { id: projectId }, data: { status: "failed" } });
    } catch {
      // Project may not exist; the job status below still records the error.
    }
    await setProgress(projectId, { status: "failed", progress: 100, error: message });
    throw err;
  }
}
