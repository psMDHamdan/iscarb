/**
 * Instant keyed MCQ scoring for the employability exam.
 * selectedCanonicalIndex === storedCorrectIndex → 100, else 0.
 * No AI.
 */
import {
  bandFor,
  isPass,
  type CriterionScore,
  type DimensionId,
  type ScoredResponse,
} from "@/lib/assessment/framework";
import {
  choiceShuffleSeed,
  sanitizeChoiceStrings,
} from "@/lib/assessment/public-question-payload";
import type { AttemptExamQuestion } from "@/lib/assessment/attempt-exam-set";

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Map a shuffled display index back onto the canonical choice list. */
export function canonicalIndexFromShuffledSelection(
  canonicalChoices: string[],
  shuffledSelectedIndex: number,
  seed: string,
): number | null {
  if (!Number.isInteger(shuffledSelectedIndex) || shuffledSelectedIndex < 0) return null;
  const shuffled = sanitizeChoiceStrings(canonicalChoices, seed);
  const selected = shuffled[shuffledSelectedIndex];
  if (!selected) return null;
  const idx = canonicalChoices.findIndex((c) => c === selected);
  return idx >= 0 ? idx : null;
}

/** Resolve the candidate's pick against stored canonical choices + key. */
export function resolveSelectedCanonicalIndex(opts: {
  question: AttemptExamQuestion;
  selectedIndex?: number | null;
  responseText?: string | null;
  studentId?: string | null;
  attemptId?: string | null;
}): number | null {
  const { question } = opts;
  const text = (opts.responseText ?? "").trim();
  if (text) {
    const byText = question.choices.findIndex((c) => norm(c) === norm(text));
    if (byText >= 0) return byText;
  }

  if (opts.selectedIndex == null || !Number.isInteger(opts.selectedIndex)) return null;

  const seed = choiceShuffleSeed(opts.attemptId, opts.studentId, question.code);
  const fromShuffle = canonicalIndexFromShuffledSelection(
    question.choices,
    opts.selectedIndex,
    seed,
  );
  if (fromShuffle != null) return fromShuffle;

  if (opts.selectedIndex >= 0 && opts.selectedIndex < question.choices.length) {
    return opts.selectedIndex;
  }
  return null;
}

export function scoreKeyedMcq(opts: {
  question: AttemptExamQuestion;
  selectedCanonicalIndex: number | null;
  language?: "ar" | "en";
}): ScoredResponse {
  const t0 = Date.now();
  const isAr = opts.language === "ar" || Boolean((opts.question as any).titleAr);
  const correct =
    opts.selectedCanonicalIndex != null &&
    opts.selectedCanonicalIndex === opts.question.correctIndex;
  const score = correct ? 100 : 0;
  const band = bandFor(score).id;
  const passed = isPass(score);
  const dim = opts.question.dimension as DimensionId;

  const perCriterion: CriterionScore[] = [
    {
      criterion: "keyed_mcq",
      weight: 100,
      score,
      max: 100,
    },
  ];

  const correctChoiceText = opts.question.choices[opts.question.correctIndex] ?? "";
  const selectedChoiceText =
    opts.selectedCanonicalIndex != null ? opts.question.choices[opts.selectedCanonicalIndex] ?? "" : "";

  let feedback = "";
  let strengths: string[] = [];
  let improvements: string[] = [];

  if (isAr) {
    if (correct) {
      feedback = `إجابة صحيحة بنسبة 100%. تم اختيار الخيار المعتمد بنجاح وفق معايير الكفاءة القياسية.`;
      strengths = ["استيعاب ممتاز للمفهوم والمعيار القياسي"];
      improvements = [];
    } else {
      feedback = selectedChoiceText
        ? `الإجابة المختارة ("${selectedChoiceText}") غير صحيحة. الخيار الصحيح المعترف به للمعيار هو: "${correctChoiceText}". يرجى مراجعة مفهوم هذا السؤال لتجنب الخطأ.`
        : `لم يتم اختيار إجابة لهذا السؤال. الخيار الصحيح المعترف به للمعيار هو: "${correctChoiceText}".`;
      strengths = [];
      improvements = [`مراجعة معايير ومفاهيم الموديل (${(opts.question as any).titleAr || opts.question.title})`];
    }
  } else {
    if (correct) {
      feedback = "Correct answer. You successfully selected the validated standard option.";
      strengths = ["Strong understanding of core competency standards"];
      improvements = [];
    } else {
      feedback = selectedChoiceText
        ? `Selected ("${selectedChoiceText}") is incorrect. The correct choice is: "${correctChoiceText}".`
        : `No choice was selected. The correct option is: "${correctChoiceText}".`;
      strengths = [];
      improvements = [`Review core standards for ${opts.question.title}`];
    }
  }

  return {
    moduleCode: opts.question.code,
    dimension: dim,
    score,
    band,
    passed,
    perCriterion,
    feedback,
    strengths,
    improvements,
    validationPassed: true,
    model: "keyed_mcq",
    source: "keyed_mcq",
    latencyMs: Date.now() - t0,
    tokensInput: 0,
    tokensOutput: 0,
    costUsd: 0,
  };
}
