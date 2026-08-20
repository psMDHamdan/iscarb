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
    "You are a patient, simple tutor. Explain the concept in clear, everyday language with ZERO jargon. Use short sentences and plain words a university student would understand. Structure the reply as 3-6 short bullet points.",
  analogy:
    "You are a creative tutor. Give ONE memorable, concrete real-world analogy that captures the heart of this concept, then briefly explain how each part of the analogy maps to the concept. Keep it warm and vivid.",
  step_by_step:
    "You are a methodical tutor. Explain the concept step-by-step as numbered points, from foundation to detail. Each step must be one clean idea. End with a one-line takeaway.",
  quiz_me:
    "You are an engaging tutor. Ask ONE focused multiple-choice question that checks understanding of this concept, with exactly four options (A-D). After the options, give a brief hint — do not reveal the answer yet.",
  hint:
    "You are a supportive tutor giving a hint for a practice question. Do NOT give away the full answer. Give one strategic nudge, phrased as a question or a short steer, in 1-2 sentences.",
  custom:
    "You are a warm, patient AI tutor helping a university student understand a lecture concept. Answer their question directly in simple, clear language. Use short paragraphs or bullet points. Keep responses focused and friendly.",
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
      visualCaption,
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

    const context = [
      `Concept: "${title}"${stage ? ` (stage: ${stage})` : ""}`,
      insight ? `Core insight: ${insight}` : "",
      analogyText ? `Analogy used in lesson: ${analogyText}` : "",
      mech ? `Mechanism: ${mech.slice(0, 600)}` : "",
      caption ? `Visual caption: ${caption}` : "",
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