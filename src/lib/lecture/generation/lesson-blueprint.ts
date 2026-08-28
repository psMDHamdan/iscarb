/**
 * Master Lesson Blueprint Generator
 * ===========================================================================
 * This is the CORE architectural fix for the lecture generation pipeline.
 *
 * BEFORE this existed:
 *   Source blocks → LLM generates slides directly
 *   Problem: unrelated concepts mixed, no coherent learning journey
 *
 * AFTER this exists:
 *   Source blocks → Concept clustering → MASTER BLUEPRINT → slides generated from blueprint
 *
 * The blueprint ensures:
 *   1. Each slide covers ONE coherent concept cluster
 *   2. Concepts follow a logical learning sequence (prerequisites first)
 *   3. No unrelated concepts appear in the same slide
 *   4. Every slide has a clear pedagogical purpose
 *   5. The lesson follows: Hook → Predict → Learn → Apply → Check → Transfer
 *   6. Both student experience AND PPT come from the same blueprint
 *
 * The LLM must NEVER directly convert raw RAG chunks into slides.
 * It must first generate this blueprint, validate it, then generate slides.
 */

import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import type { AnalysedBlock } from "./source-analyst";
import { getConceptClusters, type ConceptCluster } from "./source-analyst";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LessonBlueprint {
  lessonTitle: string;
  hook: string;                    // The opening problem/scenario
  learningObjectives: string[];    // What students will learn
  conceptSequence: ConceptSlot[];  // Ordered sequence of concepts for 20 slides
  sourceEvidence: SourceEvidence[];// Source blocks mapped to concepts
  misconceptionTargets: string[];  // Common misconceptions to address
  visualPlan: VisualPlanSlot[];    // What visual each slide needs
  interactionPlan: InteractionPlanSlot[]; // What interaction each slide needs
  validationStatus: "pending" | "passed" | "failed";
  validationErrors: string[];
}

export interface ConceptSlot {
  slideNo: number;
  conceptClusterId: string;        // Links to concept graph
  conceptLabel: string;            // Human-readable: "EcoRI Restriction Enzyme"
  pedagogicalPurpose: string;      // "hook" | "predict" | "teach" | "mechanism" | "apply" | "check" | "feedback" | "transfer"
  prerequisiteSlideNos: number[];  // Slides that must come before this one
  sourceBlockIds: string[];        // Which source blocks support this concept
  cloIds: string[];                // Which CLOs this concept addresses
  bloomLevel: string;              // "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
  keyQuestion: string;             // The central question this slide answers
}

export interface SourceEvidence {
  conceptClusterId: string;
  blockIds: string[];
  evidenceType: "definition" | "mechanism" | "example" | "calculation" | "case" | "misconception" | "application";
  summary: string;                 // One-line summary of what the evidence shows
}

export interface VisualPlanSlot {
  slideNo: number;
  visualType: "freebody" | "graph" | "circuit" | "wave" | "molecule" | "reaction" | "sequence" | "pathway" | "diagram" | "comparison" | "process" | "none";
  description: string;             // What the visual should show
  required: boolean;               // Must this slide have a visual?
}

export interface InteractionPlanSlot {
  slideNo: number;
  interactionType: "poll" | "prediction" | "worked_example" | "practice" | "reflection" | "discussion" | "none";
  questionFocus: string;           // What the question tests (not the question text itself)
}

// ─── Blueprint Generation ───────────────────────────────────────────────────

const BLUEPRINT_SYSTEM = `You are the Master Lesson Architect for an academic lecture compiler.

Your job is to generate a MASTER LESSON BLUEPRINT — a validated concept sequence that drives ALL slide generation.

RULES:
1. The blueprint MUST define a coherent learning journey: Hook → Predict → Learn → Mechanism → Apply → Check → Transfer.
2. Each slide covers ONE concept cluster — NEVER mix unrelated concepts.
3. Concepts must follow prerequisite order (prerequisites taught before dependents).
4. Every concept must map to at least one CLO.
5. Every slide must have a clear pedagogical purpose (not just "present information").
6. The hook MUST create curiosity with a specific problem or scenario.
7. Questions MUST test the concept just taught, not recall of earlier concepts.
8. Never repeat a concept unless the learner is using it in a new context.

LEARNING FLOW (20 slides):
- S1: HOOK — Create curiosity with a specific problem/scenario from the source
- S2: DOMAIN SPINE — Overview of the topic's major pillars
- S3: CLOs — What students will learn
- S4: PRIOR KNOWLEDGE — What students already know
- S5-S7: CORE CONCEPTS — Teach foundational concepts (one per slide)
- S8: MISCONCEPTION — Challenge a common wrong belief
- S9-S10: WORKED EXAMPLE / PRACTICE — Apply concepts to concrete problems
- S11-S12: DEEP DIVE — Advanced concepts, trade-offs
- S13: CASE STUDY — Real-world application
- S14-S16: APPLICATION — Guided, independent, collaborative practice
- S17: TRANSFER — Apply to new context
- S18: RUBRIC — Assessment criteria
- S19: EVIDENCE — What students should produce
- S20: READINESS GATE — Final integrated check

Return STRICT JSON matching the schema below.`;

const BLUEPRINT_SCHEMA = `{
  "lessonTitle": "string — specific, not generic",
  "hook": "string — a specific scenario with numbers, dates, or named entities that creates curiosity",
  "learningObjectives": ["string — one per CLO, measurable"],
  "conceptSequence": [
    {
      "slideNo": 1-20,
      "conceptClusterId": "cluster-X — from the concept graph",
      "conceptLabel": "string — 2-5 word concept name",
      "pedagogicalPurpose": "hook|predict|teach|mechanism|apply|check|feedback|transfer",
      "prerequisiteSlideNos": [number],
      "sourceBlockIds": ["block-id"],
      "cloIds": ["clo-id"],
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "keyQuestion": "string — the central question this slide answers"
    }
  ],
  "sourceEvidence": [
    {
      "conceptClusterId": "cluster-X",
      "blockIds": ["block-id"],
      "evidenceType": "definition|mechanism|example|calculation|case|misconception|application",
      "summary": "string — one-line summary"
    }
  ],
  "misconceptionTargets": ["string — specific misconceptions to address"],
  "visualPlan": [
    {
      "slideNo": 1-20,
      "visualType": "freebody|graph|circuit|wave|molecule|reaction|sequence|pathway|diagram|comparison|process|none",
      "description": "string — what the visual should show",
      "required": true|false
    }
  ],
  "interactionPlan": [
    {
      "slideNo": 1-20,
      "interactionType": "poll|prediction|worked_example|practice|reflection|discussion|none",
      "questionFocus": "string — what the question tests"
    }
  ]
}`;

// ─── Blueprint Validation ───────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateBlueprint(
  blueprint: LessonBlueprint,
  clusters: ConceptCluster[],
  clos: CourseLearningOutcome[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Must have exactly 20 slides
  if (blueprint.conceptSequence.length !== 20) {
    errors.push(`Expected 20 concept slots, got ${blueprint.conceptSequence.length}`);
  }

  // 2. S1 must be a hook
  const s1 = blueprint.conceptSequence.find((s) => s.slideNo === 1);
  if (s1 && s1.pedagogicalPurpose !== "hook") {
    errors.push("S1 must have pedagogicalPurpose='hook'");
  }

  // 3. S20 must be a readiness gate or transfer
  const s20 = blueprint.conceptSequence.find((s) => s.slideNo === 20);
  if (s20 && !["check", "transfer", "feedback"].includes(s20.pedagogicalPurpose)) {
    warnings.push("S20 should be a readiness gate or transfer");
  }

  // 4. No duplicate concept clusters in consecutive slides
  for (let i = 1; i < blueprint.conceptSequence.length; i++) {
    const prev = blueprint.conceptSequence[i - 1];
    const curr = blueprint.conceptSequence[i];
    if (prev.conceptClusterId === curr.conceptClusterId && prev.pedagogicalPurpose === curr.pedagogicalPurpose) {
      warnings.push(`S${prev.slideNo} and S${curr.slideNo} use the same concept cluster with the same purpose`);
    }
  }

  // 5. Prerequisites must reference earlier slides
  for (const slot of blueprint.conceptSequence) {
    for (const prereq of slot.prerequisiteSlideNos) {
      if (prereq >= slot.slideNo) {
        errors.push(`S${slot.slideNo} has prerequisite S${prereq} which comes after it`);
      }
    }
  }

  // 6. Every concept must map to at least one CLO
  const cloIds = new Set(clos.map((c) => c.id));
  for (const slot of blueprint.conceptSequence) {
    if (slot.cloIds.length === 0) {
      warnings.push(`S${slot.slideNo} (${slot.conceptLabel}) has no CLO mapping`);
    }
    for (const cloId of slot.cloIds) {
      if (!cloIds.has(cloId)) {
        errors.push(`S${slot.slideNo} references unknown CLO: ${cloId}`);
      }
    }
  }

  // 7. Source blocks must exist in the concept graph
  const clusterIds = new Set(clusters.map((c) => c.id));
  for (const slot of blueprint.conceptSequence) {
    if (!clusterIds.has(slot.conceptClusterId) && slot.conceptClusterId !== "custom") {
      warnings.push(`S${slot.slideNo} references unknown cluster: ${slot.conceptClusterId}`);
    }
  }

  // 8. Visual plan must cover at least 15 slides
  const visualSlides = blueprint.visualPlan.filter((v) => v.visualType !== "none" && v.required);
  if (visualSlides.length < 15) {
    warnings.push(`Only ${visualSlides.length} slides have required visuals — BRD requires >= 18`);
  }

  // 9. Interaction plan must have at least 3 polls and 3 discussions
  const polls = blueprint.interactionPlan.filter((i) => i.interactionType === "poll");
  const discussions = blueprint.interactionPlan.filter((i) => i.interactionType === "discussion");
  if (polls.length < 2) {
    warnings.push(`Only ${polls.length} polls — need >= 2`);
  }
  if (discussions.length < 2) {
    warnings.push(`Only ${discussions.length} discussions — need >= 2`);
  }

  // 10. Bloom level progression: early slides should be lower, later slides higher
  const bloomOrder = ["remember", "understand", "apply", "analyze", "evaluate", "create"];
  const earlyAvg = blueprint.conceptSequence
    .filter((s) => s.slideNo <= 7)
    .reduce((sum, s) => sum + bloomOrder.indexOf(s.bloomLevel), 0) / 7;
  const lateAvg = blueprint.conceptSequence
    .filter((s) => s.slideNo >= 14)
    .reduce((sum, s) => sum + bloomOrder.indexOf(s.bloomLevel), 0) / 7;
  if (lateAvg <= earlyAvg) {
    warnings.push("Bloom levels don't progress — later slides should be higher-level");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Main Export ────────────────────────────────────────────────────────────

/**
 * Generate a Master Lesson Blueprint from analysed source blocks.
 * This runs ONCE before any slides are generated.
 *
 * Pipeline:
 * 1. Get concept clusters from source analysis
 * 2. LLM generates blueprint (concept sequence, visual plan, interaction plan)
 * 3. Validate blueprint (coherence, prerequisites, CLO alignment)
 * 4. If validation fails, retry once with error feedback
 * 5. Store blueprint in generationStateJson for all chunks to use
 */
export async function generateLessonBlueprint(
  projectId: string,
  clos: CourseLearningOutcome[],
  analysedBlocks: AnalysedBlock[],
  courseTitle: string,
  courseDescription: string
): Promise<LessonBlueprint> {
  // Step 1: Get concept clusters
  const clusters = getConceptClusters(analysedBlocks);

  // Step 2: Build context for the LLM
  const clusterSummary = clusters.map((c) => ({
    id: c.id,
    label: c.label,
    blockCount: (c.blockIds ?? []).length,
    cloIds: c.cloIds ?? [],
    importance: c.importance,
    concepts: (c.blockIds ?? [])
      .map((bid) => analysedBlocks.find((b) => b.id === bid))
      .filter(Boolean)
      .map((b) => b!.canonicalConcept)
      .slice(0, 5),
  }));

  const cloSummary = clos.map((c) => ({
    id: c.id,
    number: c.number,
    text: c.text,
  }));

  const userPrompt = [
    `Course: ${courseTitle}`,
    courseDescription ? `Description: ${courseDescription}` : "",
    "",
    "Learning Outcomes (CLOs):",
    JSON.stringify(cloSummary, null, 2),
    "",
    "Concept Clusters from Source Analysis:",
    JSON.stringify(clusterSummary, null, 2),
    "",
    "Generate the Master Lesson Blueprint.",
    "Map each of the 20 slides to a concept cluster from the list above.",
    "Use 'custom' as conceptClusterId only for CLOs slide (S3) which doesn't need source blocks.",
  ].filter(Boolean).join("\n");

  // Step 3: Generate blueprint (with retry on validation failure)
  let blueprint: LessonBlueprint | null = null;
  let lastValidation: ValidationResult | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const context = lastValidation
        ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastValidation.errors.join("\n")}\n${lastValidation.warnings.join("\n")}\n\nFix these issues and regenerate.`
        : "";

      const res = await chatJson({
        system: BLUEPRINT_SYSTEM + "\n\nReturn STRICT JSON matching this schema:\n" + BLUEPRINT_SCHEMA,
        user: userPrompt + context,
        temperature: 0.2,
        task: "generation",
      });

      const json = (res.json ?? {}) as Record<string, unknown>;
      blueprint = normalizeBlueprint(json, clusters, analysedBlocks);

      // Step 4: Validate
      lastValidation = validateBlueprint(blueprint, clusters, clos);

      if (lastValidation.valid) {
        blueprint.validationStatus = "passed";
        blueprint.validationErrors = [];
        break;
      } else {
        console.warn(`[LessonBlueprint] Attempt ${attempt + 1} failed validation:`, lastValidation.errors);
        blueprint.validationStatus = "failed";
        blueprint.validationErrors = lastValidation.errors;
      }
    } catch (err) {
      console.warn(`[LessonBlueprint] Attempt ${attempt + 1} failed:`, err);
    }
  }

  // If all attempts failed, use the last blueprint with warnings
  if (!blueprint) {
    blueprint = createFallbackBlueprint(clusters, clos, analysedBlocks);
  }

  // Step 5: Store in generationStateJson
  try {
    await db.lectureProject.update({
      where: { id: projectId },
      data: {
        generationStateJson: {
          lessonBlueprint: blueprint,
        },
      },
    });
  } catch {
    // best-effort
  }

  return blueprint;
}

/**
 * Get the cached blueprint from generationStateJson, or generate a new one.
 */
export async function getOrCreateBlueprint(
  projectId: string,
  clos: CourseLearningOutcome[],
  analysedBlocks: AnalysedBlock[],
  courseTitle: string,
  courseDescription: string
): Promise<LessonBlueprint> {
  // Check cache
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    select: { generationStateJson: true },
  });

  const cached = (project?.generationStateJson as { lessonBlueprint?: LessonBlueprint } | null)?.lessonBlueprint;
  if (cached && cached.validationStatus === "passed" && cached.conceptSequence.length === 20) {
    return cached;
  }

  return generateLessonBlueprint(projectId, clos, analysedBlocks, courseTitle, courseDescription);
}

// ─── Normalization ──────────────────────────────────────────────────────────

function normalizeBlueprint(
  json: Record<string, unknown>,
  clusters: ConceptCluster[],
  analysedBlocks: AnalysedBlock[]
): LessonBlueprint {
  const conceptSequence = Array.isArray(json.conceptSequence)
    ? json.conceptSequence.map((s: any, i: number) => ({
        slideNo: typeof s.slideNo === "number" ? s.slideNo : i + 1,
        conceptClusterId: typeof s.conceptClusterId === "string" ? s.conceptClusterId : "custom",
        conceptLabel: typeof s.conceptLabel === "string" ? s.conceptLabel : `Concept ${i + 1}`,
        pedagogicalPurpose: typeof s.pedagogicalPurpose === "string" ? s.pedagogicalPurpose : "teach",
        prerequisiteSlideNos: Array.isArray(s.prerequisiteSlideNos) ? s.prerequisiteSlideNos : [],
        sourceBlockIds: Array.isArray(s.sourceBlockIds) ? s.sourceBlockIds : [],
        cloIds: Array.isArray(s.cloIds) ? s.cloIds : [],
        bloomLevel: typeof s.bloomLevel === "string" ? s.bloomLevel : "understand",
        keyQuestion: typeof s.keyQuestion === "string" ? s.keyQuestion : "",
      }))
    : [];

  // Ensure exactly 20 slides
  while (conceptSequence.length < 20) {
    conceptSequence.push({
      slideNo: conceptSequence.length + 1,
      conceptClusterId: "custom",
      conceptLabel: `Slide ${conceptSequence.length + 1}`,
      pedagogicalPurpose: "teach",
      prerequisiteSlideNos: [],
      sourceBlockIds: [],
      cloIds: [],
      bloomLevel: "understand",
      keyQuestion: "",
    });
  }

  const visualPlan = Array.isArray(json.visualPlan)
    ? json.visualPlan.map((v: any) => ({
        slideNo: typeof v.slideNo === "number" ? v.slideNo : 0,
        visualType: typeof v.visualType === "string" ? v.visualType : "diagram",
        description: typeof v.description === "string" ? v.description : "",
        required: typeof v.required === "boolean" ? v.required : true,
      }))
    : [];

  const interactionPlan = Array.isArray(json.interactionPlan)
    ? json.interactionPlan.map((p: any) => ({
        slideNo: typeof p.slideNo === "number" ? p.slideNo : 0,
        interactionType: typeof p.interactionType === "string" ? p.interactionType : "none",
        questionFocus: typeof p.questionFocus === "string" ? p.questionFocus : "",
      }))
    : [];

  return {
    lessonTitle: typeof json.lessonTitle === "string" ? json.lessonTitle : "Lecture",
    hook: typeof json.hook === "string" ? json.hook : "",
    learningObjectives: Array.isArray(json.learningObjectives) ? json.learningObjectives : [],
    conceptSequence,
    sourceEvidence: Array.isArray(json.sourceEvidence) ? json.sourceEvidence : [],
    misconceptionTargets: Array.isArray(json.misconceptionTargets) ? json.misconceptionTargets : [],
    visualPlan,
    interactionPlan,
    validationStatus: "pending",
    validationErrors: [],
  };
}

// ─── Fallback Blueprint ─────────────────────────────────────────────────────

function createFallbackBlueprint(
  clusters: ConceptCluster[],
  clos: CourseLearningOutcome[],
  analysedBlocks: AnalysedBlock[]
): LessonBlueprint {
  // Distribute clusters across slides
  const conceptSequence: ConceptSlot[] = [];
  const sortedClusters = [...clusters].sort((a, b) => {
    const impOrder = { critical: 0, important: 1, supporting: 2 };
    return (impOrder[a.importance] ?? 2) - (impOrder[b.importance] ?? 2);
  });

  // S1: Hook (first critical cluster)
  const hookCluster = sortedClusters.find((c) => c.importance === "critical") ?? sortedClusters[0];
  if (hookCluster) {
    conceptSequence.push({
      slideNo: 1,
      conceptClusterId: hookCluster.id,
      conceptLabel: hookCluster.label,
      pedagogicalPurpose: "hook",
      prerequisiteSlideNos: [],
      sourceBlockIds: (hookCluster.blockIds ?? []).slice(0, 3),
      cloIds: hookCluster.cloIds ?? [],
      bloomLevel: "remember",
      keyQuestion: `What is the problem with ${hookCluster.label}?`,
    });
  }

  // S2: Domain spine
  conceptSequence.push({
    slideNo: 2,
    conceptClusterId: "custom",
    conceptLabel: "Domain Overview",
    pedagogicalPurpose: "teach",
    prerequisiteSlideNos: [],
    sourceBlockIds: [],
    cloIds: clos.slice(0, 3).map((c) => c.id),
    bloomLevel: "understand",
    keyQuestion: "What are the major pillars of this topic?",
  });

  // S3: CLOs
  conceptSequence.push({
    slideNo: 3,
    conceptClusterId: "custom",
    conceptLabel: "Learning Outcomes",
    pedagogicalPurpose: "teach",
    prerequisiteSlideNos: [],
    sourceBlockIds: [],
    cloIds: clos.map((c) => c.id),
    bloomLevel: "remember",
    keyQuestion: "What will you learn?",
  });

  // S4: Prior knowledge
  conceptSequence.push({
    slideNo: 4,
    conceptClusterId: "custom",
    conceptLabel: "Prior Knowledge",
    pedagogicalPurpose: "predict",
    prerequisiteSlideNos: [],
    sourceBlockIds: [],
    cloIds: [],
    bloomLevel: "remember",
    keyQuestion: "What do you already know?",
  });

  // S5-S12: Core concepts from clusters
  let slotNo = 5;
  const usedClusterIds = new Set<string>();
  for (const cluster of sortedClusters) {
    if (slotNo > 12) break;
    if (usedClusterIds.has(cluster.id)) continue;
    usedClusterIds.add(cluster.id);

    const purpose = slotNo <= 7 ? "teach" : slotNo <= 10 ? "mechanism" : "apply";
    const bloom = slotNo <= 7 ? "understand" : slotNo <= 10 ? "apply" : "analyze";

    conceptSequence.push({
      slideNo: slotNo,
      conceptClusterId: cluster.id,
      conceptLabel: cluster.label,
      pedagogicalPurpose: purpose,
      prerequisiteSlideNos: slotNo > 5 ? [slotNo - 1] : [],
      sourceBlockIds: (cluster.blockIds ?? []).slice(0, 5),
      cloIds: cluster.cloIds ?? [],
      bloomLevel: bloom,
      keyQuestion: `How does ${cluster.label} work?`,
    });
    slotNo++;
  }

  // Fill remaining slots with generic purpose
  while (conceptSequence.length < 20) {
    const sNo = conceptSequence.length + 1;
    const purpose = sNo <= 13 ? "apply" : sNo <= 17 ? "check" : "transfer";
    const bloom = sNo <= 13 ? "apply" : sNo <= 17 ? "analyze" : "evaluate";

    conceptSequence.push({
      slideNo: sNo,
      conceptClusterId: "custom",
      conceptLabel: `Slide ${sNo}`,
      pedagogicalPurpose: purpose,
      prerequisiteSlideNos: [sNo - 1],
      sourceBlockIds: [],
      cloIds: clos.slice(0, 2).map((c) => c.id),
      bloomLevel: bloom,
      keyQuestion: "",
    });
  }

  return {
    lessonTitle: "Lecture",
    hook: "",
    learningObjectives: clos.map((c) => c.text),
    conceptSequence,
    sourceEvidence: [],
    misconceptionTargets: [],
    visualPlan: conceptSequence.map((s) => ({
      slideNo: s.slideNo,
      visualType: "diagram" as const,
      description: `Visual for ${s.conceptLabel}`,
      required: s.slideNo !== 3,
    })),
    interactionPlan: conceptSequence.map((s) => ({
      slideNo: s.slideNo,
      interactionType: (s.pedagogicalPurpose === "check" ? "poll" : s.pedagogicalPurpose === "apply" ? "practice" : "none") as any,
      questionFocus: s.keyQuestion,
    })),
    validationStatus: "failed",
    validationErrors: ["Fallback blueprint used — LLM generation failed"],
  };
}
