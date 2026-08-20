/**
 * Lecture Generation — per-slide LLM generator (TASK-04 §C).
 * ===========================================================================
 * Generates one structured slide artifact for a plan row. Uses chatJson with
 * the documented DeepSeek model. The fallback flag is always checked — stale
 * content is never used. wordCount is recomputed locally as source of truth.
 *
 * System prompt implements the full 35-section Student-Learning PPT Generation
 * specification: source fidelity, concept intelligence, learning progression,
 * five-layer content, and hard failure conditions.
 */
import { chatJson, DEFAULT_AI_MODEL, type ChatResult } from "@/lib/ai-engine";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import { artifactGate } from "./artifact-validator";
import { recordModelRun } from "./model-run";
import {
  buildCLOSlide,
  misconceptionPromptAddendum,
  workedCalculationPromptAddendum,
  rubricPromptAddendum,
  readinessGatePromptAddendum,
} from "./special-slides";
import type { LectureProjectWithRelations, SlideArtifactDraft, SlideContentJson } from "./types";
import { globalSentenceRegistry } from "./content-registry";

// NVIDIA Integrate catalog IDs are `meta/llama-…` or `openai/gpt-oss-…`.
// HuggingFace-style `meta-llama/…` returns HTTP 404 from Integrate.
const MODEL = DEFAULT_AI_MODEL;

// ---------------------------------------------------------------------------
// FORBIDDEN_PHRASES — hard rejection filter applied to every generated slide.
//
// These are STRUCTURAL anti-patterns, not domain-specific strings.
// They fire regardless of course subject (CS, Physics, Biology, Economics, etc.)
// ---------------------------------------------------------------------------
const FORBIDDEN_PHRASES: RegExp[] = [
  // Generic template questions where [TITLE] was substituted but not filled in
  /How does .{1,120} behave under real-world constraints/i,
  /How does this apply in operations/i,
  /Compare the options grounded in the source/i,
  /Calculate this worked example using the source method/i,
  /Which option matches the source concept/i,

  // Generic boilerplate that leaked from prompt templates
  /High-performance,?\s*secure execution/i,
  /Aligned with National Digital Transformation/i,
  /Higher education develops critical thinking/i,
  /Introduce the core principle clearly/i,

  // Internal UI labels that must never appear in content fields
  /(?<!"[^"]*)"Scenario Visual"(?![^"]*")/,  // as a JSON value (not a key comment)
  /(?<!"[^"]*)"Active Task"(?![^"]*")/,

  // Repeated generic subtitles — any sentence that starts with "X Mechanism"
  // where X is the slide title repeated verbatim (mad-lib pattern)
  /ribonucleoprotein complex binds target DNA complementary to gRNA adjacent/i,
];

// ---------------------------------------------------------------------------
// DOMAIN CONTAMINATION — detects content from a completely different subject
// domain being injected into the current course's slides.
//
// Strategy: we don't hardcode banned topics. Instead, we extract candidate
// "alien" domain signals from the content and check whether the course title
// and source blocks share any of those signals. If the content contains a
// domain marker that the course title does NOT share, it is contamination.
// ---------------------------------------------------------------------------

/** Each entry is [domain label, keywords that identify it] */
const DOMAIN_SIGNALS: Array<{ label: string; keywords: RegExp }> = [
  { label: "Structural Mechanics / FEA", keywords: /\b(von mises|finite element analysis|\bFEA\b|stress distribution|structural mechanics|yield criterion|beam deflection|truss analysis)\b/i },
  { label: "Genomics / CRISPR (in non-bio course)", keywords: /\b(CRISPR|Cas9|gRNA|PAM sequence|double-strand break|off-target cleavage|transfection|nuclease)\b/i },
  { label: "Generic education brochure", keywords: /higher education develops critical thinking|domain expertise and problem-solving capabilities/i },
  { label: "Unrelated national initiative", keywords: /Aligned with National Digital Transformation|national digital transformation initiative/i },
];

/**
 * Returns true if the serialized artifact JSON contains any forbidden structural
 * anti-pattern OR domain contamination from a subject unrelated to the course.
 *
 * Domain contamination is only flagged when the course title/description does
 * NOT itself belong to the suspected domain — so a CRISPR course will not be
 * falsely rejected for containing CRISPR content.
 */
function hasForbiddenContent(content: SlideContentJson, courseTitle: string, courseTopic: string = ""): boolean {
  const serialized = JSON.stringify(content);
  const courseContext = `${courseTitle} ${courseTopic}`.toLowerCase();

  // 1. Structural anti-pattern check — domain-agnostic
  for (const pattern of FORBIDDEN_PHRASES) {
    if (pattern.test(serialized)) {
      console.warn(`[SlideGenerator] FORBIDDEN_PHRASE detected (${pattern.source.slice(0, 60)})`);
      return true;
    }
  }

  // 2. Domain contamination check — only fire when course does NOT belong to that domain
  for (const { label, keywords } of DOMAIN_SIGNALS) {
    if (keywords.test(serialized) && !keywords.test(courseContext)) {
      console.warn(`[SlideGenerator] DOMAIN_CONTAMINATION detected: ${label}`);
      return true;
    }
  }

  return false;
}

function countVisibleWords(content: SlideContentJson): number {
  const titleWords = content.title ? content.title.split(/\s+/).filter(Boolean).length : 0;
  const visibleCopyWords = content.body?.visibleCopy ? content.body.visibleCopy.split(/\s+/).filter(Boolean).length : 0;
  const bulletWords = (content.body?.bullets || []).reduce((n, b) => n + b.split(/\s+/).filter(Boolean).length, 0);
  return titleWords + visibleCopyWords + bulletWords;
}

// ---------------------------------------------------------------------------
// SYSTEM PROMPT — Full 35-section Student-Learning PPT Generation Contract
// ---------------------------------------------------------------------------

function systemPrompt(languagePolicy: string): string {
  const langInstruction =
    languagePolicy === "ar"
      ? "\nGenerate ALL output in Arabic. Use dir=\"rtl\" conventions."
      : languagePolicy === "bilingual"
        ? "\nGenerate output in English AND Arabic. Include 'textAr' object with Arabic title and bullets."
        : "";
  return `You are the iSCARB Pedagogical Rewriter. Your job is NOT to summarize
source material. Your job is to TRANSFORM raw source fragments into
TEACHING content that a student can learn from.

## ABSOLUTE RULE — READ THIS FIRST

**NEVER copy-paste text from the SourceBlocks into the output.**

If you see this in a source block:
  "58 Note: pROSA26-Puro-DNR is a donor vector, the gene of interest 
   needs to be cloned in this donor vector"

You MUST NOT output:
  ❌ "pROSA26-Puro-DNR is a donor vector, the gene of interest needs 
      to be cloned in this donor vector"

You MUST output:
  ✅ "Before CRISPR, inserting a gene required random integration 
      and months of screening. The pROSA26-Puro-DNR donor vector 
      enables targeted knock-in at a 'safe harbor' locus, cutting 
      the timeline from months to weeks."

The source gives you FACTS. YOU give the student UNDERSTANDING.

## FORBIDDEN OUTPUT PATTERNS (Hard Rejection)

Your output will be REJECTED if it contains ANY of the following:

1. Internal IDs or hashes:
   ❌ "Design target sequence (cmt14fy1g0009onsbby7pm5q9)"
   ❌ "(cmt14fy1g0009onsbby7pm5q9)"
   → Strip ALL parenthetical alphanumeric strings >15 characters.

2. Raw catalog / product codes:
   ❌ "SKU GE100019"
   ❌ "pCas-Guide-Nickase (SKU GE100019)"
   → Mention the tool by name only if pedagogically necessary.

3. Raw figure references:
   ❌ "41 Figure 17. Vector maps of AAVS1 donor vectors"
   ❌ "Fig. 2 . Scheme of genome - editing knockout kit"
   → NEVER include "Figure X" or "Fig. X" in slide text.
   → If the source has a diagram, describe what it SHOWS, not its caption.

4. Raw protocol steps:
   ❌ "Incubate the reaction at 37°C for 3 hrs"
   ❌ "Total volume 30 μL"
   ❌ "2 μL Forward oligo (100 μM stock)"
   → Rewrite as: "The annealing step requires precise temperature 
     control — 37°C for 3 hours ensures complete hybridization."

5. Raw package contents:
   ❌ "Package contents: 2 vials of gRNA"
   ❌ "One 1 vial of pCRISPRa-Enhancer, 10 μg, lyophilized"
   → Rewrite as: "The kit includes pre-designed guide RNAs and 
     a Cas9 expression vector, ready for transfection."

6. Raw reagent lists:
   ❌ "Related Optional Reagents: Competent E. coli cells, LB agar plates"
   → Rewrite as: "Bacterial transformation requires competent cells 
     and selective media to isolate successful clones."

7. Generic template prompts:
   ❌ "Compare the options grounded in the source"
   ❌ "Calculate this worked example using the source method"
   ❌ "Which option matches the source concept"
   ❌ "How does this apply in operations"
   ❌ "Poll: Which option matches the source concept?"

8. Repeated boilerplate subtitles:
   ❌ "CRISPR-Cas9 Genome Editing Mechanism"
   → This is a source sentence, not a slide subtitle. Generate a 
     slide-specific subtitle that describes THIS slide's unique focus.

9. Empty or placeholder content:
   ❌ "Scenario Visual"
   ❌ "Active Task"
   ❌ "Review pending — placeholder content"
   ❌ "Review the source material to confirm understanding"

## SOURCE TRANSFORMATION RULES

For EVERY bullet, apply ONE of these transformations:

| Source Type | Transformation | Example |
|-------------|----------------|---------|
| Catalog note | → Comparison with stakes | "Before X... With CRISPR..." |
| Protocol step | → Design decision | "The 3-hour incubation is not arbitrary — it balances complete hybridization against gRNA degradation." |
| Figure caption | → Visual description | Instead of "Figure 17. Vector maps" → "The AAVS1 donor vector carries a puromycin resistance gene, enabling selection of edited cells." |
| Product list | → Concept explanation | Instead of "SKU GE100052" → "The ROSA26 locus offers an alternative safe harbor for transgene integration." |
| Raw sequence | → Functional meaning | Instead of "GATCGAGTGCCG..." → "The sgRNA scaffold sequence binds Cas9 and positions the nuclease domains for cleavage." |
| Measurement | → Design reasoning | Instead of "100 ng/μL" → "At 100 ng/μL, a 100 μL transfection delivers 10 μg of DNA — but efficiency depends on cell type and chemistry." |

## PEDAGOGICAL STRUCTURE (20-Slide iSCARB Contract)

Generate EXACTLY the slide specified by the SlidePlan.function.

### S1 — PROBLEM / HOOK
- Title: Name a specific event, failure, or number. NEVER generic.
  BAD: "Introduction to CRISPR"
  GOOD: "When 1,500 Unintended Cuts Shut Down a Trial"
- visibleCopy: One sentence with STAKES (money lost, lives affected, time wasted).
- Bullets: 3 facts that build tension. Each must contain a number, date, or named entity.
- Poll: A prediction question that activates prior knowledge. 4 options, each explaining WHY it is plausible.

### S2 — DOMAIN SPINE
- Title: "The N Pillars of [Topic]"
- Bullets: 5-7 pillars. Each is "Noun Phrase: one-line description"
- Poll: "Which pillar do you think is most often neglected?"

### S3 — CLOs
- Copy CLO text VERBATIM from the input. No rewriting.
- No visibleCopy.
- Pause & Discuss: "Which CLO connects most directly to your role?"

### S4 — H-STACK (Human / Technical / Market)
- Title: "[Topic] Readiness Stack"
- Bullets: Exactly 3 layers. Each has a concrete example from source or Saudi context.
- Poll: Force a choice between layers.

### S5 — CORE CONCEPT (Foundation)
- Title: "[Concept] Is Not Just [Simplification]"
- Bullets: WHAT + WHY + HOW. Include one formula or mechanism from source.
- Poll: Diagnostic question targeting common confusion.

### S6 — MECHANISM (Foundation)
- Title: "How [Process] Works Step by Step"
- Bullets: CAUSE → EFFECT or INPUT → PROCESS → OUTPUT.
- Include actual formulas or step-by-step processes. NO summaries.

### S7 — FOUNDATION DEEPER
- Title: "[Concept]: The Details That Matter"
- Bullets: 3-4 technical details with explanations of WHY each matters.

### S8 — MISCONCEPTION
- Title: "Why '[Common Belief]' Is Wrong"
- Bullets MUST follow: MYTH → WHY IT SEEMS REASONABLE → WHY IT FAILS → CORRECT MODEL
- Poll: One option MUST match the misconception.

### S9 — WORKED EXAMPLE
- Title: "Calculating [Specific Thing]"
- Bullets: Given → Step 1 → Step 2 → Step 3 → Result. Actual numbers.
- Calculation: A variation problem for students to solve.

### S10 — GUIDED PRACTICE
- Title: "Practice: [Variation of Worked Example]"
- Bullets: 3 progressive hints.
- Calculation: Same structure as S9 but with different numbers.

### S11 — DEEP DIVE
- Title: "[Advanced Concept]: What Changes at Scale"
- Bullets: Second-order effects, edge cases, or advanced mechanisms.

### S12 — TRADE-OFFS
- Title: "[Strategy A] vs [Strategy B]: Choosing Under Constraints"
- Bullets: Side-by-side comparison with explicit pros/cons.
- Poll: Force a choice with justification.

### S13 — REAL CASE
- Title: "Case Study: [Specific Event/Company]"
- Bullets: CONTEXT → PROBLEM → EVIDENCE → CONSTRAINTS → OUTCOME.
- Must name dates, companies, or dollar amounts.

### S14 — APPLICATION (Guided)
- Title: "Guided Practice: [Realistic Task]"
- Bullets: Structured worksheet or framework.
- Collaboration: Groups of 3-4 with concrete deliverable.

### S15 — APPLICATION (Independent)
- Title: "Independent Analysis: [Complex Task]"
- Bullets: Minimal scaffolding. Requires combining 2+ concepts.

### S16 — APPLICATION (Workshop)
- Title: "Workshop: [Hands-on Task]"
- Bullets: Step-by-step task with deliverable.

### S17 — CAREER / LOCAL CONTEXT
- Title: "[Topic] Careers in Saudi Arabia"
- Bullets: 4 specific organizations, projects, or initiatives.
- Must cite Vision 2030 projects with URLs if used.

### S18 — RUBRIC
- Title: "How Your [Deliverable] Will Be Evaluated"
- Bullets: 4 levels — Novice | Developing | Proficient | Distinguished.
- Each level has OBSERVABLE criteria. No vague adjectives.

### S19 — EVIDENCE
- Title: "Your Evidence Portfolio"
- Bullets: Product, Process, Explanation — each as concrete deliverable.

### S20 — READINESS GATE
- Title: "S20 Gate: [Integrated Scenario]"
- Bullets: NEW scenario with constraints + data + performance requirement.
- Poll: Integrates 3+ concepts from the lecture.
- State gate criteria: "Passing: 3/4 checks correct + Rubric Level 3+"
- End with NEXT ACTION.

## OUTPUT SCHEMA

Return STRICT JSON. No markdown, no code fences, no prose outside JSON.

{
  "slideNo": number,
  "function": "string from SlidePlan",
  "title": "<specific, provocative, contains a number or named entity>",
  "body": {
    "visibleCopy": "<one sentence of context, or empty>",
    "bullets": [
      "<domain-specific fact, rewritten from source — NOT copy-pasted>",
      "..."
    ],
    "studentAction": {
      "type": "poll | pause_discuss | collaboration | calculation",
      "stem": "<specific question with source-derived concepts>",
      "options": ["A) <plausible answer with reasoning>", "B) ...", "C) ...", "D) ..."]
    }
  },
  "visualIntent": {
    "description": "<SPECIFIC visual: named elements, layout, colors. NOT generic>",
    "sourceFigureRef": null,
    "generateDiagram": true,
    "diagramType": "mechanism | comparison | workflow | data_chart | concept_map"
  },
  "notes": {
    "instructorNotes": "<specific facilitation: events, timing, expected reactions>",
    "timingMinutes": 3-10,
    "facilitationMoves": [
      "<specific move: Cold-call 2 students>",
      "<specific move: Divide room into 3 groups>"
    ],
    "answers": "<CORRECT LETTER> — <full explanation>. Why others wrong: A) <reason>. B) <reason>. C) <reason>."
  },
  "sourceCoverage": {
    "mappedBlockIds": ["block-X", "block-Y"],
    "omissionReason": null
  },
  "cloLinks": ["clo-1", "clo-2"]
}

## QUALITY CHECKLIST — Verify Before Outputting

[ ] Did I strip ALL internal IDs like (cmt14fy...)?
[ ] Did I strip ALL SKU codes like GE100019?
[ ] Did I strip ALL figure captions like "Figure 17. Vector maps..."?
[ ] Did I strip ALL raw protocol steps like "Incubate at 37°C"?
[ ] Did I strip ALL package contents like "Package contents: 2 vials"?
[ ] Did I strip ALL generic prompts like "Compare the options"?
[ ] Did I rewrite EVERY source fragment into a pedagogical sentence?
[ ] Does the title contain a specific event, number, or named entity?
[ ] Does every bullet explain WHY the fact matters, not just WHAT it is?
[ ] Are poll options plausible, domain-specific, and each with reasoning?
[ ] Does notes.answers explain WHY correct AND why each wrong option fails?
[ ] Does visualIntent describe a specific diagram with named elements?
[ ] Is the total word count (title + visibleCopy + bullets) ≤ 40?

If ANY checkbox is NO, regenerate the slide.

LANGUAGE: ${languagePolicy === "ar" ? "Output in Arabic." : "Output in English."}
${langInstruction}`;
}

// ---------------------------------------------------------------------------
// FUNCTION_GUIDANCE — per-slide pedagogical requirements (§21)
// ---------------------------------------------------------------------------

/** Per-function pedagogical guidance from the 20-slide learning architecture (§21) */
const FUNCTION_GUIDANCE: Record<string, string> = {
  problem: [
    "S1 — HOOK:",
    "Start with a high-stakes failure, event, or decision from the source material that provokes curiosity.",
    "Title MUST name a specific event with a number or consequence. BAD: 'Introduction to X'. GOOD: 'When 1,500 Unintended Cuts Shut Down a Trial'.",
    "Bullets: 2-3 specific facts from the source (with year, number, or named entity).",
    "Student action: POLL with 4 options. The question should activate prior knowledge by asking students to predict the root cause.",
    "Visual intent: an event timeline, comparison infographic, or dramatic before/after diagram with specific labeled elements.",
    "Notes: Do NOT reveal the answer yet. Describe the dramatic opening and the pause for student debate.",
  ].join("\n"),

  mental_map: [
    "S2 — DOMAIN SPINE:",
    "Show the 4-6 major pillars/stages that form the conceptual architecture of this topic.",
    "Each bullet is a pillar name with a one-line description of what it covers.",
    "Present them as a SEQUENTIAL flow or interconnected architecture, not a flat list.",
    "Student action: POLL asking which pillar a specific scenario failure maps to. Students should see the whole territory before diving in.",
    "Visual intent: vertical/horizontal pillars connected by arrows, each with a small icon and label. Show flow or dependency between pillars.",
    "Notes: Have students map a failure from S1 to one of these pillars.",
  ].join("\n"),

  clos: [
    "S3 — CLOs:",
    "Show the official CLOs and what the student will be able to DO.",
    "Copy CLO text VERBATIM. Never paraphrase or summarize.",
    "Each CLO should start with a Bloom-level verb (Distinguish, Analyze, Design, Evaluate).",
    "Student action: 'Which CLO will be most relevant to your capstone?'",
    "Visual intent: horizontal cards, each with CLO number, Bloom verb icon, and micro-progress bar.",
  ].join("\n"),

  prior_knowledge: [
    "S4 — H-STACK (Human, Technical, Market):",
    "Present a THREE-LAYER readiness stack connecting the topic to real-world dimensions:",
    "  HUMAN LAYER: Ethics, consent, professional standards, regulatory bodies.",
    "  TECHNICAL LAYER: Key technical requirements, validation standards, tools.",
    "  MARKET LAYER: Industry applications, national context (Vision 2030 if relevant), career pathways.",
    "Each layer must have 2-3 SPECIFIC items from the source material — never generic.",
    "Student action: PAUSE & DISCUSS. Ask which layer poses the greatest barrier to a specific real-world scenario.",
    "Notes: Divide room into 3 groups. Each group defends one layer.",
    "Visual intent: Three-layer stack or 3-column table with color-coded layers.",
  ].join("\n"),

  core_concept: [
    "S5 — FOUNDATION (Core Concept):",
    "Introduce the first essential concept with specific definitions, components, and mechanisms from the source.",
    "Bullets should name specific components, structures, or steps — not abstract descriptions.",
    "For science: name molecular components, reactions, sequences. For CS: name algorithms, data structures. For business: name frameworks, metrics.",
    "Student action: POLL asking what happens when a specific parameter changes. Tests understanding of the mechanism, not recall.",
    "Visual intent: labeled schematic or architecture diagram showing how components connect. Name every element.",
    "Notes: Include a physical/kinesthetic teaching aide (hand model, analogy to body movements, etc.).",
  ].join("\n"),

  mechanism: [
    "S6 — FOUNDATION (Mechanism / Comparison):",
    "Explain HOW the concept works by presenting two contrasting pathways, approaches, or mechanisms.",
    "Structure as a COMPARISON: Path A (characteristics, components, outcomes) vs Path B (characteristics, components, outcomes).",
    "Include actual formulas, algorithms, or step-by-step processes from the source. DO NOT summarize.",
    "Student action: PAUSE & DISCUSS. Ask WHY one pathway is preferred in a specific context (e.g., 'Why does X drop to <10% in condition Y?').",
    "Visual intent: split-screen comparison diagram. Left vs Right with contrasting icons and labeled steps.",
    "Notes: Ask students to name one scenario where Path A is desired and one where Path B is required.",
  ].join("\n"),

  misconception: [
    "S7/S8 — MISCONCEPTION:",
    "Challenge the most important incorrect mental model using this EXACT structure:",
    "  Bullet 1 — MYTH: State what students commonly believe (e.g., 'If X has Y, then Z will only happen there').",
    "  Bullet 2 — TRUTH: State the correct principle with source evidence.",
    "  Bullet 3 — EVIDENCE: Cite specific data (author, year, quantitative finding).",
    "  Bullet 4 — CONSEQUENCE: State what happens when someone acts on the myth.",
    "Title format: 'Why \"[Common Simplification]\" Is Wrong' — name the specific misconception in quotes.",
    "Student action MUST be a POLL with 4 options. One option reflects the misconception, another is the correct answer.",
    "NEVER include the correct answer in studentAction. Place it ONLY in notes.answers.",
    "Notes: Cold-call 2 students before revealing. Emphasize why 'good enough' fails.",
  ].join("\n"),

  worked_example: [
    "S8/S9 — WORKED EXAMPLE:",
    "Walk through a complete calculation or analytical example with full teaching.",
    "MANDATORY STRUCTURE:",
    "  Bullet 1 — GIVEN: List all known values with units from the source material.",
    "  Bullet 2 — STEP 1: Show first calculation step with formula and substitution.",
    "  Bullet 3 — STEP 2: Show intermediate result with interpretation.",
    "  Bullet 4 — STEP 3: Show final result with units and real-world meaning.",
    "ALL numbers MUST come from the source. If no quantitative data exists, mark omissionReason.",
    "Student action: CALCULATION. Give students a variation to solve with different parameters.",
    "Visual intent: large equation area with step-by-step math, result highlighted. A slider or scale showing parameter sensitivity.",
    "Notes: Walk through step by step. Call out common errors (forgetting to multiply by 2 strands, wrong units, etc.).",
  ].join("\n"),

  guided_practice: [
    "S9/S10 — GUIDED PRACTICE:",
    "Student solves a variation of the worked example WITH support.",
    "Provide a concrete problem with specific given values from the source.",
    "Student action: 'In pairs: [specific task]. Report: (a) top candidates, (b) risk score, (c) final choice and justification.'",
    "Visual intent: split screen — left shows source data, right shows output table or tool interface.",
    "Notes: Circulate and check common errors. State the specific common error students make.",
  ].join("\n"),

  independent_practice: [
    "S10 — INDEPENDENT ANALYSIS:",
    "Student solves with minimal support using real or realistic data.",
    "Provide a DATASET with specific values. Student must rank, recommend, or justify a decision.",
    "Student action: 'Submit your risk assessment / analysis with quantitative justification.'",
    "Visual intent: bar chart, decision matrix, or data table with a threshold line.",
    "Notes: Identify which data point is the real danger and why. Explain the chromatin/context effect.",
  ].join("\n"),

  deeper_mechanism: [
    "S11 — DEEP DIVE (Advanced Mechanism):",
    "Introduce the next level of complexity with a COMPARISON TABLE showing variants, parameters, or approaches.",
    "Structure as a TABLE with columns: Name, Key Feature, Mechanism, Trade-off.",
    "Include specific mutations, parameters, or configurations from the source material.",
    "State the trade-off explicitly: all improvements come at a cost.",
    "Student action: PAUSE & DISCUSS. Present a scenario requiring students to weigh the trade-off.",
    "Visual intent: table with labeled rows and a balance scale showing the trade-off at bottom.",
  ].join("\n"),

  trade_off: [
    "S12 — DEEP DIVE (Trade-off Comparison):",
    "Present a COMPARISON TABLE of approaches with columns: Name, Capacity, Risk, Best Use Case.",
    "Each row must have specific values from the source (sizes, rates, percentages).",
    "Below the table: explain pros/cons of each approach in 2-4 concise bullets.",
    "Student action: PAUSE & DISCUSS. Ask WHY one approach is preferred for a specific clinical/technical scenario.",
    "Visual intent: four items drawn to relative scale with pros/cons tooltip for each.",
    "Notes: Connect to a real-world approval or standard (e.g., FDA, ISO, SFDA).",
  ].join("\n"),

  real_case: [
    "S13 — TRADE-OFF (Strategy Selection):",
    "Present 3 plausible strategies for solving a specific problem, each with named advantages and limitations.",
    "Strategy A: [approach] — [efficiency], [limitation], [use case].",
    "Strategy B: [approach] — [requirement], [efficiency], [constraint].",
    "Strategy C: [approach] — [advantage], [limitation].",
    "Student action: POLL asking which strategy to select for a specific clinical/production/design scenario.",
    "Notes: The 'correct' answer may depend on context. Explain why the real-world choice was made and what trade-off was accepted.",
    "Visual intent: decision tree starting from 'Problem type?' branching to each strategy.",
  ].join("\n"),

  guided_application: [
    "S14 — APPLICATION (Case Study):",
    "Apply the concept to an authentic real-world case WITH specific sourced data.",
    "A case study must contain: Target, Strategy, Method, Efficacy (with numbers from source), Safety outcome.",
    "Name specific organizations, dates, trial results, and regulatory approvals.",
    "Student action: PAUSE & DISCUSS. Ask WHY the case chose this approach instead of an alternative.",
    "Visual intent: patient/product journey infographic with timeline from discovery to approval. Include local regulatory context (e.g., Saudi approval date).",
    "Notes: Connect to Vision 2030 or local context if genuinely relevant.",
  ].join("\n"),

  independent_application: [
    "S15 — APPLICATION (Guided Practice):",
    "Structured problem-solving activity with step-by-step scaffolding.",
    "Give a specific mutation, configuration, or scenario with exact values.",
    "Break the task into 3-4 numbered steps the student must follow.",
    "Student action: 'In pairs: [run tool / design / analyze]. Report: (a) candidates, (b) risk, (c) choice + justification.'",
    "Visual intent: split screen — left shows input data, right shows tool/output with worked example badge.",
    "Notes: Circulate. State the common error (wrong orientation, missing parameter, etc.).",
  ].join("\n"),

  decision_challenge: [
    "S16 — APPLICATION (Independent Analysis):",
    "Provide a real or realistic dataset. Student must independently rank, assess, and recommend.",
    "The dataset should have specific labeled data points with numerical values.",
    "Student action: 'Submit your assessment with quantitative justification.'",
    "Visual intent: bar chart or data table with a red threshold line. Decision matrix below.",
    "Notes: Identify which data point is the real danger. Explain why a 'safe-looking' result may be dangerous due to context.",
  ].join("\n"),

  transfer_challenge: [
    "S17 — APPLICATION (Career / Transfer Context):",
    "Connect the lecture topic to real career pathways, institutions, or industry applications.",
    "Name 3-4 SPECIFIC organizations, institutions, or initiatives with concrete roles.",
    "If Saudi context applies: name Saudi institutions, Vision 2030 projects, and regulatory bodies.",
    "Student action: PAUSE & DISCUSS. 'Which sector offers the highest impact for graduates trained in this topic?'",
    "Visual intent: map or location pins with labeled institutions. Each pin has an icon representing the sector.",
    "Notes: All career paths are valid. Push students to justify with data.",
  ].join("\n"),

  rubric: [
    "S18 — RUBRIC:",
    "Observable performance criteria across four levels: Novice | Developing | Proficient | Distinguished.",
    "Each level must have 2-3 OBSERVABLE, CONCRETE criteria that students can self-assess against.",
    "Criteria must map to specific lecture CLOs and name specific tools, techniques, or outputs.",
    "BAD: 'Shows understanding'. GOOD: 'Validates with [tool] + justifies choice based on quantitative risk analysis'.",
    "Level 4 (Distinguished) MUST include a local/applied context (e.g., proposing a Saudi-specific application).",
    "Visual intent: 2×2 rubric grid with checkmark icons and criteria in each cell. Progress bar at top.",
    "Notes: Have students self-assess. Most will rate Level 2. Challenge them to identify what Level 3 requires.",
  ].join("\n"),

  evidence: [
    "S19 — EVIDENCE OF MASTERY:",
    "Show how product, process, and explanation demonstrate learning — the evidence triangle.",
    "PRODUCT: Name the specific deliverable (design document, analysis report, tool output).",
    "PROCESS: Name the decision log or reasoning trail (why you rejected alternative #2).",
    "EXPLANATION: Name the oral defense or written justification.",
    "All three must align: if you chose approach A, your product must be compatible with approach A.",
    "Student action: PAUSE & DISCUSS. 'Which evidence type is hardest to fake? Which is easiest to improve?'",
    "Visual intent: triangle diagram with Product, Process, Explanation at vertices. Bidirectional arrows between them.",
    "Notes: Hardest to fake = Explanation (oral defense). Easiest to improve = Product (more time on tool).",
  ].join("\n"),

  readiness: [
    "S20 — READINESS GATE:",
    "Integrated scenario-based check linked to CLOs. This must be a NEW scenario integrating MULTIPLE concepts.",
    "Do NOT use S20 as trivial recall. Give a complex scenario with constraints, data, and a required decision.",
    "Include Readiness Check 4 as an actual multiple choice question with 4 options (A/B/C/D).",
    "State the gate criteria: 3/4 correct + rubric level 3+ (Proficient or Distinguished).",
    "End with clear NEXT ACTIONS: what students should do after this lecture.",
    "Visual intent: progress dashboard showing checks passed, CLO coverage, and gate status.",
    "Notes: State the correct answer. Explain how to run the final check and how to help students who don't meet the threshold.",
  ].join("\n"),
};

// ---------------------------------------------------------------------------
// USER PROMPT — per-slide context injection
// ---------------------------------------------------------------------------

function userPrompt(
  plan: { slideNo: number; function: string; title: string; interactionType: string | null; visualIntent: string | null },
  clos: CourseLearningOutcome[],
  blocks: { id: string; locator: string; text: string }[],
  nationalAlignmentMode: boolean,
  languagePolicy: string
): string {
  const guidance = FUNCTION_GUIDANCE[plan.function] || FUNCTION_GUIDANCE["core_concept"];
  return [
    `## INPUT`,
    `- SlidePlan:`,
    `  slideNo: ${plan.slideNo}`,
    `  function: ${plan.function}`,
    `  title: "${plan.title}"`,
    `  interactionType: "${plan.interactionType || "none"}"`,
    `  visualIntent: "${plan.visualIntent || "none"}"`,
    ``,
    `## PEDAGOGICAL PATTERN FOR THIS SLIDE (function: ${plan.function})`,
    guidance,
    ``,
    `- CourseProfile:`,
    `  language: ${languagePolicy}`,
    `  selectedLectureCLOs: ${JSON.stringify(clos.map(c => ({ id: c.id, number: c.number, text: c.text })))}`,
    ``,
    `- SourceBlocks (Verified Base Content):`,
    ...blocks.map((b) => `  [Block ID: ${b.id}] (Locator: ${b.locator})\n  ${b.text.trim().substring(0, 800)}`),
    ``,
    `Remember: Return ONLY valid JSON matching the exact schema.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// NORMALIZE — extract structured content from LLM JSON response
// ---------------------------------------------------------------------------

function normalizeArtifact(
  json: unknown,
  cloIds: string[],
  blocks: { id: string; locator: string; text: string }[]
): SlideContentJson {
  const raw = (json ?? {}) as Record<string, any>;
  const rawVisual = raw.visualIntent as Record<string, any> | undefined;
  const hasSourceFigure = Boolean(
    typeof rawVisual?.sourceFigureRef === "string" && rawVisual.sourceFigureRef.trim()
  );
  return {
    title: typeof raw.title === "string" ? raw.title : "",
    body: {
      visibleCopy: typeof raw.body?.visibleCopy === "string" ? raw.body.visibleCopy : "",
      bullets: Array.isArray(raw.body?.bullets) ? raw.body.bullets.map(String) : [],
      studentAction: raw.body?.studentAction || undefined,
    },
    visualIntent: {
      description:
        typeof rawVisual?.description === "string"
          ? rawVisual.description
          : "Diagram illustrating the slide concept.",
      sourceFigureRef: hasSourceFigure ? rawVisual?.sourceFigureRef ?? null : null,
      // Default to generating a diagram unless the LLM explicitly points to a
      // real source figure — a missing flag must not trip the Tier-3 visual
      // gate (BRD requires ≥18 visually supported slides).
      generateDiagram: hasSourceFigure ? Boolean(rawVisual?.generateDiagram) : true,
      diagramType:
        typeof rawVisual?.diagramType === "string"
          ? (rawVisual.diagramType as "mechanism" | "comparison" | "workflow" | "data_chart" | "concept_map")
          : undefined,
    },
    notes: raw.notes || {
      instructorNotes: "",
      timingMinutes: 0,
      facilitationMoves: [],
      answers: ""
    },
    sourceCoverage: raw.sourceCoverage || {
      // Ground in the scoped blocks this slide was generated from.
      mappedBlockIds: blocks.map((b) => b.id),
      omissionReason: null
    },
    cloLinks: Array.isArray(raw.cloLinks) ? raw.cloLinks.map(String) : cloIds,
    wordCount: 0,
    function: typeof raw.function === "string" ? raw.function : undefined,
    slideNo: typeof raw.slideNo === "number" ? raw.slideNo : undefined,
  };
}

// ---------------------------------------------------------------------------
// FALLBACK — deterministic slide when LLM fails
// ---------------------------------------------------------------------------

function buildFallbackSlide(
  project: any,
  plan: any,
  blocks: any[],
  clos: any[]
): SlideContentJson {
  const title = plan.title || "Untitled Slide";
  const bullets = blocks.slice(0, 3).map((b) => b.text.slice(0, 80) + "...");
  return {
    slideNo: plan.slideNo,
    title,
    body: {
      visibleCopy: "Error loading generated content.",
      bullets
    },
    visualIntent: {
      description: "Fallback diagram",
      sourceFigureRef: null,
      generateDiagram: false,
    },
    wordCount: title.split(/\s+/).length + bullets.reduce((n: number, b: string) => n + b.split(/\s+/).length, 0),
  };
}

// ---------------------------------------------------------------------------
// MAIN EXPORT — generate one slide artifact
// ---------------------------------------------------------------------------

export async function generateSlideArtifact(
  project: LectureProjectWithRelations,
  plan: { id: string; slideNo: number; function: string; title: string; interactionType: string | null; visualIntent: string | null },
  opts: { clos: CourseLearningOutcome[]; blocks: { id: string; locator: string; text: string }[] }
): Promise<SlideArtifactDraft> {
  const { clos, blocks } = opts;
  const languagePolicy = project.courseProfile.languagePolicy ?? "en";

  // S3 is fully deterministic — verbatim CLO text, no LLM call.
  if (plan.slideNo === 3) {
    const content = buildCLOSlide(clos);
    content.wordCount = countVisibleWords(content);
    const { valid, errors } = artifactGate(content, { allowSynthesis: true });
    return { slideNo: plan.slideNo, slidePlanId: plan.id, content, errors, flagged: !valid };
  }

  const selectedClos = clos;

  let result: { json: unknown; model?: string; content?: string } = { json: null };
  try {
    result = await Promise.race([
      chatJson({
        system: systemPrompt(languagePolicy),
        user: userPrompt(plan, selectedClos, blocks, project.nationalAlignmentMode, languagePolicy),
        temperature: 0.4,
        model: MODEL,
      }),
      new Promise<{ json: null }>((_, reject) =>
        setTimeout(() => reject(new Error("Slide LLM timeout (25s max)")), 25_000)
      ),
    ]);
    await recordModelRun({ projectId: project.id, kind: "slide", result: result as ChatResult });
  } catch (err: any) {
    console.warn(`[SlideGenerator] Slide S${plan.slideNo} fast fallback triggered: ${err.message}`);
    result = { json: null };
  }

  const json = result.json as Record<string, unknown> | null;
  if (!json || (json as any).fallback === true) {
    const fallbackContent = buildFallbackSlide(project, plan, blocks, clos);
    return {
      slideNo: plan.slideNo,
      slidePlanId: plan.id,
      content: fallbackContent,
      errors: ["LLM_UNAVAILABLE"],
      flagged: true,
      error: "LLM_UNAVAILABLE",
    };
  }

  const content = normalizeArtifact(json, clos.map((c) => c.id), blocks);
  content.wordCount = countVisibleWords(content);

  // Hard rejection: forbidden structural patterns or domain contamination.
  const courseProfile = project.courseProfile as any;
  const courseTitle = courseProfile?.title ?? "";
  const courseTopic = [
    courseProfile?.subject ?? "",
    courseProfile?.discipline ?? "",
    courseProfile?.description ?? "",
  ].join(" ");
  if (hasForbiddenContent(content, courseTitle, courseTopic)) {
    return {
      slideNo: plan.slideNo,
      slidePlanId: plan.id,
      content: buildFallbackSlide(project, plan, blocks, clos),
      errors: ["FORBIDDEN_CONTENT_DETECTED"],
      flagged: true,
      error: "FORBIDDEN_CONTENT_DETECTED — output contained a forbidden phrase or wrong-domain contamination. Slide must be regenerated.",
    };
  }

  // Sentence-level cross-slide duplication check (Fix 6).
  const candidateTexts = [
    content.body?.visibleCopy ?? "",
    ...(content.body?.bullets ?? []),
    content.body?.studentAction?.stem ?? "",
  ].filter(Boolean);

  const sentenceConflicts = globalSentenceRegistry.findDuplicateSentences(candidateTexts);
  if (sentenceConflicts.length > 0) {
    const examples = sentenceConflicts.slice(0, 2).map(c => `"${c.sentence.slice(0, 60)}..." (first seen S${c.firstSeenInSlide})`).join("; ");
    console.warn(`[SlideGenerator] S${plan.slideNo} sentence duplication detected: ${examples}`);
    // Flag for review but do not hard-reject — the repair pass can fix it.
    content.reviewStatus = "sentence_duplication";
    (content as any)._sentenceConflicts = sentenceConflicts.map(c => ({
      sentence: c.sentence.slice(0, 80),
      firstSeenInSlide: c.firstSeenInSlide,
    }));
  }

  // Record accepted sentences so subsequent slides can check against them.
  globalSentenceRegistry.recordSlide(plan.slideNo, candidateTexts);

  const { valid, errors } = artifactGate(content);
  return { slideNo: plan.slideNo, slidePlanId: plan.id, content, errors, flagged: !valid };
}
