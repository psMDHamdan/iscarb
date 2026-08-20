"use client";

/**
 * ActivityPanel — right-panel for the learning player.
 *
 * Context-sensitive: renders one of three modes based on the current concept:
 *   1. Activity prompt (Predict / Calculate / Analyze) with progressive hints
 *   2. Assessment MCQ (4 options, NO correct answer revealed)
 *   3. AI Coach placeholder ("I don't understand" button)
 *
 * When neither activity nor assessment is present, shows a contextual
 * "Key Takeaway" view so the panel is never empty.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { StudentConceptViewModel } from "@/lib/lecture/projections/types";

import { AiConceptTutor } from "./AiConceptTutor";
import { StemRenderer } from "@/components/ui/StemRenderer";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActivityPanelProps {
  concept: StudentConceptViewModel;
  ar: boolean;
  /** Learning-experience id used by the server-side answer check. */
  experienceId: string;
  /** Called when the student selects an MCQ option */
  onAssessmentAnswer?: (assessmentId: string, optionId: string) => void;
  /** Called when the student clicks "I don't understand" */
  onRequestHelp?: (conceptId: string) => void;
  /** Called when the student submits a free-text activity */
  onActivitySubmit?: (conceptId: string, answer: string) => void;
}

// ---------------------------------------------------------------------------
// ActivityPanel
// ---------------------------------------------------------------------------

export function ActivityPanel({
  concept,
  ar,
  experienceId,
  onAssessmentAnswer,
  onRequestHelp,
  onActivitySubmit,
}: ActivityPanelProps) {
  const dir = ar ? "rtl" : "ltr";
  const hasAssessment = !!concept.assessment;
  const hasActivity = !!concept.activity;

  // Default to task if activity/assessment present, otherwise tutor
  const [activeTab, setActiveTab] = useState<"task" | "tutor">("task");

  // Auto-switch to task when navigating to a concept with active task
  React.useEffect(() => {
    setActiveTab("task");
  }, [concept.id]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-white border-l border-emerald-100"
      dir={dir}
    >
      {/* ── Top Navigation Tabs (Green & White) ── */}
      <div className="p-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-white flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("task")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs",
            activeTab === "task"
              ? "bg-[#0E6C3C] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-emerald-50/80 border border-emerald-200/70"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {hasAssessment
            ? (ar ? "الاختبار التفاعلي" : "Interactive Quiz")
            : (ar ? "مهمتك التفاعلية" : "Your Active Task")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tutor")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs",
            activeTab === "tutor"
              ? "bg-[#0E6C3C] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-emerald-50/80 border border-emerald-200/70"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          {ar ? "المعلم الذكي" : "AI Concept Tutor"}
        </button>
      </div>

      {/* ── Panel Body ── */}
      <div className="flex-1 p-3.5 lg:p-4 overflow-y-auto bg-white">
        <AnimatePresence mode="wait">
          {activeTab === "task" ? (
            <motion.div
              key={`task-${concept.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {hasAssessment ? (
                <AssessmentMCQ
                  assessment={concept.assessment!}
                  concept={concept}
                  ar={ar}
                  experienceId={experienceId}
                  onAnswer={(optionId) =>
                    onAssessmentAnswer?.(concept.assessment!.id, optionId)
                  }
                />
              ) : hasActivity ? (
                <ActivityPrompt
                  activity={concept.activity!}
                  ar={ar}
                  onSubmit={(answer) => onActivitySubmit?.(concept.id, answer)}
                />
              ) : (
                <DefaultTaskPrompt
                  concept={concept}
                  ar={ar}
                  onSubmit={(answer) => onActivitySubmit?.(concept.id, answer)}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`tutor-${concept.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full min-h-[440px]"
            >
              <AiConceptTutor
                concept={concept}
                ar={ar}
                onCompleteInteraction={() => onActivitySubmit?.(concept.id, "Completed AI Tutor Discussion")}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DefaultTaskPrompt — fallback interactive task when no custom activity set
// ---------------------------------------------------------------------------

function DefaultTaskPrompt({
  concept,
  ar,
  onSubmit,
}: {
  concept: StudentConceptViewModel;
  ar: boolean;
  onSubmit?: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 to-white p-4.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800">
          <Sparkles className="h-3 w-3 text-emerald-700" />
          {ar ? "مهمة الفهم" : "Comprehension Task"}
        </span>
      </div>

      <p className="text-sm font-bold text-slate-800 leading-relaxed">
        <StemRenderer content={concept.title} inline />
      </p>

      <div className="text-xs text-slate-600 leading-relaxed font-medium">
        <StemRenderer
          content={
            ar
              ? `كيف يمكنك تطبيق هذا المفهوم أو شرح دوره في ${concept.title}؟ شارك تحليلك أدناه:`
              : `In your own words, summarize how this mechanism functions or why this principle is critical in ${concept.title}:`
          }
        />
      </div>

      {!submitted ? (
        <div className="space-y-2 mt-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={ar ? "اكتب إجابتك هنا..." : "Type your explanation or response here..."}
            className="w-full min-h-[90px] p-3 text-xs rounded-xl border border-emerald-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-xs"
            dir={ar ? "rtl" : "ltr"}
          />
          <button
            type="button"
            disabled={!answer.trim()}
            onClick={() => {
              setSubmitted(true);
              onSubmit?.(answer);
            }}
            className="w-full py-2.5 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            {ar ? "إرسال الإجابة" : "Submit Answer"}
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {ar ? "✓ تم حفظ إجابتك بنجاح!" : "✓ Your answer has been saved!"}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityPrompt — renders interactive activity with progressive hints (Green & White)
// ---------------------------------------------------------------------------

function ActivityPrompt({
  activity,
  ar,
  onSubmit,
}: {
  activity: NonNullable<StudentConceptViewModel["activity"]>;
  ar: boolean;
  onSubmit?: (answer: string) => void;
}) {
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const maxHints = activity.progressiveHints?.length || 0;

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 to-white p-4.5 shadow-sm">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-700" />
            {activity.actionVerb || (ar ? "نشاط تفاعلي" : "Apply")}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          <StemRenderer content={activity.title} inline />
        </h3>
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-xs">
        <div className="text-xs text-slate-800 leading-relaxed font-semibold">
          <StemRenderer content={ar && activity.promptAr ? activity.promptAr : activity.prompt} />
        </div>
      </div>

      {/* Student Input Area */}
      {!submitted ? (
        <div className="space-y-2 mt-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={ar ? "اكتب إجابتك هنا..." : "Type your answer here..."}
            className="w-full min-h-[90px] p-3 text-xs rounded-xl border border-emerald-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-xs"
            dir={ar ? "rtl" : "ltr"}
          />
          <button
            type="button"
            disabled={!answer.trim()}
            onClick={() => {
              setSubmitted(true);
              onSubmit?.(answer);
            }}
            className="w-full py-2.5 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            {ar ? "إرسال الإجابة" : "Submit Answer"}
          </button>
        </div>
      ) : (
        <div className="space-y-2 mt-3">
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 italic">
            "{answer}"
          </div>
          <div className="text-xs text-center font-bold text-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {ar ? "تم حفظ إجابتك. استمر في التعلم!" : "Answer saved. Keep learning!"}
          </div>
        </div>
      )}

      {/* Progressive hints */}
      {maxHints > 0 && (
        <div className="space-y-2 pt-2 border-t border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {ar ? "التلميحات المتدرجة" : "Socratic Hints"}:
            </span>
            {hintsRevealed < maxHints && (
              <button
                type="button"
                onClick={() => setHintsRevealed((n) => n + 1)}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <ChevronDown className="h-3 w-3" />
                {ar
                  ? `عرض تلميح (${hintsRevealed}/${maxHints})`
                  : `Show Hint (${hintsRevealed}/${maxHints})`}
              </button>
            )}
          </div>

          {activity.progressiveHints.slice(0, hintsRevealed).map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 flex items-start gap-2 text-xs"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">
                  {ar ? `تلميح ${i + 1}` : `Hint ${i + 1}`}:
                </span>{" "}
                <StemRenderer content={hint} inline />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssessmentMCQ — 4-option MCQ (Green & White Light Theme)
// ---------------------------------------------------------------------------

interface AssessmentMCQProps {
  assessment: NonNullable<StudentConceptViewModel["assessment"]>;
  concept: StudentConceptViewModel;
  ar: boolean;
  experienceId: string;
  onAnswer: (optionId: string) => void;
}

function AssessmentMCQ({ assessment, concept, ar, experienceId, onAnswer }: AssessmentMCQProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; correctOptionId: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const submitAnswer = async (optionId: string) => {
    setSelectedId(optionId);
    setChecking(true);
    onAnswer(optionId);
    try {
      const res = await fetch(
        `/api/iscarb/lecture/experience/${encodeURIComponent(experienceId)}/assess`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId: assessment.id, optionId }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setResult({ correct: Boolean(data.correct), correctOptionId: String(data.correctOptionId) });
      } else {
        setResult({ correct: false, correctOptionId: optionId });
      }
    } catch {
      // Offline/backend failure — record the answer without a verdict.
      setResult(null);
    } finally {
      setChecking(false);
      setSubmitted(true);
    }
  };

  const fetchHint = async () => {
    if (hint || loadingHint) return;
    setLoadingHint(true);
    try {
      const res = await fetch("/api/iscarb/student/lecture/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "hint",
          conceptTitle: concept.title,
          stageName: concept.stage,
          coreInsight: concept.coreContent?.explanation || "",
          mentalModel: concept.coreContent?.analogy ? { analogy: concept.coreContent.analogy } : undefined,
          mechanism: concept.coreContent?.explanation || "",
          visualCaption: concept.visual?.caption,
          assessmentStem: assessment.stem,
        }),
      });
      const data = await res.json();
      setHint(data.reply || (ar ? "تذكر القاعدة الأساسية لآلية العمل في هذا المفهوم." : "Recall the core biophysical rule discussed in this concept."));
    } catch (e) {
      setHint(ar ? "فكر في كيفية تفاعل المكونات معاً لحل هذا السؤال." : "Think about how the core components interact to resolve this question.");
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200/90 bg-white p-4.5 shadow-sm">
      {/* Header badge */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          {ar ? "اختبار فهمك" : "Check Your Understanding"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase tracking-widest border border-emerald-200">
            {assessment.difficulty}
          </span>
        </div>
      </div>

      {/* Stem */}
      <div className="text-xs font-bold text-slate-900 leading-relaxed">
        <StemRenderer content={ar && assessment.stemAr ? assessment.stemAr : assessment.stem} />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {assessment.options.map((option, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selectedId === option.id;
          const isCorrectOption = submitted && result != null && result.correctOptionId === option.id;
          const isWrongPick = submitted && result != null && isSelected && !result.correct;

          return (
            <button
              key={option.id}
              type="button"
              disabled={submitted || checking}
              onClick={() => submitAnswer(option.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5",
                isCorrectOption
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500"
                  : isWrongPick
                    ? "border-red-300 bg-red-50 text-red-900 font-semibold shadow-xs"
                    : isSelected
                      ? "border-[#0E6C3C] bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-[#0E6C3C]"
                      : submitted
                        ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40",
              )}
            >
              <span className={cn(
                "font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0",
                isCorrectOption ? "bg-emerald-600 text-white" : isWrongPick ? "bg-red-500 text-white" : isSelected ? "bg-[#0E6C3C] text-white" : "bg-slate-100 text-slate-600"
              )}>
                {letter}
              </span>
              <span className="leading-relaxed">
                <StemRenderer content={ar && option.textAr ? option.textAr : option.text} inline />
              </span>
              {isCorrectOption && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 ml-auto" />}
              {isWrongPick && <span className="text-red-500 text-[10px] font-bold shrink-0 mt-0.5 ml-auto">{ar ? "إجابتك" : "Your pick"}</span>}
            </button>
          );
        })}
      </div>

      {/* Verdict — revealed strictly AFTER submission (FR-021 reveal-after-answer) */}
      {submitted && result && !checking && (
        <div
          className={cn(
            "p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 leading-relaxed",
            result.correct
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-amber-300 bg-amber-50 text-amber-900"
          )}
        >
          {result.correct ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span>
            {result.correct
              ? (ar ? "✓ إجابة صحيحة! أحسنت." : "✓ Correct! Great job.")
              : (ar
                ? `ليست الإجابة الصحيحة — الإجابة الصحيحة مميزة باللون الأخضر. راجع الفكرة الأساسية ثم تابع.`
                : `Not quite — the correct answer is highlighted in green. Review the core idea and continue.`)}
          </span>
        </div>
      )}

      {submitted && !result && (
        <p className="text-xs text-emerald-700 font-bold italic text-center">
          {ar
            ? "✓ تم تسجيل إجابتك. يمكنك الانتقال إلى المفهوم التالي."
            : "✓ Answer recorded. You can now proceed to the next concept."}
        </p>
      )}

      {/* AI Tutor Socratic Hint Helper */}
      <div className="pt-2 border-t border-emerald-100">
        {!hint ? (
          <button
            type="button"
            onClick={fetchHint}
            disabled={loadingHint}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs font-semibold text-emerald-800 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
            {loadingHint
              ? (ar ? "المعلم يستحضر التلميح..." : "Tutor is preparing hint...")
              : (ar ? "💡 اطلب تلميحاً من المعلم الذكي" : "💡 Ask AI Tutor for a Socratic Hint")}
          </button>
        ) : (
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/80 space-y-1 text-xs text-emerald-900 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              {ar ? "تلميح المعلم الذكي:" : "AI Tutor Hint:"}
            </div>
            <div className="italic text-slate-700">
              <StemRenderer content={hint} />
            </div>
          </div>
        )}
      </div>

      {submitted && (
        <p className="text-xs text-emerald-700 font-bold italic text-center">
          {ar
            ? "✓ تم تسجيل إجابتك. يمكنك الانتقال إلى المفهوم التالي."
            : "✓ Answer recorded. You can now proceed to the next concept."}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KeyTakeaway — fallback when no activity/assessment is present
// ---------------------------------------------------------------------------

function KeyTakeaway({
  concept,
  ar,
}: {
  concept: StudentConceptViewModel;
  ar: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Key takeaway from real-world transfer */}
      <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-slate-900/60 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          <Lightbulb className="h-4 w-4" />
          {ar ? "الخلاصة" : "Key Takeaway"}
        </div>
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          <StemRenderer content={concept.coreContent?.explanation || ""} />
        </div>
      </div>

      {/* Real-world application */}
      <div className="rounded-2xl border border-purple-500/15 bg-purple-50/30 dark:bg-purple-950/15 p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-purple-700 dark:text-purple-400">
          {ar ? "📌 التطبيق" : "📌 Application"}
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <StemRenderer content={concept.realWorld?.application || ""} />
        </div>
      </div>

      {/* Mental model recap */}
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {ar ? "تذكّر" : "Remember"}
        </p>
        {concept.coreContent?.analogy && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
            &ldquo;<StemRenderer content={concept.coreContent.analogy} inline />&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
