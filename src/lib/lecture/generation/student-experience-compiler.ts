import { z } from "zod";
import { chatJson } from "@/lib/ai-engine";

// Define the schema for the Student Experience Compiler output
export const StudentExperienceSchema = z.object({
  cardType: z.enum(["concept", "worked_example", "case_study", "assessment", "reflection"]),
  headline: z.string().max(80).describe("Short, specific headline <= 8 words"),
  hook: z.string().describe("One sentence connecting this to a real-world scenario with a specific event, number, or consequence"),
  coreContent: z.object({
    explanation: z.string().describe("<= 3 sentences explaining the concept using ONLY source-derived facts"),
    analogy: z.string().nullable().describe("One domain-specific analogy from the source material or a well-known system in this field"),
    diagramDescription: z.string().nullable().describe("alt-text for the visual"),
  }),
  interactive: z.object({
    type: z.enum(["poll", "calculation", "drag_drop", "reflection"]),
    prompt: z.string().describe("specific question"),
    options: z.array(z.string()).optional().describe("4 options if poll"),
    hints: z.array(z.string()).describe("Progressive hints: structural cue, partial mechanism, near-answer"),
    reveal: z.object({
      correct: z.string().describe("The correct answer letter (e.g., 'B')"),
      explanation: z.string().describe("Full explanation of WHY the correct answer is correct, with source evidence"),
      whyOthersWrong: z.record(z.string()).optional().describe("Map of wrong option letter to explanation, e.g., { A: 'reason', C: 'reason' }"),
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
You are the Student Experience Compiler. You transform ONE approved SlideArtifact into an interactive 
student-facing learning card. You do NOT generate placeholder text. If the source is insufficient, 
you MUST say so explicitly by setting insufficientSource to true and reducing the card scope.

## STRICT RULES
1. NO PLACEHOLDERS: If you cannot write a field from the source, set it to null and add 
   "insufficientSource": true. Never write "Review the source material" or "Review pending."
2. ANALOGY: Must be domain-specific to the course subject. Bad: "Think of it like a car engine." 
   Good: An analogy that uses concepts from the same academic domain as the course.
3. HINTS: Must progressively reveal structure. 
   Hint 1: Vague structural cue. Hint 2: Partial mechanism. Hint 3: Near-answer.
   Never repeat the same hint.
4. REVEAL: Must include a structured object with:
   - correct: the correct answer letter (e.g., "B")
   - explanation: full explanation of WHY correct, using source block evidence
   - whyOthersWrong: a map of wrong option letters to explanations (e.g., { "A": "reason", "C": "reason" })
5. REAL WORLD: If using Vision 2030, cite the exact project URL. If inferred, label "system-suggested."
6. NO GENERIC PITFALLS: Never use "Confusion about how [X] differs from similar concepts." 
   Name the specific confusion.
7. NO INTERNAL IDs: NEVER include blockId, artifactId, sourceBlockId, or any hash/CUID string 
   in any student-facing field. If you need to reference a source, write "your lecture notes" 
   or "the source material" — never an identifier.
8. NO PLACEHOLDERS IN HOOK: The hook must contain a specific number, event, or consequence. 
   BAD: "This topic is important." GOOD: "In 2018, a trial was halted when 1,500 off-target cuts 
   were found in a patient's genome."
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
