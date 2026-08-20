import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { catalogModuleByCode } from "@/lib/assessment/catalog";
import { ensureFourChoices } from "@/lib/assessment/exam-mcq";
import { sanitizeMcqPayloadForClient } from "@/lib/assessment/public-question-payload";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type PregenEntry = {
  scenario?: string;
  instructions?: string;
  questionType?: string;
  choices?: string[];
};

function getPregenerated(code: string): PregenEntry | null {
  try {
    const p = path.join(process.cwd(), "src/lib/assessment/generated-questions.json");
    if (!fs.existsSync(p)) return null;
    const all = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, PregenEntry>;
    return all[code] ?? null;
  } catch {
    return null;
  }
}

/** Strip internal rubric criterion keys and stray formatting from text before sending to frontend. */
function cleanForDisplay(text: string): string {
  if (!text) return text;
  text = text.replace(/\s*\([a-zA-Z0-9_,\s]+\)/g, "");
  text = text.replace(/[{}\[\]]/g, "");
  text = text.replace(/[\u2011\u2012\u2013\u2014\u2015]/g, "-");
  text = text.replace(/[\r\n]+/g, " ");
  text = text.replace(/\s--\s/g, " ");
  text = text.replace(/^[a-dA-D][.)\-;\]]+\s*/i, "");
  text = text.replace(/;/g, "");
  text = text.replace(/[-:;]+$/g, "");
  text = text.replace(/  +/g, " ");
  return text.trim();
}

/**
 * Curated/pregen MCQ only — live AI question generation is disabled for the exam.
 * Kept for backwards-compatible callers; always returns an instant ready MCQ.
 */
function mcqPayload(
  code: string,
  target: { scenario: string; instructions: string; title: string },
  studentId?: string | null,
) {
  const pregen = getPregenerated(code);
  const base = {
    code,
    title: target.title,
    scenario: pregen?.scenario ?? target.scenario,
    instructions: pregen?.instructions ?? target.instructions,
  };
  const choices = ensureFourChoices(
    base,
    pregen?.choices?.length ? pregen.choices : ["Fallback A", "Fallback B", "Fallback C", "Fallback D"]
  ).map((c) => cleanForDisplay(c));

  return sanitizeMcqPayloadForClient(
    {
      scenario: cleanForDisplay(base.scenario),
      instructions: cleanForDisplay(base.instructions),
      questionType: "mcq" as const,
      choices,
    },
    { studentId, code },
  );
}

export const GET = guard({ tier: "read", roles: ["student", "faculty", "dean", "admin"] }, async (req, ctx) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const specialization = url.searchParams.get("specialization")?.trim();
  const studentId =
    url.searchParams.get("studentId")?.trim() ||
    (ctx.session.role === "student" ? ctx.session.studentId : null);

  if (!code || !specialization) {
    return apiError("Missing code or specialization", 400);
  }

  const target = catalogModuleByCode(code);
  if (!target) {
    return apiError("Module not found", 404);
  }

  return NextResponse.json(mcqPayload(code, target, studentId));
});
