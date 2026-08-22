import { z } from "zod";
import { chatJson } from "@/lib/ai-engine";

// Define the schema for the Student Experience Compiler output
export const StudentExperienceSchema = z.object({
  cardType: z.enum(["concept", "worked_example", "case_study", "assessment", "reflection"]),
  headline: z.string().max(80).describe("Short, specific headline <= 8 words"),
  hook: z.string().describe("A specific scenario that creates curiosity: what went wrong, a real consequence, or a decision the learner must make. Must include a specific event, number, or named entity."),
  coreContent: z.object({
    explanation: z.string().describe("3-5 sentences explaining: What it is → How it works → Why it matters → What breaks when it fails. Use ONLY source-derived facts."),
    analogy: z.string().nullable().describe("A vivid, domain-specific analogy where EVERY PART of the analogy maps to the concept. Not generic (not 'like a car engine')."),
    diagramDescription: z.string().nullable().describe("alt-text for the visual"),
    steps: z.array(z.string()).optional().describe("3-5 numbered steps showing the mechanism or process sequence. Each step builds on the previous one."),
  }),
  interactive: z.object({
    type: z.enum(["poll", "calculation", "drag_drop", "reflection"]),
    prompt: z.string().describe("A scenario-based question that tests MECHANISM understanding, not recall. Must present a specific scenario where the student must reason about what would happen."),
    options: z.array(z.string()).optional().describe("4 options if poll. Each distractor must represent a REAL misconception."),
    hints: z.array(z.string()).describe("Progressive hints: 1) structural cue (what category of problem), 2) partial mechanism (first step of reasoning), 3) near-answer (all but final step). Never repeat the same hint."),
    reveal: z.object({
      correct: z.string().describe("The correct answer letter (e.g., 'B')"),
      explanation: z.string().describe("Full explanation of WHY the correct answer is correct, using source evidence and tracing the causal chain"),
      whyOthersWrong: z.record(z.string()).optional().describe("Map of wrong option letter to explanation of WHY it's wrong (e.g., { 'A': 'reason it fails', 'C': 'reason it fails' })"),
    }),
  }).nullable(),
  commonPitfalls: z.array(z.object({
    misconception: z.string().describe("specific wrong belief from source material"),
    whyWrong: z.string().describe("explanation using source evidence"),
    betterWay: z.string().describe("correct approach from source"),
  })),
  realWorld: z.object({
    application: z.string().describe("specific application from source or Vision 2030 context"),
    sourceUrl: z.string().nullable().describe("url if from Vision 2030"),
    derivedLabel: z.enum(["system-suggested", "official-source"]),
  }).nullable(),
  insufficientSource: z.boolean().optional().describe("Set to true if source material is insufficient to generate these fields"),
});

export type StudentExperienceResult = z.infer<typeof StudentExperienceSchema>;

// ---------------------------------------------------------------------------
// SANITIZE FOR STUDENT — strip ALL internal IDs before any student-facing render.
//
// Removes:
//   • Parenthesised hash IDs leaked from blockId/artifactId fields,
//     e.g. " (cmt14fy1g0009onsbby7pm5q9)" or "(block-5)"
//   • Bare "block-<id>" references that must never reach students
//   • Any 20+ char alphanumeric strings that look like CUID/UUID primary keys
// ---------------------------------------------------------------------------
export function sanitizeForStudent(artifact: unknown): unknown {
  if (!artifact) return artifact;
  let serialized = JSON.stringify(artifact);

  // Remove " (cmt14fy...)" style parenthesised IDs (20+ alphanumeric chars)
  serialized = serialized.replace(/\s*\([a-z0-9]{20,}\)/g, "");

  // Remove bare block-<id> references
  serialized = serialized.replace(/\bblock-[a-z0-9_-]+/gi, "");

  // Remove any residual UUID/CUID that leaked into a visible string value
  // Pattern: 20+ consecutive lowercase alphanumeric chars (typical CUID)
  // Guard: only strip when surrounded by whitespace or at string boundaries
  // inside a JSON string value so we don't corrupt field names.
  serialized = serialized.replace(/"([^"]*)[a-z0-9]{24,}([^"]*)"/g, (_match, pre, post) => {
    return `"${pre.trim()}${post.trim()}"`;
  });

  try {
    return JSON.parse(serialized);
  } catch {
    // If re-parsing fails for any reason, return the original — safety first.
    return artifact;
  }
}

export async function compileStudentExperience(
  slideArtifact: any,
  sourceBlocks: any[],
  viewMode: "preview" | "full" = "full"
): Promise<StudentExperienceResult> {

  const systemPrompt = `
## ROLE
You are the Student Experience Compiler. You transform ONE approved SlideArtifact into a DEEP, 
INTERACTIVE student-facing learning card that teaches mastery — not just awareness.

## PEDAGOGICAL PHILOSOPHY
Every student who reads this card must be able to:
1. Explain the concept in their own words
2. Apply it to a novel problem
3. Recognize when someone else gets it wrong

You do NOT generate placeholder text. If the source is insufficient, 
you MUST say so explicitly by setting insufficientSource to true and reducing the card scope.

## STRICT RULES
1. NO PLACEHOLDERS: If you cannot write a field from the source, set it to null and add 
   "insufficientSource": true. Never write "Review the source material" or "Review pending."

2. EXPLANATION DEPTH: 3-5 sentences explaining the concept using ONLY source-derived facts.
   Structure: What it is → How it works → Why it matters → What breaks when it fails.
   Bad: "Restriction enzymes cut DNA at specific sites."
   Good: "EcoRI recognizes the palindromic sequence GAATTC and cuts between G and A on both strands, 
   producing 4-nucleotide sticky ends. These overhangs are crucial because they allow the cut DNA 
   to base-pair with any other EcoRI-cut fragment — enabling recombinant DNA construction. Without 
   sticky ends, ligation efficiency drops below 1%."

3. ANALOGY: Must be domain-specific to the course subject. Bad: "Think of it like a car engine." 
   Good: An analogy that maps EVERY PART of the analogy to the concept.
   Example: "EcoRI is like scissors that cut paper at a specific word — but the word must appear 
   on both pages (palindrome), and the cut must be offset (sticky ends) so the two pages can 
   interlock when pasted back together."

4. HINTS: Must progressively reveal the MECHANISM.
   Hint 1: Structural cue (what category of problem this is).
   Hint 2: Partial mechanism (the first step of the reasoning chain).
   Hint 3: Near-answer (all but the final step explained).
   Never repeat the same hint. Never give the answer.

5. REVEAL: Must include a structured object with:
   - correct: the correct answer letter (e.g., "B")
   - explanation: full explanation of WHY correct, using source block evidence
   - whyOthersWrong: a map of wrong option letters to explanations (e.g., { "A": "reason", "C": "reason" })

6. PITFALLS: Must name a SPECIFIC wrong belief and WHY it's wrong.
   Bad: "Confusion about how [X] differs from similar concepts."
   Good: "Students often think EcoRI cuts both strands at the SAME position (blunt ends). 
   In reality, it cuts at offset positions on opposite strands, creating 4-nucleotide overhangs 
   (sticky ends). This difference is critical: blunt-end ligation is 10-100x less efficient."

7. REAL WORLD: If using Vision 2030, cite the exact project URL. If inferred, label "system-suggested."

8. NO INTERNAL IDs: NEVER include blockId, artifactId, sourceBlockId, or any hash/CUID string 
   in any student-facing field. If you need to reference a source, write "your lecture notes" 
   or "the source material" — never an identifier.

9. NO PLACEHOLDERS IN HOOK: The hook must contain a specific number, event, or consequence. 
   BAD: "This topic is important." GOOD: "In 2018, a trial was halted when 1,500 off-target cuts 
   were found in a patient's genome."

10. QUESTION QUALITY: The interactive prompt must test MECHANISM understanding, not recall.
    BAD: "What is recombinant cloning?"
    GOOD: "If you cut a plasmid with EcoRI but the insert was cut with BamHI, the sticky ends 
    are incompatible. Which strategy would allow these fragments to still be ligated?"
    Distractors must represent REAL misconceptions.

11. STEP-BY-STEP: If the concept involves a process or mechanism, include 3-5 numbered steps 
    in the explanation showing the sequence of events.

12. SOURCE GROUNDING: Every factual claim in the card must come from the source blocks. 
    If a claim has no source support, mark it as hypothetical or remove it.

13. FORMULAS AND EQUATIONS: When the concept involves math, physics, or chemistry formulas:
    - ALWAYS use LaTeX notation: $F = ma$, $E = mc^2$, $\Delta G = -RT \ln K_{eq}$
    - Explain every variable immediately after: "$F$ is force (N), $m$ is mass (kg), $a$ is acceleration (m/s²)"
    - For step-by-step derivations, use $$ for display mode:
      $$F = ma$$
      $$W = F \cdot d = mad$$
    - For chemistry: $\text{CH}_3\text{COOH} + \text{NaOH} \rightarrow \text{CH}_3\text{COONa} + \text{H}_2\text{O}$
    - For DNA: $5'-\text{GAATTC}-3'$
    - NEVER write formulas as plain text like "F = ma" — always use $F = ma$
    - The system renders LaTeX automatically via KaTeX
  `;

  // Sanitize artifact and source blocks before sending to LLM so IDs never
  // appear in the model's context window for student-facing generation.
  const sanitizedArtifact = sanitizeForStudent(slideArtifact);
  const inputPayload = JSON.stringify({
    slideArtifact: sanitizedArtifact,
    // Only expose block text — never block IDs — to the student experience LLM.
    sourceBlocks: sourceBlocks.map(b => ({ text: b.text })),
    viewMode
  }, null, 2);

  const result = await chatJson({
    system: systemPrompt + "\n\nReturn ONLY valid JSON matching the exact schema.",
    user: `Generate the student experience JSON for this slide artifact:\n\n${inputPayload}`,
    temperature: 0.2,
  });

  const parsed = StudentExperienceSchema.parse(result.json);
  // Final sanitization pass — strip any IDs that leaked through the LLM output.
  return sanitizeForStudent(parsed) as StudentExperienceResult;
}
