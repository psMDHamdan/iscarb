"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  RotateCcw,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { ReadinessItemJson } from "@/lib/lecture/generation/types";
import { MisconceptionPanel } from "./MisconceptionPanel";
import { HintPanel } from "./HintPanel";
import { StemRenderer } from "@/components/ui/StemRenderer";

export interface ReadinessItemCardProps {
  item: ReadinessItemJson;
  itemKey: string;
  selectedAnswer: number | undefined;
  revealState: "HIDDEN" | "HINT" | "REVEALED";
  onHint: () => void;
  onReveal: () => void;
  onSelect: (optionIndex: number) => void;
  onTryAgain: () => void;
  ar: boolean;
  misconceptionData?: any;
  onDismissMisconception?: () => void;
  hintData?: { hint: string; level: number };
  onRequestHint?: (question: string, level: number) => void;
  hintLoading?: boolean;
}

/**
 * Derives a hint string from the rationale field.
 *
 * Per Requirement 6.2: "first sentence, excluding the correct-answer text".
 * We take the first sentence of rationale (up to the first period/question mark/exclamation)
 * and strip any occurrence of the correct-option text to avoid leaking the answer.
 */
function deriveHint(rationale: string, correctOptionText: string): string {
  // Extract first sentence
  const sentenceMatch = rationale.match(/^[^.!?]*[.!?]/);
  const firstSentence = sentenceMatch ? sentenceMatch[0] : rationale.split("\n")[0] ?? rationale;

  // Strip any prefix-match of the correct-answer text (case-insensitive)
  if (!correctOptionText) return firstSentence;

  // Build a safe regex from the correct option text to remove it
  const escaped = correctOptionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return firstSentence.replace(new RegExp(escaped, "gi"), "___").trim();
}

/**
 * ReadinessItemCard — implements the hidden-answer architecture (BRD §3.3).
 *
 * State machine (driven by `revealState` + `selectedAnswer` props):
 *   HIDDEN   → "Think First" card: stem only, no options in DOM
 *   HINT     → Hint text visible, options still NOT in DOM
 *   REVEALED → Options animate in via Framer Motion stagger (staggerChildren: 0.08)
 *   ANSWERED (selectedAnswer !== undefined) → Color-coded result + rationale feedback card
 *              "Try Again" clears selection and returns to REVEALED
 *
 * SECURITY: correctIndex, rationale text, and correct-option indicators are
 * NEVER rendered to the DOM before `selectedAnswer` is defined.
 */
export function ReadinessItemCard({
  item,
  itemKey,
  selectedAnswer,
  revealState,
  onHint,
  onReveal,
  onSelect,
  onTryAgain,
  ar,
  misconceptionData,
  onDismissMisconception,
  hintData,
  onRequestHint,
  hintLoading,
}: ReadinessItemCardProps) {
  const isAnswered = selectedAnswer !== undefined;

  // Only derive these values after an answer is selected — never before.
  const correctIndex = isAnswered ? item.correctIndex : null;
  const isCorrectAnswer = isAnswered && selectedAnswer === item.correctIndex;

  const correctOptionText =
    item.options[item.correctIndex] !== undefined
      ? typeof item.options[item.correctIndex] === "string"
        ? (item.options[item.correctIndex] as unknown as string)
        : item.options[item.correctIndex].text
      : "";

  const hint = deriveHint(item.rationale, correctOptionText);

  // ── Framer Motion variants ──────────────────────────────────────────────
  const optionListVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const optionItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: "easeOut" as const },
    },
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card shadow-sm transition-colors duration-300",
        isAnswered
          ? isCorrectAnswer
            ? "border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/20"
            : "border-red-500/50 bg-red-50/60 dark:bg-red-950/20"
          : "border-border/70 hover:border-[#0F7B8A]/30"
      )}
    >
      <div className="p-6 space-y-5">

        {/* ── Question Stem — always visible ─────────────────────────────── */}
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] bg-[#0F7B8A]/8 text-[#0F7B8A] border-[#0F7B8A]/25"
          >
            {ar ? "سؤال الجاهزية" : "Readiness Check"} · S{item.slideNo}
          </Badge>
          <h4 className="font-semibold text-base leading-snug text-foreground">
            <StemRenderer content={item.stem} inline />
          </h4>
        </div>

        {/* ── HIDDEN state: Think First card ─────────────────────────────── */}
        {revealState === "HIDDEN" && !isAnswered && (
          <div className="flex flex-col items-center gap-4 p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-center">
            <Lightbulb className="h-8 w-8 text-amber-500" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {ar ? "فكّر أولاً" : "Think First"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                {ar
                  ? "خذ لحظة لصياغة إجابتك قبل مشاهدة الخيارات."
                  : "Take a moment to formulate your answer before seeing the options."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={onHint}
                className="border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 text-xs font-semibold"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                {ar ? "عرض تلميح المنهج" : "Standard Hint"}
              </Button>
              {onRequestHint && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestHint(item.stem, hintData ? hintData.level + 1 : 1)}
                  disabled={hintLoading}
                  className="border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold"
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  {hintLoading ? (ar ? "جاري التوليد..." : "Thinking...") : ar ? "تلميح ذكي متدرج" : "AI Progressive Hint"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onReveal}
                className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                {ar ? "عرض الخيارات" : "Reveal Options"}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            {hintData && (
              <div className="w-full text-left">
                <HintPanel
                  hint={hintData.hint}
                  level={hintData.level}
                  loading={hintLoading}
                  onRequestNextLevel={() => onRequestHint?.(item.stem, hintData.level + 1)}
                  isArabic={ar}
                />
              </div>
            )}
          </div>
        )}

        {/* ── HINT state: hint text + Reveal Options button ──────────────── */}
        {revealState === "HINT" && !isAnswered && (
          <div className="space-y-4">
            {/* Hint text — no options in DOM */}
            <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/8 dark:bg-sky-900/20 space-y-2">
              <p className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                {ar ? "تلميح:" : "Hint:"}
              </p>
              <div className="text-sm text-foreground/90 leading-relaxed">
                <StemRenderer content={hint} />
              </div>
            </div>

            {hintData && (
              <HintPanel
                hint={hintData.hint}
                level={hintData.level}
                loading={hintLoading}
                onRequestNextLevel={() => onRequestHint?.(item.stem, hintData.level + 1)}
                isArabic={ar}
              />
            )}

            <div className="flex gap-2">
              {onRequestHint && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestHint(item.stem, hintData ? hintData.level + 1 : 1)}
                  disabled={hintLoading}
                  className="flex-1 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold h-9"
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                  {ar ? "طلب تلميح أعمق بالذكاء الاصطناعي" : "Need AI Adaptive Hint"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onReveal}
                className="flex-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold h-9"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                {ar ? "عرض الخيارات" : "Reveal Options"}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── REVEALED state or ANSWERED: animated option list ───────────── */}
        {(revealState === "REVEALED" || isAnswered) && (
          <motion.div
            role="radiogroup"
            aria-label={ar ? "خيارات الإجابة" : "Answer options"}
            variants={optionListVariants}
            initial={isAnswered ? "visible" : "hidden"}
            animate="visible"
            className="space-y-2.5"
          >
            {item.options.map((opt, idx) => {
              const optionText = typeof opt === "string" ? opt : opt.text;

              // Color-coding logic — only after selection
              const isSelected = isAnswered && selectedAnswer === idx;
              // NOTE: correctIndex is only non-null when isAnswered is true (enforced above)
              const isThisCorrect = isAnswered && idx === correctIndex;

              let optionClass =
                "border-border/70 bg-card hover:border-[#0F7B8A]/40 hover:bg-muted/50 text-foreground";
              let badgeClass =
                "border-border bg-muted/50 text-muted-foreground";

              if (isAnswered) {
                if (isThisCorrect) {
                  optionClass =
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 font-semibold";
                  badgeClass =
                    "border-emerald-600 bg-emerald-600 text-white";
                } else if (isSelected && !isThisCorrect) {
                  optionClass =
                    "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 font-semibold";
                  badgeClass =
                    "border-red-600 bg-red-600 text-white";
                } else {
                  optionClass =
                    "border-border/40 bg-muted/20 text-muted-foreground opacity-60";
                }
              }

              return (
                <motion.button
                  key={`${itemKey}-opt-${idx}`}
                  variants={optionItemVariants}
                  type="button"
                  role="radio"
                  aria-checked={isSelected ? "true" : "false"}
                  disabled={isAnswered}
                  onClick={() => !isAnswered && onSelect(idx)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border text-sm transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default",
                    optionClass
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold border",
                        badgeClass
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">
                      <StemRenderer content={optionText} inline />
                    </span>
                  </div>

                  {/* Feedback icons — only after answer selection */}
                  {isAnswered && isThisCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isThisCorrect && (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ── Post-selection: feedback card (rationale + correct label) ───── */}
        {/* Only rendered after answer selection — never before */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              key={`${itemKey}-feedback`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "p-4 rounded-xl border text-xs space-y-3",
                  isCorrectAnswer
                    ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100"
                    : "border-red-500/40 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100"
                )}
              >
                {/* Result header */}
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                  {isCorrectAnswer ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {ar ? "إجابة صحيحة!" : "Correct Answer!"}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                      <span className="text-red-700 dark:text-red-300">
                        {ar ? "إجابة غير صحيحة" : "Incorrect Answer"}
                      </span>
                    </>
                  )}
                </div>

                {/* Correct answer label — only visible after selection */}
                {!isCorrectAnswer && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {ar ? "الإجابة الصحيحة: " : "Correct answer: "}
                    <span className="font-bold">
                      {String.fromCharCode(65 + item.correctIndex)}.{" "}
                      <StemRenderer
                        content={
                          typeof item.options[item.correctIndex] === "string"
                            ? (item.options[item.correctIndex] as unknown as string)
                            : item.options[item.correctIndex].text
                        }
                        inline
                      />
                    </span>
                  </p>
                )}

                {/* Full rationale — only visible after selection */}
                {item.rationale && (
                  <details open className="group">
                    <summary className="cursor-pointer list-none flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#0F7B8A] hover:opacity-80 select-none">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      {ar ? "الشرح والمبرر" : "Rationale"}
                      <ChevronRight className="h-3.5 w-3.5 ml-auto group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-2 leading-relaxed text-foreground/90 font-mono text-[11px] bg-white/60 dark:bg-slate-900/40 p-3 rounded-lg border border-border/40">
                      <StemRenderer content={item.rationale} />
                    </div>
                  </details>
                )}

                {/* AI Misconception Feedback Panel */}
                {!isCorrectAnswer && misconceptionData && (
                  <MisconceptionPanel
                    data={misconceptionData}
                    onDismiss={onDismissMisconception}
                    onRetry={onTryAgain}
                    isArabic={ar}
                  />
                )}

                {/* Try Again — only for incorrect answers */}
                {!isCorrectAnswer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onTryAgain}
                    className="w-full mt-1 border-border/60 text-foreground hover:bg-muted/60 text-xs font-semibold h-8"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    {ar ? "حاول مرة أخرى" : "Try Again"}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
