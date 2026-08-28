import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { chatJsonRaw } from "@/lib/ai-engine";
import { apiError } from "@/lib/iscarb-api";
import { sanitizeRubricForClient } from "@/lib/assessment/public-question-payload";
import { storePracticeModule } from "@/lib/assessment/practice-module-store";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

export const POST = guard({ tier: "ai", roles: ["student", "faculty", "admin"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const topic = ((body as Record<string, unknown>).topic as string | undefined)?.trim();
  const difficulty = ((body as Record<string, unknown>).difficulty as string | undefined) ?? "medium";
  if (!topic) return apiError("topic is required", 400);

  const system = `You are an expert educational assessor for iSCARB, a Saudi higher education readiness platform.\nGenerate a realistic, professional scenario-based assessment question.\nReturn STRICT JSON only. No prose. No markdown fences.`;

  const user = `Generate a scenario-based assessment for: "${topic}"\nDifficulty: ${difficulty}\n\nReturn ONLY this JSON:\n{\n  "code": "PRACTICE-${Date.now()}",\n  "title": "<short title>",\n  "framework": "<named framework or methodology>",\n  "scenario": "<realistic Saudi workplace scenario, 3-4 sentences>",\n  "instructions": "<what the student must write>",\n  "rubric": [\n    { "criterion": "<name>", "weight": <int>, "descriptor": "<what a strong answer shows>" },\n    { "criterion": "<name>", "weight": <int>, "descriptor": "<what a strong answer shows>" },\n    { "criterion": "<name>", "weight": <int>, "descriptor": "<what a strong answer shows>" }\n  ],\n  "fewShot": [\n    { "response": "<weak example>", "score": 30, "feedback": "<why low>" },\n    { "response": "<strong example>", "score": 85, "feedback": "<why high>" }\n  ]\n}`;

  try {
    const MODEL = process.env.OPENAI_CHAT_MODEL || "nvidia/nemotron-3-nano-30b-a3b";
    const result = await chatJsonRaw({ system, user, model: MODEL });
    const json = result.json as Record<string, unknown> | null;
    if (!json || !json.scenario || !Array.isArray(json.rubric)) {
      return apiError("AI failed to generate a valid question", 500);
    }

    const rubric = json.rubric as Array<Record<string, unknown>>;
    const total = rubric.reduce((s, c) => s + Number(c.weight || 0), 0);
    if (total !== 100 && total > 0) {
      let acc = 0;
      rubric.forEach((c, i) => {
        c.weight = i === rubric.length - 1 ? 100 - acc : Math.round((Number(c.weight) / total) * 100);
        if (i < rubric.length - 1) acc += c.weight as number;
      });
    }

    const code = String(json.code || `PRACTICE-${Date.now()}`);
    const fewShot = Array.isArray(json.fewShot)
      ? (json.fewShot as Array<Record<string, unknown>>).map((f) => ({
          response: String(f.response ?? ""),
          score: Number(f.score ?? 0),
          feedback: String(f.feedback ?? ""),
        }))
      : [];

    const fullModule: AssessmentModuleSpec = {
      code,
      title: String(json.title || topic),
      dimension: "job_fit",
      level: "L3-PRACTICE",
      framework: String(json.framework || "Professional competency"),
      focus: `AI-generated practice: ${topic}`,
      scenario: String(json.scenario),
      instructions: String(json.instructions || "Write your detailed response."),
      rubric: rubric.map((r) => ({
        criterion: String(r.criterion ?? "criterion"),
        weight: Number(r.weight ?? 0),
        descriptor: String(r.descriptor ?? ""),
      })),
      fewShot,
      passThreshold: 60,
      validationEnabled: false,
      modelTag: process.env.OPENAI_CHAT_MODEL || "nvidia/nemotron-3-nano-30b-a3b",
      temperature: 0.2,
      specialization: topic,
      generated: true,
      estimateMinutes: 15,
    };

    // Persist full module server-side for scoring (client never gets descriptors/fewShot).
    storePracticeModule(fullModule, ctx.session.studentId ?? null);

    return NextResponse.json({
      success: true,
      module: {
        code: fullModule.code,
        title: fullModule.title,
        dimension: fullModule.dimension,
        level: fullModule.level,
        framework: fullModule.framework,
        focus: fullModule.focus,
        scenario: fullModule.scenario,
        instructions: fullModule.instructions,
        rubric: sanitizeRubricForClient(fullModule.rubric),
        passThreshold: fullModule.passThreshold,
        validationEnabled: false,
        modelTag: fullModule.modelTag,
        temperature: fullModule.temperature,
        specialization: fullModule.specialization,
        generated: true,
        estimateMinutes: 15,
      },
    });
  } catch (err) {
    console.error("AI practice generation failed:", err);
    return apiError("Failed to generate question. Please try again.", 500);
  }
});
