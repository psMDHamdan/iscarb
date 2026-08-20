"use client";

/**
 * ActivityWidget — routes to the correct interaction widget based on `interactionType`.
 *
 * Routing logic:
 *   "readiness"      → renders ReadinessItemCard components for each readiness item
 *   "mcq"            → MCQ options with role="radiogroup" / role="radio", calls onActivitySubmit("mcq", { selectedIndex })
 *   "poll"           → poll buttons, calls onActivitySubmit("poll", { vote })
 *   "reflection"     → textarea, requires text.length >= 10 to submit; calls onActivitySubmit("reflection", { text })
 *   "worked_example" → step-through worked example, calls onActivitySubmit("worked_example", {})
 *   null / other     → nothing rendered (empty fragment)
 *
 * Inline warning (not a modal) is shown in the Interactive Zone when a student
 * attempts to advance without completing the Check Phase activity.
 *
 * Validates: Requirements 1.4, 4.5, 4.7, 10.6
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";

import { ReadinessItemCard } from "./ReadinessItemCard";
import { parsePollAction, stripLeakedAnswer } from "@/lib/lecture/player-actions";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityWidgetProps {
  /** The interaction type string from the slide's `interactions` map */
  interactionType: "mcq" | "poll" | "reflection" | "worked_example" | "readiness" | null;

  /** The slide's action/prompt text (used for MCQ stem, poll question, reflection prompt) */
  actionText: string | null | undefined;

  /** Readiness items for the current slide (used when interactionType === "readiness") */
  readinessItems: ReadinessItemJson[];

  /** Current slide number — used to build unique keys */
  slideNo: number;

  /**
   * Callback fired when the activity is successfully submitted.
   * The orchestrator should use this to unlock forward navigation (Check Phase completion).
   */
  onActivitySubmit: (
    type: "mcq" | "poll" | "reflection" | "worked_example",
    payload: unknown
  ) => void;

  /**
   * Callback fired when a ReadinessItemCard answer is selected.
   * Matches the InteractiveZone contract: (itemKey, optionIndex, item) => void
   */
  onReadinessAnswer: (
    itemKey: string,
    optionIndex: number,
    item: ReadinessItemJson
  ) => void;

  /** Pre-existing selected answers for readiness items: itemKey → optionIndex */
  readinessSelectedAnswers: Record<string, number>;

  /** Whether to show the inline "complete this activity to advance" warning */
  showAdvanceWarning: boolean;

  /** Arabic language mode */
  ar: boolean;

  /** AI Learning Coach / Misconception data */
  misconceptionData?: any;
  onDismissMisconception?: () => void;
  hintData?: { hint: string; level: number };
  onRequestHint?: (question: string, level: number) => void;
  hintLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Inline warning banner (not a modal/alert)
// Requirement 4.7: displayed in the Interactive Zone when student tries to advance
// without completing Check Phase
// ---------------------------------------------------------------------------
function InlineAdvanceWarning({ ar }: { ar: boolean }) {
  return (
    <AnimatePresence>
      <motion.div
        key="advance-warning"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        role="alert"
        aria-live="polite"
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-sm font-medium"
      >
        <AlertTriangle
          className="h-4 w-4 text-amber-500 shrink-0"
          aria-hidden="true"
        />
        <span>
          {ar
            ? "أكمل النشاط أولاً لإلغاء قفل الشريحة التالية."
            : "Complete this activity first to unlock the next slide."}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// MCQ widget
// Requirement 10.6: role="radiogroup" / role="radio", Tab + Enter/Space operable
// ---------------------------------------------------------------------------
interface McqWidgetProps {
  stem: string;
  options: string[];
  slideNo: number;
  onSubmit: (selectedIndex: number) => void;
  ar: boolean;
}

function McqWidget({ stem, options, slideNo, onSubmit, ar }: McqWidgetProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(idx);
    }
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    onSubmit(selected);
  };

  const optionListVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const optionItemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Badge
          variant="outline"
          className="text-[10px] font-mono bg-purple-500/8 text-purple-700 dark:text-purple-300 border-purple-500/25"
        >
          {ar ? "سؤال اختيار متعدد" : "Multiple Choice"} · S{slideNo}
        </Badge>
        <p className="text-sm font-semibold text-foreground leading-snug">{stem}</p>
      </div>

      <motion.div
        role="radiogroup"
        aria-label={ar ? "خيارات الإجابة" : "Answer options"}
        aria-required="true"
        variants={optionListVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          return (
            <motion.div key={`mcq-${slideNo}-opt-${idx}`} variants={optionItemVariants}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={submitted}
                tabIndex={0}
                onClick={() => handleSelect(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border text-sm transition-colors duration-150 flex items-center gap-3 cursor-pointer disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1",
                  isSelected
                    ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 font-semibold"
                    : "border-border/70 bg-card hover:border-purple-400/50 hover:bg-muted/40 text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold border",
                    isSelected
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-border bg-muted/50 text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {!submitted ? (
        <Button
          size="sm"
          disabled={selected === null}
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {ar ? "تأكيد الإجابة" : "Submit Answer"}
        </Button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-500/30 text-xs text-purple-800 dark:text-purple-200 font-medium">
          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
          {ar ? "تم تسجيل إجابتك." : "Answer recorded."}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Poll widget
// ---------------------------------------------------------------------------
interface PollWidgetProps {
  question: string;
  options: string[];
  slideNo: number;
  onSubmit: (vote: number) => void;
  ar: boolean;
}

function PollWidget({ question, options, slideNo, onSubmit, ar }: PollWidgetProps) {
  const [voted, setVoted] = useState(false);
  const [vote, setVote] = useState<number | null>(null);

  const handleVote = (idx: number) => {
    if (voted) return;
    setVote(idx);
    setVoted(true);
    onSubmit(idx);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-600 text-white rounded-xl shadow-sm shrink-0">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            {ar ? "استطلاع تفاعلي:" : "Interactive Poll:"}
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{question}</p>
        </div>
        {!voted && (
          <Badge
            variant="secondary"
            className="ml-auto shrink-0 bg-amber-100 text-amber-700 border-amber-200 text-[10px] uppercase tracking-wider animate-pulse"
          >
            {ar ? "أجب" : "Vote"}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isVoted = voted && vote === idx;
          return (
            <button
              key={`poll-${slideNo}-opt-${idx}`}
              type="button"
              disabled={voted}
              onClick={() => handleVote(idx)}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 text-sm font-medium cursor-pointer shadow-sm disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1",
                isVoted
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-100 font-bold"
                  : voted
                  ? "border-border/40 bg-muted/20 opacity-50 text-muted-foreground"
                  : "border-border/80 bg-card hover:border-sky-400/60 hover:bg-muted/40 text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono border",
                  isVoted
                    ? "bg-sky-600 border-sky-600 text-white"
                    : "border-border bg-muted/50 text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="leading-snug">{opt}</span>
              {isVoted && (
                <CheckCircle2
                  className="h-4 w-4 text-sky-600 shrink-0 ml-auto"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {voted && (
        <p className="text-[11px] font-mono text-sky-700 dark:text-sky-300">
          {ar ? "✓ تم تسجيل تصويتك." : "✓ Vote recorded."}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reflection widget
// Requirement 4.6: text.length >= 10 to unlock Check Phase
// ---------------------------------------------------------------------------
interface ReflectionWidgetProps {
  prompt: string;
  slideNo: number;
  onSubmit: (text: string) => void;
  isCollab?: boolean;
  isDiscuss?: boolean;
  ar: boolean;
}

function ReflectionWidget({
  prompt,
  slideNo,
  onSubmit,
  isCollab = false,
  isDiscuss = false,
  ar,
}: ReflectionWidgetProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Requirement 4.6: reflection text must be >= 10 characters to unlock
  const MIN_LENGTH = 10;
  const canSubmit = text.trim().length >= MIN_LENGTH;

  const handleSubmit = () => {
    if (!canSubmit || submitted) return;
    setSubmitted(true);
    onSubmit(text.trim());
  };

  const accent = isCollab ? "amber" : isDiscuss ? "teal" : "emerald";

  const accentClasses = {
    amber: {
      icon: "bg-amber-600",
      label: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/40",
      bg: "from-amber-500/10",
      btnBg: "bg-amber-600 hover:bg-amber-700",
      successBg: "bg-amber-50 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-200",
    },
    teal: {
      icon: "bg-teal-600",
      label: "text-teal-700 dark:text-teal-300",
      border: "border-teal-500/40",
      bg: "from-teal-500/10",
      btnBg: "bg-teal-600 hover:bg-teal-700",
      successBg: "bg-teal-50 dark:bg-teal-950/20 border-teal-500/30 text-teal-800 dark:text-teal-200",
    },
    emerald: {
      icon: "bg-emerald-600",
      label: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/40",
      bg: "from-emerald-500/10",
      btnBg: "bg-emerald-600 hover:bg-emerald-700",
      successBg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200",
    },
  };

  const c = accentClasses[accent];

  const labelText = isCollab
    ? ar
      ? "نشاط تعاوني جماعي:"
      : "Collaborative Activity:"
    : isDiscuss
    ? ar
      ? "توقف وناقش:"
      : "Pause & Discuss:"
    : ar
    ? "تأمّل وأجب:"
    : "Reflect & Respond:";

  return (
    <div
      className={cn(
        "space-y-4 p-4 rounded-2xl border bg-gradient-to-br to-transparent",
        c.border,
        c.bg
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 text-white rounded-xl shadow-sm shrink-0", c.icon)}>
          {isCollab ? (
            <Users className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-0.5">
          <div className={cn("text-[10px] font-bold uppercase tracking-wider", c.label)}>
            {labelText}
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{prompt}</p>
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-2">
          <textarea
            id={`reflection-${slideNo}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              ar
                ? `اكتب إجابتك هنا (${MIN_LENGTH} أحرف على الأقل)…`
                : `Write your response here (at least ${MIN_LENGTH} characters)…`
            }
            aria-label={ar ? "مربع التأمل" : "Reflection text area"}
            aria-required="true"
            className="w-full min-h-[88px] rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            dir={ar ? "rtl" : "ltr"}
            maxLength={600}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">
              {text.trim().length}/{MIN_LENGTH} min ·{" "}
              {text.length}/600
            </span>
            <Button
              size="sm"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={cn(
                "text-white font-semibold text-xs h-8 px-4 disabled:opacity-40",
                c.btnBg
              )}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {ar ? "تسليم (+5 نقاط)" : "Submit (+5 pts)"}
            </Button>
          </div>
          {/* inline hint when too short — NOT a modal */}
          {text.length > 0 && !canSubmit && (
            <p
              className="text-[11px] text-muted-foreground font-mono"
              role="status"
              aria-live="polite"
            >
              {ar
                ? `${MIN_LENGTH - text.trim().length} أحرف إضافية مطلوبة`
                : `${MIN_LENGTH - text.trim().length} more character${MIN_LENGTH - text.trim().length === 1 ? "" : "s"} needed`}
            </p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium",
            c.successBg
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 min-w-0">
            <p className="font-bold">
              {ar ? "تم التسليم بنجاح! (+5 نقاط)" : "Submitted successfully! (+5 pts)"}
            </p>
            <p className="font-mono italic text-foreground/80 break-words">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worked Example widget
// ---------------------------------------------------------------------------
interface WorkedExampleWidgetProps {
  prompt: string;
  slideNo: number;
  onComplete: () => void;
  ar: boolean;
}

function WorkedExampleWidget({
  prompt,
  slideNo,
  onComplete,
  ar,
}: WorkedExampleWidgetProps) {
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState("");
  const [completed, setCompleted] = useState(false);

  type SelfRating = "solved" | "partial" | "stuck";
  const [rating, setRating] = useState<SelfRating | null>(null);

  const cleanPrompt = stripLeakedAnswer(prompt);

  const handleRate = (r: SelfRating) => {
    if (rating) return;
    setRating(r);
    setCompleted(true);
    onComplete();
  };

  const ratings: { value: SelfRating; labelEn: string; labelAr: string }[] = [
    { value: "solved", labelEn: "Solved it", labelAr: "حللتها" },
    { value: "partial", labelEn: "Partial", labelAr: "حل جزئي" },
    { value: "stuck", labelEn: "Stuck", labelAr: "لم أتوصل" },
  ];

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-transparent">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm shrink-0">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            {ar ? "المثال المحلول:" : "Worked Example:"}
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{cleanPrompt}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`worked-attempt-${slideNo}`}
          className="text-xs font-semibold text-foreground"
        >
          {ar ? "اكتب خطوات حلك:" : "Write your solution steps:"}
        </label>
        <textarea
          id={`worked-attempt-${slideNo}`}
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          disabled={completed}
          placeholder={
            ar
              ? "اكتب محاولتك هنا…"
              : "Write your attempt here…"
          }
          aria-label={ar ? "مربع محاولة الحل" : "Solution attempt text area"}
          className="w-full min-h-[80px] rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
          dir={ar ? "rtl" : "ltr"}
          maxLength={600}
        />
      </div>

      {!completed ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            {ar ? "هل توصلت إلى الحل؟ (+5 نقاط)" : "Did you reach the solution? (+5 pts)"}
          </p>
          <div className="flex flex-wrap gap-2">
            {ratings.map(({ value, labelEn, labelAr }) => (
              <Button
                key={value}
                size="sm"
                variant="outline"
                onClick={() => handleRate(value)}
                className={cn(
                  "text-xs rounded-xl h-8 px-3 border-border/70 hover:border-purple-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                  value === "solved" &&
                    "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                )}
              >
                {ar ? labelAr : labelEn}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-500/30 text-xs font-medium text-purple-800 dark:text-purple-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />
          <span>
            {rating === "solved" && (ar ? "أحسنت! محاولتك مسجلة (+5)" : "Great work — attempt recorded (+5 pts)")}
            {rating === "partial" && (ar ? "خطوة جيدة! راجع الأجزاء الناقصة (+5)" : "Good start — review the gaps (+5 pts)")}
            {rating === "stuck" && (ar ? "لا بأس — راجع المحتوى وحاول مجدداً (+5)" : "No problem — review and try again (+5 pts)")}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Readiness widget
// ---------------------------------------------------------------------------
interface ReadinessWidgetProps {
  items: ReadinessItemJson[];
  slideNo: number;
  selectedAnswers: Record<string, number>;
  onAnswer: (itemKey: string, optionIndex: number, item: ReadinessItemJson) => void;
  ar: boolean;
  misconceptionData?: any;
  onDismissMisconception?: () => void;
  hintData?: { hint: string; level: number };
  onRequestHint?: (question: string, level: number) => void;
  hintLoading?: boolean;
}

function ReadinessWidget({
  items,
  slideNo,
  selectedAnswers,
  onAnswer,
  ar,
  misconceptionData,
  onDismissMisconception,
  hintData,
  onRequestHint,
  hintLoading,
}: ReadinessWidgetProps) {
  // Per-item reveal state, managed locally so each card has its own state
  const [revealStates, setRevealStates] = useState<
    Record<string, "HIDDEN" | "HINT" | "REVEALED">
  >({});

  const getRevealState = (key: string): "HIDDEN" | "HINT" | "REVEALED" =>
    revealStates[key] ?? "HIDDEN";

  const setReveal = (key: string, state: "HIDDEN" | "HINT" | "REVEALED") =>
    setRevealStates((prev) => ({ ...prev, [key]: state }));

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">
        {ar ? "لا توجد أسئلة جاهزية لهذه الشريحة." : "No readiness items for this slide."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const itemKey = `${slideNo}-${idx}`;
        const revealState = getRevealState(itemKey);
        const selectedAnswer = selectedAnswers[itemKey];

        return (
          <ReadinessItemCard
            key={itemKey}
            item={item}
            itemKey={itemKey}
            selectedAnswer={selectedAnswer}
            revealState={revealState}
            onHint={() => setReveal(itemKey, "HINT")}
            onReveal={() => setReveal(itemKey, "REVEALED")}
            onSelect={(optionIndex) => onAnswer(itemKey, optionIndex, item)}
            onTryAgain={() => {
              // Reset the reveal state to REVEALED (options already visible, but answer cleared)
              setReveal(itemKey, "REVEALED");
            }}
            ar={ar}
            misconceptionData={misconceptionData}
            onDismissMisconception={onDismissMisconception}
            hintData={hintData}
            onRequestHint={onRequestHint}
            hintLoading={hintLoading}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityWidget — main router
// ---------------------------------------------------------------------------
export function ActivityWidget({
  interactionType,
  actionText,
  readinessItems,
  slideNo,
  onActivitySubmit,
  onReadinessAnswer,
  readinessSelectedAnswers,
  showAdvanceWarning,
  ar,
  misconceptionData,
  onDismissMisconception,
  hintData,
  onRequestHint,
  hintLoading,
}: ActivityWidgetProps) {
  // ---------------------------------------------------------------------------
  // Derive widget props from actionText
  // ---------------------------------------------------------------------------

  // Try to parse a poll from the actionText
  const parsedPoll = parsePollAction(actionText);

  // Cleaned action text (strip leaked answers for worked_example / reflection)
  const cleanAction = actionText ? stripLeakedAnswer(actionText) : "";

  // For MCQ: the options live inside the actionText OR in readinessItems options.
  // We try the readiness item first; if none, fall back to parsing from actionText.
  const mcqItem = readinessItems[0];
  const mcqStem = mcqItem?.stem ?? cleanAction ?? "";
  const mcqOptions: string[] = mcqItem
    ? mcqItem.options.map((o) =>
        typeof o === "string" ? o : (o as { text: string }).text
      )
    : [];

  // Determine if this is a collaborative / discuss-style reflection
  const rawType = interactionType ?? "";
  const isCollab = rawType === "collaboration" || /\bin groups?\b|\bteam\b/i.test(cleanAction);
  const isDiscuss = rawType === "pause_discuss" || /\bpause\b.*\bdiscuss\b/i.test(cleanAction);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-3">
      {/* Inline advance warning — not a modal/alert dialog */}
      {showAdvanceWarning && <InlineAdvanceWarning ar={ar} />}

      {/* Route to the appropriate widget */}
      {interactionType === "readiness" && (
        <ReadinessWidget
          items={readinessItems}
          slideNo={slideNo}
          selectedAnswers={readinessSelectedAnswers}
          onAnswer={onReadinessAnswer}
          ar={ar}
          misconceptionData={misconceptionData}
          onDismissMisconception={onDismissMisconception}
          hintData={hintData}
          onRequestHint={onRequestHint}
          hintLoading={hintLoading}
        />
      )}

      {interactionType === "mcq" && mcqOptions.length > 0 && (
        <McqWidget
          stem={mcqStem}
          options={mcqOptions}
          slideNo={slideNo}
          onSubmit={(selectedIndex) =>
            onActivitySubmit("mcq", { selectedIndex })
          }
          ar={ar}
        />
      )}

      {interactionType === "poll" && parsedPoll && (
        <PollWidget
          question={parsedPoll.question}
          options={parsedPoll.options}
          slideNo={slideNo}
          onSubmit={(vote) => onActivitySubmit("poll", { vote })}
          ar={ar}
        />
      )}

      {/* Fall back to inline poll parsing for untyped slides where actionText is poll-shaped */}
      {interactionType !== "poll" &&
        interactionType !== "mcq" &&
        interactionType !== "reflection" &&
        interactionType !== "worked_example" &&
        interactionType !== "readiness" &&
        parsedPoll && (
          <PollWidget
            question={parsedPoll.question}
            options={parsedPoll.options}
            slideNo={slideNo}
            onSubmit={(vote) => onActivitySubmit("poll", { vote })}
            ar={ar}
          />
        )}

      {interactionType === "reflection" && (
        <ReflectionWidget
          prompt={cleanAction}
          slideNo={slideNo}
          onSubmit={(text) => onActivitySubmit("reflection", { text })}
          isCollab={isCollab}
          isDiscuss={isDiscuss}
          ar={ar}
        />
      )}

      {/* Also render reflection for null/untyped when there's a non-poll action prompt */}
      {interactionType === null && !parsedPoll && cleanAction && (
        <ReflectionWidget
          prompt={cleanAction}
          slideNo={slideNo}
          onSubmit={(text) => onActivitySubmit("reflection", { text })}
          isCollab={isCollab}
          isDiscuss={isDiscuss}
          ar={ar}
        />
      )}

      {interactionType === "worked_example" && (
        <WorkedExampleWidget
          prompt={cleanAction}
          slideNo={slideNo}
          onComplete={() => onActivitySubmit("worked_example", {})}
          ar={ar}
        />
      )}

      {/* Empty state: interactionType present but nothing rendered yet */}
      {interactionType !== null &&
        interactionType !== "readiness" &&
        interactionType !== "mcq" &&
        interactionType !== "poll" &&
        interactionType !== "reflection" &&
        interactionType !== "worked_example" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
            <span>
              {ar
                ? "لا يوجد نشاط تفاعلي لهذه الشريحة."
                : "No interactive activity for this slide."}
            </span>
          </div>
        )}

      {/* MCQ with no options parsed — show a graceful fallback */}
      {interactionType === "mcq" && mcqOptions.length === 0 && (
        <ReflectionWidget
          prompt={mcqStem || cleanAction}
          slideNo={slideNo}
          onSubmit={(text) => onActivitySubmit("reflection", { text })}
          ar={ar}
        />
      )}
    </div>
  );
}
