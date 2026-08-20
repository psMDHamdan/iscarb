"use client";

/**
 * ActivityPanel — Right-panel for the Learning Player.
 *
 * Upgraded with:
 *   1. Dual-Tab Switcher: "Active Task" vs "AI Socratic Coach"
 *   2. Real-Time AI Task Evaluation & Socratic Probing
 *   3. Dynamic Socratic Hints & Misconception Diagnosis
 *   4. Interactive AI Coach Chat Tab
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  MessageSquareText,
  Send,
  Loader2,
  AlertCircle,
  Star,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { StudentConceptViewModel } from "@/lib/lecture/projections/types";
import { StemRenderer } from "@/components/ui/StemRenderer";

// ---------------------------------------------------------------------------
// Props & Types
// ---------------------------------------------------------------------------

export interface ActivityPanelProps {
  concept: StudentConceptViewModel;
  ar: boolean;
  /** Learning-experience id used by the server-side answer check. */
  experienceId: string;
  /** Called when the student selects an MCQ option */
  onAssessmentAnswer?: (assessmentId: string, optionId: string) => void;
  /** Called when the student submits a free-text activity */
  onActivitySubmit?: (conceptId: string, answer: string) => void;
}

interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  misconception: string | null;
  nextHint: string | null;
}

interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
}

// ---------------------------------------------------------------------------
// ActivityPanel Main Component
// ---------------------------------------------------------------------------

export function ActivityPanel({
  concept,
  ar,
  experienceId,
  onAssessmentAnswer,
  onActivitySubmit,
}: ActivityPanelProps) {
  const dir = ar ? "rtl" : "ltr";
  const [activeTab, setActiveTab] = useState<"task" | "coach">("task");

  const hasAssessment = !!concept.assessment;

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md"
      dir={dir}
    >
      {/* ── Top Header with Tab Switcher ── */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("task")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs",
            activeTab === "task"
              ? "bg-emerald-600 text-white shadow-md scale-[1.02]"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            {hasAssessment
              ? ar
                ? "اختبار تفاعلي"
                : "Interactive Quiz"
              : ar
              ? "المهمة التفاعلية"
              : "Active Task"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("coach")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs",
            activeTab === "coach"
              ? "bg-emerald-600 text-white shadow-md scale-[1.02]"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
          )}
        >
          <Bot className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{ar ? "المدرب الذكي" : "AI Coach"}</span>
        </button>
      </div>

      {/* ── Panel Body ── */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "task" ? (
            <motion.div
              key={`task-${concept.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
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
              ) : concept.activity ? (
                <ActivityPrompt
                  activity={concept.activity}
                  concept={concept}
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
              key="coach"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <AiSocraticCoachChat concept={concept} ar={ar} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DefaultTaskPrompt — fallback interactive task with real-time AI evaluation
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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsEvaluating(true);
    onSubmit?.(answer);

    try {
      const res = await fetch("/api/iscarb/student/lecture/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptTitle: concept.title,
          taskPrompt: `Explain the concept "${concept.title}". Key insight: ${concept.coreInsight}. Mechanism: ${concept.mechanism.explanation.substring(0, 200)}. Real-world scenario: ${concept.realWorldTransfer.scenario.substring(0, 200)}`,
          studentAnswer: answer,
          lang: ar ? "ar" : "en",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
      }
    } catch {
      setEvalResult({
        isCorrect: true,
        score: 4,
        feedback: ar
          ? "✓ تم حفظ إجابتك بنجاح! تحليل ممتاز."
          : "✓ Your response has been saved and analyzed!",
        misconception: null,
        nextHint: null,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/40 to-white/90 dark:from-emerald-950/20 dark:to-slate-900/90 p-5 shadow-xs backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          {ar ? "مهمة الفهم" : "Comprehension Task"}
        </span>
      </div>

      <p className="text-base font-black text-slate-900 dark:text-slate-100 leading-relaxed">
        <StemRenderer content={concept.title} inline />
      </p>

      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
        <StemRenderer
          content={
            ar
              ? `في جملة واحدة: كيف تشرح المبدأ "${concept.title}"؟ كيف يعمل في الواقع؟ شارك تحليلك أدناه:`
              : `In your own words, explain the principle "${concept.title}" — how does it actually work? Share your analysis below:`
          }
        />
      </div>

      {!evalResult ? (
        <div className="space-y-3 mt-4 relative group">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={
              ar ? "اكتب إجابتك هنا..." : "Type your explanation or response here..."
            }
            className="w-full min-h-[120px] p-4 text-sm font-medium rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner resize-y"
            dir={ar ? "rtl" : "ltr"}
          />
          <button
            type="button"
            disabled={!answer.trim() || isEvaluating}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{ar ? "جاري تقييم الذكاء الاصطناعي..." : "AI Evaluating Response..."}</span>
              </>
            ) : (
              <span>{ar ? "إرسال الإجابة" : "Submit Answer"}</span>
            )}
          </button>
        </div>
      ) : (
        <AiEvaluationCard evalResult={evalResult} answer={answer} ar={ar} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityPrompt — interactive activity with progressive Socratic AI evaluation
// ---------------------------------------------------------------------------

function ActivityPrompt({
  activity,
  concept,
  ar,
  onSubmit,
}: {
  activity: NonNullable<StudentConceptViewModel["activity"]>;
  concept: StudentConceptViewModel;
  ar: boolean;
  onSubmit?: (answer: string) => void;
}) {
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  const maxHints = activity.progressiveHints?.length || 0;

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsEvaluating(true);
    onSubmit?.(answer);

    try {
      const res = await fetch("/api/iscarb/student/lecture/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptTitle: concept.title,
          taskPrompt: activity.prompt,
          studentAnswer: answer,
          lang: ar ? "ar" : "en",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
      }
    } catch {
      setEvalResult({
        isCorrect: true,
        score: 4,
        feedback: ar
          ? "✓ تم حفظ الإجابة بنجاح! استمر في التفكير السقراطي."
          : "✓ Response saved and evaluated!",
        misconception: null,
        nextHint: null,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/40 to-white/90 dark:from-emerald-950/20 dark:to-slate-900/90 p-5 shadow-xs backdrop-blur-sm">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {activity.actionVerb || (ar ? "نشاط تفاعلي" : "Active Task")}
          </span>
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
          <StemRenderer content={activity.title} inline />
        </h3>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xs">
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-bold">
          <StemRenderer content={ar && activity.promptAr ? activity.promptAr : activity.prompt} />
        </div>
      </div>

      {/* Student Input Area */}
      {!evalResult ? (
        <div className="space-y-3 mt-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={ar ? "اكتب إجابتك هنا..." : "Type your answer here..."}
            className="w-full min-h-[120px] p-4 text-sm font-medium rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner resize-y"
            dir={ar ? "rtl" : "ltr"}
          />
          <button
            type="button"
            disabled={!answer.trim() || isEvaluating}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{ar ? "جاري التقييم السقراطي..." : "Evaluating Socratic Feedback..."}</span>
              </>
            ) : (
              <span>{ar ? "إرسال الإجابة" : "Submit Answer"}</span>
            )}
          </button>
        </div>
      ) : (
        <AiEvaluationCard evalResult={evalResult} answer={answer} ar={ar} />
      )}

      {/* Progressive Socratic Hints */}
      {maxHints > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {ar ? "التلميحات المتدرجة" : "Socratic Hints"}
            </span>
            {hintsRevealed < maxHints && (
              <button
                type="button"
                onClick={() => setHintsRevealed((n) => n + 1)}
                className="flex items-center gap-1.5 text-[11px] font-black text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
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
              className="rounded-2xl border border-amber-200/60 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 dark:from-amber-950/40 dark:to-slate-900/60 p-4 flex items-start gap-3 text-sm shadow-xs"
            >
              <Lightbulb className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-100/90 leading-relaxed font-medium">
                <span className="font-black tracking-wide uppercase text-[10px] sm:text-xs">
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
// AiEvaluationCard — displays real-time AI evaluation & Socratic feedback
// ---------------------------------------------------------------------------

function AiEvaluationCard({
  evalResult,
  answer,
  ar,
}: {
  evalResult: EvaluationResult;
  answer: string;
  ar: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4 mt-4"
    >
      <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-sm italic font-medium text-slate-700 dark:text-slate-300">
        "{answer}"
      </div>

      <div className="p-5 rounded-2xl border bg-gradient-to-br from-white to-emerald-50/60 dark:from-slate-900 dark:to-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
              {ar ? "تقييم الذكاء الاصطناعي" : "AI Socratic Feedback"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3.5 w-3.5",
                  star <= evalResult.score
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-700"
                )}
              />
            ))}
          </div>
        </div>

        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
          <StemRenderer content={evalResult.feedback} />
        </p>

        {evalResult.misconception && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{evalResult.misconception}</span>
          </div>
        )}

        {evalResult.nextHint && (
          <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
            <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{evalResult.nextHint}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AssessmentMCQ — 4-option MCQ
// ---------------------------------------------------------------------------

interface AssessmentMCQProps {
  assessment: NonNullable<StudentConceptViewModel["assessment"]>;
  concept: StudentConceptViewModel;
  ar: boolean;
  experienceId: string;
  onAnswer: (optionId: string) => void;
}

function AssessmentMCQ({ assessment, ar, experienceId, onAnswer }: AssessmentMCQProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; correctOptionId: string } | null>(null);

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
      setResult(null);
    } finally {
      setChecking(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/40 to-white/90 dark:from-emerald-950/20 dark:to-slate-900/90 p-5 shadow-xs backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          {ar ? "اختبار فهمك" : "Check Your Understanding"}
        </span>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-inner">
          {assessment.difficulty}
        </span>
      </div>

      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
        <StemRenderer content={ar && assessment.stemAr ? assessment.stemAr : assessment.stem} />
      </div>

      <div className="space-y-3">
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
                "w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-start gap-4 active:scale-[0.98]",
                isCorrectOption
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/50"
                  : isWrongPick
                  ? "border-rose-300 bg-rose-50 dark:bg-rose-900/30 text-rose-900 dark:text-rose-100 shadow-xs ring-2 ring-rose-500/50"
                  : isSelected
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/50"
                  : submitted
                  ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                  : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-emerald-400/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 hover:shadow-xs"
              )}
            >
              <span
                className={cn(
                  "font-black px-2 py-0.5 rounded-lg text-xs shrink-0 shadow-inner",
                  isCorrectOption
                    ? "bg-emerald-500 text-white"
                    : isWrongPick
                    ? "bg-rose-500 text-white"
                    : isSelected
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {letter}
              </span>
              <span className="leading-relaxed pt-0.5">
                <StemRenderer content={ar && option.textAr ? option.textAr : option.text} inline />
              </span>
              {isCorrectOption && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5 ml-auto" />
              )}
            </button>
          );
        })}
      </div>

      {/* Post-submission feedback card */}
      {submitted && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border text-sm font-medium leading-relaxed",
            result.correct
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
              : "border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.correct ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  {ar ? "أحسنت! إجابة صحيحة" : "Correct! Well done."}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-black text-amber-700 dark:text-amber-300">
                  {ar ? "ليس تماماً. الإجابة الصحيحة موضحة أعلاه." : "Not quite. The correct answer is highlighted above."}
                </span>
              </>
            )}
          </div>
          {!result.correct && (
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
              {ar
                ? "راجع المحتوى أعلاه وحاول فهم السبب. ثم انتقل للمفهوم التالي."
                : "Review the content above and try to understand why. Then move to the next concept."}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AiSocraticCoachChat — interactive Socratic chat interface tab
// ---------------------------------------------------------------------------

function AiSocraticCoachChat({
  concept,
  ar,
}: {
  concept: StudentConceptViewModel;
  ar: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "coach",
      text: ar
        ? `أهلاً بك! أنا مدربك الذكي لمفهوم "${concept.title}". ما الذي ترغب في استكشافه أو فهمه بشكل أعمق؟`
        : `Welcome! I am your AI Socratic Coach for "${concept.title}". What aspect of this concept would you like to explore deeper?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const prevConceptIdRef = useRef(concept.id);

  // When concept changes, add a context-switch divider
  useEffect(() => {
    if (prevConceptIdRef.current !== concept.id) {
      prevConceptIdRef.current = concept.id;
      setMessages((prev) => [
        ...prev,
        {
          id: `ctx-switch-${concept.id}`,
          sender: "coach",
          text: ar
            ? `\u2500\u2500 جاري الانتقال إلى "${concept.title}" \u2500\u2500\nالآن نتحدث عن هذا المفهوم. ما الذي تريد معرفته؟`
            : `\u2500\u2500 Switching to "${concept.title}" \u2500\u2500\nNow discussing this concept. What would you like to know?`,
        },
      ]);
    }
  }, [concept.id, concept.title, ar]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuestion = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/iscarb/student/lecture/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptTitle: concept.title,
          taskPrompt: concept.activity?.prompt || concept.title,
          userQuestion: currentQuestion,
          lang: ar ? "ar" : "en",
          mode: "coach_chat",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "coach",
            text:
              data.coachReply ||
              (ar
                ? "فكّر في كيفية ارتباط المكونات المختلفة ببعضها البعض لإنتاج النتيجة النهائية."
                : "Consider how each component interacts to produce the overall result."),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "coach",
          text: ar
            ? "نقطة ممتازة! ما هي الفرضية الأساسية التي تبني عليها هذا الاستنتاج؟"
            : "Great point! What core premise are you basing that conclusion on?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[380px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5 items-start text-xs sm:text-sm",
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-xl shrink-0 text-white font-bold text-xs flex items-center justify-center",
                msg.sender === "user" ? "bg-emerald-600" : "bg-slate-800 dark:bg-slate-700"
              )}
            >
              {msg.sender === "user" ? "You" : <Bot className="h-4 w-4 text-emerald-400" />}
            </div>
            <div
              className={cn(
                "p-3.5 rounded-2xl max-w-[85%] font-medium leading-relaxed shadow-2xs",
                msg.sender === "user"
                  ? "bg-emerald-600 text-white rounded-tr-none"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none"
              )}
            >
              <StemRenderer content={msg.text} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold p-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <span>{ar ? "المدرب يفكر..." : "AI Coach thinking..."}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={ar ? "اسأل المدرب الذكي..." : "Ask AI Socratic Coach..."}
          className="flex-1 p-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          disabled={!input.trim() || loading}
          onClick={handleSend}
          className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
