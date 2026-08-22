"use client";

/**
 * ActivityPanel — right panel of the 3-panel learning player.
 *
 * Design philosophy: every interaction must be purposeful.
 *
 * Modes (auto-selected based on what the concept has):
 *   1. Poll / MCQ      — structured question with 4 options, reveal after answer
 *   2. Calculation     — worked problem with step-by-step reveal
 *   3. Reflection      — open-ended written response
 *   4. Activity prompt — free-form task with progressive hints
 *   5. Key Takeaway    — fallback summary when no interaction is set
 *
 * The AI Tutor tab is always available as a fallback.
 *
 * Rules:
 * - Never show "correct answer" before the student has answered.
 * - Always show WHY after answering — not just "correct" / "incorrect".
 * - Hints are progressive: vague → partial → near-answer.
 * - The panel must never be empty or confusing.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Send,
  RotateCcw,
  HelpCircle,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StemRenderer } from "@/components/ui/StemRenderer";
import { AiConceptTutor } from "./AiConceptTutor";
import { DeepDiveRagPanel } from "./DeepDiveRagPanel";

import type { StudentConceptViewModel } from "@/lib/lecture/projections/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActivityPanelProps {
  concept: StudentConceptViewModel;
  ar: boolean;
  experienceId: string;
  onAssessmentAnswer?: (assessmentId: string, optionId: string) => void;
  onRequestHelp?: (conceptId: string) => void;
  onActivitySubmit?: (conceptId: string, answer: string) => void;
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type ActiveTab = "task" | "tutor" | "deep_dive";

// ---------------------------------------------------------------------------
// ActivityPanel — root
// ---------------------------------------------------------------------------

export function ActivityPanel({
  concept,
  ar,
  experienceId,
  onAssessmentAnswer,
  onActivitySubmit,
}: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("task");

  // Reset to task tab whenever concept changes
  React.useEffect(() => {
    setActiveTab("task");
  }, [concept.id]);

  const hasAssessment = !!concept.assessment;
  const hasActivity = !!concept.activity;
  const hasInteractive = !!concept.interactive;

  const taskLabel = hasAssessment || hasInteractive
    ? (ar ? "اختبر نفسك" : "Test Yourself")
    : hasActivity
      ? (ar ? "المهمة" : "Your Task")
      : (ar ? "المحتوى" : "Key Points");

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-700/40 overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 p-2.5 border-b border-slate-200/80 dark:border-slate-700/40 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
        <TabButton
          active={activeTab === "task"}
          onClick={() => setActiveTab("task")}
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label={taskLabel}
        />
        <TabButton
          active={activeTab === "tutor"}
          onClick={() => setActiveTab("tutor")}
          icon={<MessageCircle className="h-3.5 w-3.5" />}
          label={ar ? "اسأل المعلم" : "Ask AI Tutor"}
        />
        <TabButton
          active={activeTab === "deep_dive"}
          onClick={() => setActiveTab("deep_dive")}
          icon={<BookMarked className="h-3.5 w-3.5" />}
          label={ar ? "تعمق أكثر" : "Deep Dive"}
        />
      </div>

      {/* ── Panel Body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "task" ? (
            <motion.div
              key={`task-${concept.id}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="p-3.5 space-y-3"
            >
              {/* Interactive compiler output takes highest priority */}
              {hasInteractive && concept.interactive ? (
                <InteractiveCard
                  interactive={concept.interactive}
                  concept={concept}
                  ar={ar}
                  experienceId={experienceId}
                  onSubmit={(ans) => onActivitySubmit?.(concept.id, ans)}
                />
              ) : hasAssessment && concept.assessment ? (
                <AssessmentMCQ
                  assessment={concept.assessment}
                  concept={concept}
                  ar={ar}
                  experienceId={experienceId}
                  onAnswer={(optionId) => onAssessmentAnswer?.(concept.assessment!.id, optionId)}
                />
              ) : hasActivity && concept.activity ? (
                <ActivityPrompt
                  activity={concept.activity}
                  ar={ar}
                  onSubmit={(ans) => onActivitySubmit?.(concept.id, ans)}
                />
              ) : (
                <KeyPointsSummary concept={concept} ar={ar} />
              )}
            </motion.div>
          ) : activeTab === "deep_dive" ? (
            <motion.div
              key={`deep_dive-${concept.id}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <DeepDiveRagPanel 
                conceptTitle={concept.title}
                stageName={concept.stage}
                coreInsight={concept.coreContent?.explanation || concept.visibleCopy || ""}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`tutor-${concept.id}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-[440px]"
            >
              <AiConceptTutor
                concept={concept}
                ar={ar}
                onCompleteInteraction={() => onActivitySubmit?.(concept.id, "AI Tutor")}
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
// TabButton helper
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all",
        active
          ? "bg-[#0E6C3C] text-white shadow-sm"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// InteractiveCard — renders concept.interactive (from StudentExperienceCompiler)
// Handles poll, calculation, reflection, drag_drop types.
// ---------------------------------------------------------------------------

function InteractiveCard({
  interactive,
  concept,
  ar,
  experienceId,
  onSubmit,
}: {
  interactive: NonNullable<StudentConceptViewModel["interactive"]>;
  concept: StudentConceptViewModel;
  ar: boolean;
  experienceId: string;
  onSubmit?: (answer: string) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showReveal, setShowReveal] = useState(false);

  const isPoll = interactive.type === "poll" && Array.isArray(interactive.options) && interactive.options.length > 0;
  const isCalc = interactive.type === "calculation";
  const isReflection = interactive.type === "reflection" || interactive.type === "drag_drop";

  const handleSubmit = () => {
    if (isPoll && !selectedOption) return;
    if (!isPoll && !textAnswer.trim()) return;
    setSubmitted(true);
    onSubmit?.(selectedOption || textAnswer);
  };

  const reset = () => {
    setSelectedOption(null);
    setTextAnswer("");
    setSubmitted(false);
    setHintsShown(0);
    setShowReveal(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest",
          isPoll ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300" :
          isCalc ? "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300" :
          "bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300"
        )}>
          <Sparkles className="h-3 w-3" />
          {isPoll ? (ar ? "تصويت" : "Poll") : isCalc ? (ar ? "احسب" : "Calculate") : (ar ? "تأمل" : "Reflect")}
        </span>
      </div>

      {/* Question prompt */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3.5">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          <StemRenderer content={interactive.prompt} />
        </div>
      </div>

      {/* Poll options */}
      {isPoll && !submitted && (
        <div className="space-y-2">
          {interactive.options!.map((option, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = selectedOption === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedOption(letter)}
                className={cn(
                  "w-full flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all",
                  isSelected
                    ? "border-[#0E6C3C] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-[#0E6C3C]"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40"
                )}
              >
                <span className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold",
                  isSelected ? "bg-[#0E6C3C] text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}>
                  {letter}
                </span>
                <span className="leading-relaxed flex-1">
                  <StemRenderer content={option} inline />
                </span>
                {isSelected && <ChevronRight className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Text input for calculation / reflection */}
      {(isCalc || isReflection) && !submitted && (
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          rows={4}
          placeholder={isCalc
            ? (ar ? "اكتب حسابك خطوة بخطوة..." : "Show your working step by step...")
            : (ar ? "اكتب تأملك هنا..." : "Write your reflection here...")}
          className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition resize-none"
          dir={ar ? "rtl" : "ltr"}
        />
      )}

      {/* Submit button */}
      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPoll ? !selectedOption : !textAnswer.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Send className="h-3.5 w-3.5" />
          {ar ? "إرسال الإجابة" : "Submit Answer"}
        </button>
      )}

      {/* Post-submission: show selected answer */}
      {submitted && isPoll && selectedOption && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {ar ? "إجابتك" : "Your answer"}
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {selectedOption}) <StemRenderer content={interactive.options![selectedOption.charCodeAt(0) - 65] || ""} inline />
          </p>
        </div>
      )}

      {/* Progressive hints */}
      {interactive.hints && interactive.hints.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {ar ? "تلميحات" : "Hints"}
            </span>
            {hintsShown < interactive.hints.length && (
              <button
                type="button"
                onClick={() => setHintsShown(n => n + 1)}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 transition-colors"
              >
                <Lightbulb className="h-3 w-3" />
                {ar ? `تلميح ${hintsShown + 1}` : `Hint ${hintsShown + 1}`}
              </button>
            )}
          </div>

          {interactive.hints.slice(0, hintsShown).map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-2.5 flex items-start gap-2"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-bold">{ar ? `تلميح ${i + 1}:` : `Hint ${i + 1}:`} </span>
                <StemRenderer content={hint} inline />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reveal — only shown after submission */}
      {submitted && interactive.reveal && (
        <div className="space-y-2">
          {!showReveal ? (
            <button
              type="button"
              onClick={() => setShowReveal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {ar ? "اكشف الإجابة الكاملة" : "Reveal Full Answer"}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {ar ? "الإجابة والتفسير" : "Answer & Explanation"}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <StemRenderer content={interactive.reveal} />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Reset button */}
      {submitted && (
        <button
          type="button"
          onClick={reset}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          {ar ? "حاول مرة أخرى" : "Try again"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssessmentMCQ — legacy assessment format from the DB
// ---------------------------------------------------------------------------

function AssessmentMCQ({
  assessment,
  concept,
  ar,
  experienceId,
  onAnswer,
}: {
  assessment: NonNullable<StudentConceptViewModel["assessment"]>;
  concept: StudentConceptViewModel;
  ar: boolean;
  experienceId: string;
  onAnswer: (optionId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; correctOptionId: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const submit = async (optionId: string) => {
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
        setResult(null);
      }
    } catch {
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
          coreInsight: concept.coreContent?.explanation || concept.visibleCopy || "",
          mechanismSteps: concept.coreContent?.steps || concept.bullets || [],
          commonPitfalls: concept.commonPitfalls?.map(p => ({
            misconception: p.misconception,
            whyWrong: p.whyWrong,
            betterWay: p.betterWay,
          })) || [],
          assessmentStem: assessment.stem,
        }),
      });
      const data = await res.json();
      setHint(data.reply || (ar ? "فكر في الآلية الأساسية وكيف تؤثر على النتيجة." : "Think about the core mechanism and how it affects the outcome."));
    } catch {
      setHint(ar ? "راجع الفكرة الأساسية للمفهوم ثم حاول مرة أخرى." : "Review the core concept then try again.");
    } finally {
      setLoadingHint(false);
    }
  };

  const reset = () => {
    setSelectedId(null);
    setSubmitted(false);
    setResult(null);
    setHint(null);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
          <Sparkles className="h-3 w-3 text-emerald-600" />
          {ar ? "اختبر فهمك" : "Check Your Understanding"}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
          {assessment.difficulty}
        </span>
      </div>

      {/* Stem */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3.5">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          <StemRenderer content={ar && assessment.stemAr ? assessment.stemAr : assessment.stem} />
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {assessment.options.map((option, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selectedId === option.id;
          const isCorrect = submitted && result?.correctOptionId === option.id;
          const isWrong = submitted && result && isSelected && !result.correct;

          return (
            <button
              key={option.id}
              type="button"
              disabled={submitted || checking}
              onClick={() => submit(option.id)}
              className={cn(
                "w-full flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all",
                isCorrect
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500"
                  : isWrong
                    ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 ring-1 ring-red-400"
                    : isSelected
                      ? "border-[#0E6C3C] bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-[#0E6C3C]"
                      : submitted
                        ? "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-400 cursor-not-allowed"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer"
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold",
                isCorrect ? "bg-emerald-600 text-white" :
                isWrong ? "bg-red-500 text-white" :
                isSelected ? "bg-[#0E6C3C] text-white" :
                "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              )}>
                {letter}
              </span>
              <span className="flex-1 leading-relaxed">
                <StemRenderer content={ar && option.textAr ? option.textAr : option.text} inline />
              </span>
              {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 ml-auto" />}
              {isWrong && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5 ml-auto" />}
            </button>
          );
        })}
      </div>

      {/* Verdict */}
      {submitted && result && (
        <div className={cn(
          "p-3 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2",
          result.correct
            ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200"
            : "border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
        )}>
          {result.correct
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            : <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
          <span>
            {result.correct
              ? (ar ? "✓ صحيح! أحسنت." : "✓ Correct! Well done.")
              : (ar
                  ? "ليست الإجابة الصحيحة. الإجابة الصحيحة مميزة باللون الأخضر. راجع المفهوم الأساسي."
                  : "Not quite. The correct answer is highlighted in green. Review the core concept above.")}
          </span>
        </div>
      )}

      {/* Hint + Reset row */}
      <div className="flex gap-2">
        {!hint ? (
          <button
            type="button"
            onClick={fetchHint}
            disabled={loadingHint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {loadingHint ? (ar ? "جارٍ..." : "Loading...") : (ar ? "تلميح" : "Hint")}
          </button>
        ) : (
          <div className="flex-1 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
            <StemRenderer content={hint} inline />
          </div>
        )}

        {submitted && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            {ar ? "حاول" : "Retry"}
          </button>
        )}
      </div>

      {submitted && (
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
          {ar ? "✓ تم تسجيل إجابتك" : "✓ Answer recorded — continue to the next concept"}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityPrompt — open-ended activity with progressive hints
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
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const hints = activity.progressiveHints || [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300">
          <Sparkles className="h-3 w-3" />
          {activity.actionVerb || (ar ? "نشاط" : "Activity")}
        </span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
          {activity.title}
        </span>
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3.5">
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          <StemRenderer content={ar && activity.promptAr ? activity.promptAr : activity.prompt} />
        </div>
      </div>

      {/* Text area */}
      {!submitted ? (
        <div className="space-y-2">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder={ar ? "اكتب إجابتك هنا..." : "Write your answer here..."}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition resize-none"
            dir={ar ? "rtl" : "ltr"}
          />
          <button
            type="button"
            disabled={!answer.trim()}
            onClick={() => { setSubmitted(true); onSubmit?.(answer); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-bold transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            {ar ? "إرسال" : "Submit"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
            &ldquo;{answer}&rdquo;
          </div>
          <div className="flex items-center gap-1.5 justify-center text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            {ar ? "تم الحفظ" : "Saved — keep going!"}
          </div>
        </div>
      )}

      {/* Progressive hints */}
      {hints.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {ar ? "تلميحات" : "Hints"}
            </span>
            {hintsShown < hints.length && (
              <button
                type="button"
                onClick={() => setHintsShown(n => n + 1)}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900"
              >
                <ChevronDown className="h-3 w-3" />
                {ar ? `تلميح (${hintsShown}/${hints.length})` : `Hint (${hintsShown}/${hints.length})`}
              </button>
            )}
          </div>
          {hints.slice(0, hintsShown).map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/15 p-2.5 flex items-start gap-2 text-xs"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 dark:text-amber-200">
                <span className="font-bold">{ar ? `${i + 1}:` : `Hint ${i + 1}:`} </span>
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
// KeyPointsSummary — shown when there's no explicit activity / assessment
// ---------------------------------------------------------------------------

function KeyPointsSummary({
  concept,
  ar,
}: {
  concept: StudentConceptViewModel;
  ar: boolean;
}) {
  const bullets = concept.bullets || [];
  const explanation = concept.coreContent?.explanation || concept.visibleCopy || "";
  const analogy = concept.coreContent?.analogy || "";
  const realWorld = concept.realWorld?.application || "";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
          <BookMarked className="h-3 w-3" />
          {ar ? "النقاط الرئيسية" : "Key Points"}
        </span>
      </div>

      {/* Core explanation */}
      {explanation && (
        <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/10 p-3.5">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
            <StemRenderer content={explanation} />
          </p>
        </div>
      )}

      {/* Bullets */}
      {bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
              <span className="leading-relaxed"><StemRenderer content={b} inline /></span>
            </li>
          ))}
        </ul>
      )}

      {/* Analogy */}
      {analogy && (
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10 p-3 flex items-start gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
            <StemRenderer content={analogy} inline />
          </p>
        </div>
      )}

      {/* Real world */}
      {realWorld && (
        <div className="rounded-xl border border-purple-200/60 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-950/10 p-3 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700 dark:text-purple-400">
            {ar ? "التطبيق العملي" : "Real-World Application"}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <StemRenderer content={realWorld} inline />
          </p>
        </div>
      )}

      {/* Prompt to reflect */}
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-3 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {ar
            ? "تأمل في هذا المفهوم واطرح سؤالاً على المعلم الذكي إذا احتجت مساعدة."
            : "Reflect on this concept. Use the AI Tutor if you have questions."}
        </p>
      </div>
    </div>
  );
}
