/**
 * AI Concept Tutor Chat — serves tutor replies & hints for the student
 * learning experience.
 * ===========================================================================
 * POST /api/iscarb/student/lecture/tutor-chat
 * Body: {
 *   mode: "explain_simple" | "analogy" | "step_by_step" | "quiz_me" | "custom" | "hint",
 *   userMessage: string,
 *   conceptTitle: string,
 *   stageName?: string,
 *   coreInsight?: string,
 *   mentalModel?: { analogy: string },
 *   mechanism?: string,
 *   visualCaption?: string,
 *   assessmentStem?: string,
 * }
 *
 * Returns: { reply: string }
 */
import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { chatText } from "@/lib/ai-engine";

function unwrapReply(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed.replace(/```json\s*/gi, "").replace(/```/g, ""));
      if (parsed && typeof parsed === "object") {
        for (const key of ["analogy", "explanation", "reply", "text", "message", "answer", "mapping"]) {
          if (typeof parsed[key] === "string") return parsed[key];
        }
        if (Array.isArray(parsed.explanation)) {
          const parts = parsed.explanation
            .filter((p: unknown) => typeof p === "string")
            .map((p: string) => p.trim())
            .filter(Boolean);
          if (parts.length) return parts.map((p: string) => `• ${p}`).join("\n");
        }
      }
    } catch {
      // Not actually JSON — fall through to raw text.
    }
  }
  return content;
}

const MODE_PROMPTS: Record<string, string> = {
  explain_simple:
    "You are a deep, patient tutor helping a university student truly UNDERSTAND a concept. Explain in clear language with ZERO jargon. Structure: What it is → How it works → Why it matters → What breaks when it fails. Use 4-6 bullet points. Ground every claim in the source material provided.",
  analogy:
    "You are a creative tutor. Give ONE vivid, domain-specific analogy that maps EVERY PART of the analogy to the concept. Show the mapping explicitly. For example: 'EcoRI is like scissors that cut paper at a specific word — but the word must appear on both pages (palindrome), and the cut must be offset (sticky ends) so the two pages can interlock when pasted back together.' Make the analogy concrete and memorable.",
  step_by_step:
    "You are a methodical tutor. Explain the mechanism step-by-step as numbered points, from prerequisite to application. Each step must build on the previous one. End with: 'This is why understanding this mechanism matters: [one-line insight].' Ground each step in the source material.",
  quiz_me:
    "You are an engaging tutor. Ask ONE scenario-based multiple-choice question that tests MECHANISM understanding (not recall). Present a specific scenario where the student must reason about what would happen. Give exactly four options (A-D). Distractors must represent REAL misconceptions students actually hold. After the options, give a brief strategic hint — do not reveal the answer.",
  hint:
    "You are a supportive tutor giving a hint for a practice question. Do NOT give away the full answer. Give one strategic nudge that points toward the MECHANISM the student needs to reason about. Phrase as a question or short steer, in 1-2 sentences.",
  custom:
    "You are a deep, patient AI tutor helping a university student truly understand a lecture concept. Answer their question directly using the source material provided. Ground your explanation in the specific facts, mechanisms, and examples from the source. Use short paragraphs or bullet points. When explaining mechanisms, use numbered steps. When the student asks 'why', trace the causal chain. Keep responses focused, accurate, and source-grounded.",
};

export const POST = guard(
  { tier: "ai", roles: ["student", "faculty", "admin"] },
  async (req: Request) => {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      mode,
      userMessage,
      conceptTitle,
      stageName,
      coreInsight,
      mentalModel,
      mechanism,
      mechanismSteps,
      visualCaption,
      hook,
      commonPitfalls,
      realWorld,
      sourceBlocks,
      assessmentStem,
    } = body as Record<string, unknown>;

    const userPrompt = typeof userMessage === "string" && userMessage.trim()
      ? userMessage.trim()
      : "Explain this concept in simple terms.";
    const title = typeof conceptTitle === "string" ? conceptTitle : "this concept";
    const modeKey = typeof mode === "string" && MODE_PROMPTS[mode] ? mode : "custom";
    const stage = typeof stageName === "string" ? stageName : "";
    const insight = typeof coreInsight === "string" ? coreInsight : "";
    const analogy =
      mentalModel && typeof mentalModel === "object"
        ? (mentalModel as { analogy?: unknown }).analogy
        : undefined;
    const analogyText = typeof analogy === "string" ? analogy : "";
    const mech = typeof mechanism === "string" ? mechanism : "";
    const caption = typeof visualCaption === "string" ? visualCaption : "";
    const stem = typeof assessmentStem === "string" ? assessmentStem : "";

    const mechSteps = Array.isArray(mechanismSteps) ? mechanismSteps.filter((s: unknown) => typeof s === "string").join(" → ") : "";
    const pitfalls = Array.isArray(commonPitfalls) ? commonPitfalls.map((p: any) =>
      `Misconception: ${p.misconception || ""}. Why wrong: ${p.whyWrong || ""}. Better: ${p.betterWay || ""}`
    ).join("; ") : "";
    const hookText = typeof hook === "string" ? hook : "";
    const rw = typeof realWorld === "string" ? realWorld : "";
    const srcBlocks = Array.isArray(sourceBlocks)
      ? sourceBlocks.filter((b: any) => typeof b === "object" && b?.text).map((b: any) => b.text.slice(0, 300)).join("; ")
      : "";

    const context = [
      `Concept: "${title}"${stage ? ` (stage: ${stage})` : ""}`,
      hookText ? `Scenario/Hook: ${hookText}` : "",
      insight ? `Core insight: ${insight}` : "",
      mech ? `Mechanism: ${mech.slice(0, 600)}` : "",
      mechSteps ? `Mechanism steps: ${mechSteps}` : "",
      analogyText ? `Analogy used in lesson: ${analogyText}` : "",
      caption ? `Visual caption: ${caption}` : "",
      pitfalls ? `Common misconceptions: ${pitfalls}` : "",
      rw ? `Real-world application: ${rw}` : "",
      srcBlocks ? `Source material excerpts: ${srcBlocks}` : "",
      stem ? `The practice question being attempted: ${stem}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const system = MODE_PROMPTS[modeKey];
    const user = context ? `${context}\n\nStudent request: ${userPrompt}` : userPrompt;

    const result = await chatText({ system, user, temperature: 0.6, guardrails: false });

    return NextResponse.json(
      {
        reply: unwrapReply(result.content),
        model: result.model,
      },
      { status: 200 }
    );
  }
);