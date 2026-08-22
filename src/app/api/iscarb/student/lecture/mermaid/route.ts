import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { chatText } from "@/lib/ai-engine";

/**
 * Sanitize Mermaid code by ensuring all node labels are properly quoted.
 * Fixes common LLM mistakes like unquoted special characters.
 */
function sanitizeMermaid(code: string): string {
  const lines = code.split("\n");
  const sanitized: string[] = [];

  for (const line of lines) {
    // Match node definitions like: A[label] or A(label) or A --> B
    // and ensure labels with special chars are quoted
    let fixed = line
      // Fix unquoted brackets: A[some text with (parens)] -> A["some text with (parens)"]
      .replace(/\b([A-Za-z0-9_-]+)\[((?!\"|\')[^\]]+)\]/g, (_match, id, label) => {
        // If label doesn't start with a quote, wrap it
        if (label.startsWith('\"') || label.startsWith("'")) return _match;
        // Escape any existing quotes inside
        const safeLabel = label.replace(/\"/g, "\\\"");
        return `${id}["${safeLabel}"]`;
      })
      // Fix unquoted parens: A(some text) -> A["some text"]
      .replace(/\b([A-Za-z0-9_-]+)\(([^)]+)\)/g, (_match, id, label) => {
        if (label.startsWith('\"') || label.startsWith("'")) return _match;
        const safeLabel = label.replace(/\"/g, "\\\"");
        return `${id}["${safeLabel}"]`;
      });

    sanitized.push(fixed);
  }

  return sanitized.join("\n");
}

export const POST = guard(
  { tier: "ai", roles: ["student", "faculty", "admin"] },
  async (req: Request) => {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { conceptTitle, explanation, mechanismSteps } = body as Record<string, unknown>;

    const title = typeof conceptTitle === "string" ? conceptTitle : "Concept";
    const expl = typeof explanation === "string" ? explanation : "";
    const steps = Array.isArray(mechanismSteps) ? mechanismSteps.join("\n") : "";

    const systemPrompt = `You are an expert at creating clear, educational Mermaid flowcharts.

CRITICAL SYNTAX RULES:
1. Use ONLY graph TD (top-down) or graph LR (left-right)
2. Node labels MUST be wrapped in double quotes: A["Label text here"]
3. NEVER put unquoted special characters (parentheses, quotes, colons, slashes) in node labels
4. Use simple arrow syntax: A --> B or A -.-> B
5. Example of CORRECT syntax:
   graph TD
     A["Step 1: Select DNA"] --> B["Step 2: Cut with enzyme"]
     B --> C["Step 3: Ligate fragments"]
     C --> D["Step 4: Verify construct"]

6. Example of BROKEN syntax (NEVER do this):
   graph TD
     A[Step 1: Select DNA] --> B[Step 2: Cut]
     A --> C(What happens?)

ONLY output the raw Mermaid code. No markdown fences, no explanation.`;

    const userPrompt = `Create a Mermaid flowchart for this concept:\nTitle: ${title}\nExplanation: ${expl.slice(0, 400)}\nSteps: ${steps.slice(0, 400)}`;

    const result = await chatText({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.2,
      guardrails: false
    });

    let mermaidCode = result.content.trim();
    if (mermaidCode.startsWith("```mermaid")) {
      mermaidCode = mermaidCode.replace(/```mermaid\n?/g, "").replace(/```$/g, "").trim();
    }

    // Sanitize: quote all node labels that contain unquoted special characters
    mermaidCode = sanitizeMermaid(mermaidCode);

    return NextResponse.json({ mermaidCode, model: result.model }, { status: 200 });
  }
);
