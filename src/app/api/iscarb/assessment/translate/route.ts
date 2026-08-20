import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { chatJson, withTimeout } from "@/lib/ai-engine";

/**
 * POST /api/iscarb/assessment/translate
 *
 * Auth + AI-tier rate limit required (ISC-QA-011). Never expose as a public
 * LLM proxy.
 */
export const POST = guard(
  { tier: "ai", roles: ["student", "faculty", "admin"] },
  async (req) => {
    try {
      const body = await req.json();
      const { scenario, instructions, choices } = body;

      if (!scenario && !instructions && !choices) {
        return NextResponse.json({ error: "No text to translate" }, { status: 400 });
      }

      const system = `You are an expert professional translator for a Saudi tech/business audience.
Translate the following assessment question components from English to Arabic.
Maintain professional, clear, and natural phrasing. Ensure technical terms are translated appropriately or kept in English if that is the industry standard in Saudi Arabia.
Return STRICT JSON: { "scenarioAr": "...", "instructionsAr": "...", "choicesAr": ["...", "...", "...", "..."] }`;

      const user = `Scenario: ${scenario || ""}
Instructions: ${instructions || ""}
Choices: ${(choices || []).join(" | ")}`;

      const { json } = await withTimeout(
        chatJson({
          system,
          user,
          temperature: 0.3,
          guardrails: false,
          model:
            process.env.EXAM_LIVE_GENERATION_MODEL ||
            process.env.OPENAI_CHAT_MODEL ||
            "meta/llama-3.1-8b-instruct",
        }),
        30_000,
        "question-translate",
      );

      const parsed = json as {
        scenarioAr?: string;
        instructionsAr?: string;
        choicesAr?: string[];
      };

      return NextResponse.json({
        scenarioAr: parsed.scenarioAr || null,
        instructionsAr: parsed.instructionsAr || null,
        choicesAr: parsed.choicesAr || null,
      });
    } catch (err) {
      console.error("[translation error]", err);
      return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }
  },
);
