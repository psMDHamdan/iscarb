"use client";

/**
 * S20ReadinessGate — Slide 20 Readiness Gate UI.
 *
 * Implements BRD §7.4 scoring: ≥3/4 correct answers required to pass.
 *
 * Responsibilities:
 *  - Display correct/total count, rubric level label, XP score, gate status badge
 *  - "CLEARED": enable "Take Employability Assessment" button, call completedAt PATCH API
 *  - "LOCKED": disable assessment button, show how many more correct answers needed,
 *    render "Retry Readiness Gate" button
 *  - Retry: clears S20 ReadinessItem answers via onRetry(), returns to Check Phase
 *  - 20-segment roadmap recap with Cyan (#06B6D4) / Gold (#F59E0B) / Gray (#94A3B8) scheme
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RotateCcw,
  Star,
  Award,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { computeGateResult } from "@/lib/lecture/readiness-gate";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";

// ---------------------------------------------------------------------------
// Segment color tokens — matches StudentProgressOverlay and ZTM contract
// ---------------------------------------------------------------------------
const SEGMENT_COLORS = {
  completed: "#06B6D4", // Cyan
  current:   "#F59E0B", // Gold  (slide 20)
  future:    "#94A3B8", // Gray
} as const;

const TOTAL_SLIDES = 20;
const SLIDE_20_INDEX = 19; // 0-based

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface S20ReadinessGateProps {
  /** All readiness items for the full lecture (used for scoring). */
  readinessItems: ReadinessItemJson[];
  /** Map of answer key → selected option index. */
  selectedAnswers: Record<string, number>;
  /** 0-based set of completed slide indices (for roadmap recap). */
  completedSlideIndices: Set<number>;
  /** Cumulative XP score to display. */
  xpScore: number;
  /**
   * Called when student chooses "Retry Readiness Gate".
   * Parent must clear S20 ReadinessItem answers and return to Check Phase.
   */
  onRetry: () => void;
  /**
   * Called when student presses "Take Employability Assessment" (only
   * enabled when gate is CLEARED).
   */
  onTakeAssessment: () => void;
  /** Arabic locale flag. */
  ar?: boolean;
}

// ---------------------------------------------------------------------------
// RoadmapRecap — 20-segment bar
// ---------------------------------------------------------------------------
interface RoadmapRecapProps {
  completedSlideIndices: Set<number>;
  ar: boolean;
}

function RoadmapRecap({ completedSlideIndices, ar }: RoadmapRecapProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {ar ? "ملخص مسار التعلم" : "Learning Path Recap"}
      </p>
      <div
        role="progressbar"
        aria-label={ar ? "تقدم المحاضرة" : "Lecture progress"}
        aria-valuenow={completedSlideIndices.size}
        aria-valuemin={0}
        aria-valuemax={TOTAL_SLIDES}
        className="flex items-end gap-[3px] w-full"
      >
        {Array.from({ length: TOTAL_SLIDES }, (_, idx) => {
          const isCompleted = completedSlideIndices.has(idx);
          const isCurrent = idx === SLIDE_20_INDEX; // slide 20 is always "current" here

          const color = isCompleted
            ? SEGMENT_COLORS.completed
            : isCurrent
            ? SEGMENT_COLORS.current
            : SEGMENT_COLORS.future;

          const label = isCompleted
            ? `Segment ${idx + 1}: completed`
            : isCurrent
            ? `Segment ${idx + 1}: readiness gate`
            : `Segment ${idx + 1}: upcoming`;

          // Slightly taller bar for the current segment (slide 20)
          const height = isCurrent ? "h-4" : "h-[6px]";

          return (
            <div
              key={idx}
              aria-label={label}
              className={cn(
                "flex-1 rounded-sm transition-colors",
                height,
                isCurrent && "rounded"
              )}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>{ar ? "البداية" : "Start"}</span>
        <span>
          {completedSlideIndices.size} / {TOTAL_SLIDES}{" "}
          {ar ? "مكتملة" : "completed"}
        </span>
        <span>{ar ? "بوابة الجاهزية" : "Readiness Gate"}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard — small stat display used inside the gate result
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 p-4 rounded-xl border",
        colorClass
      )}
    >
      <div className="text-current opacity-70">{icon}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 text-center">
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// S20ReadinessGate
// ---------------------------------------------------------------------------
export function S20ReadinessGate({
  readinessItems,
  selectedAnswers,
  completedSlideIndices,
  xpScore,
  onRetry,
  onTakeAssessment,
  ar = false,
}: S20ReadinessGateProps) {
  const { correct, total, passed, rubricLevel } = computeGateResult(
    readinessItems,
    selectedAnswers
  );

  const needed = Math.max(0, 3 - correct);

  // When gate is cleared, fire the completedAt PATCH once on mount.
  // We use a ref to guarantee it runs exactly once even in React Strict Mode.
  const patchCalledRef = useRef(false);

  useEffect(() => {
    if (passed && !patchCalledRef.current) {
      patchCalledRef.current = true;
      // completedAt PATCH — fire-and-forget; parent/caller wires the actual
      // API endpoint via onTakeAssessment's surrounding context.
      // We dispatch a custom event so the parent WorkbenchLayout / LecturePlayerView
      // can intercept it without prop-drilling a separate callback.
      window.dispatchEvent(
        new CustomEvent("iscarb:gate-cleared", { detail: { completedAt: new Date().toISOString() } })
      );
    }
  }, [passed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col w-full h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Phase Banner — Amber for Phase 6: Mastery (slides 18–20)            */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="w-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-amber-600 text-white"
        aria-label={ar ? "المرحلة 6: الإتقان" : "Phase 6: Mastery"}
      >
        {ar ? "المرحلة 6: الإتقان · بوابة الجاهزية S20" : "Phase 6: Mastery · S20 Readiness Gate"}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" dir={ar ? "rtl" : "ltr"}>

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-1 text-center">
          <Badge
            variant="outline"
            className={cn(
              "text-sm font-bold px-4 py-1.5 mb-2",
              passed
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                : "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400"
            )}
            aria-label={
              passed
                ? ar ? "بوابة مفتوحة" : "Gate: CLEARED"
                : ar ? "بوابة مغلقة" : "Gate: LOCKED"
            }
          >
            {passed ? (
              <span className="flex items-center gap-1.5">
                <Unlock className="w-4 h-4" />
                {ar ? "مفتوحة" : "CLEARED"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                {ar ? "مغلقة" : "LOCKED"}
              </span>
            )}
          </Badge>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
            {ar ? "بوابة الجاهزية للتقييم" : "Readiness Gate"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {ar
              ? "نتائجك عبر محطات التحقق في المحاضرة كاملة"
              : "Your results across all lecture readiness checks"}
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Stats row: correct/total · rubric level · XP                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label={ar ? "الإجابات الصحيحة" : "Correct"}
            value={`${correct} / ${total}`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            colorClass={
              passed
                ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-red-200 bg-red-50/60 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
            }
          />
          <StatCard
            label={ar ? "مستوى المعيار" : "Rubric Level"}
            value={passed ? (ar ? "متقدم" : "L3+") : (ar ? "ناشئ" : "L1–2")}
            icon={<Award className="w-5 h-5" />}
            colorClass={
              passed
                ? "border-cyan-200 bg-cyan-50/60 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300"
                : "border-amber-200 bg-amber-50/60 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
            }
          />
          <StatCard
            label={ar ? "نقاط الخبرة" : "XP Score"}
            value={xpScore}
            icon={<Zap className="w-5 h-5" />}
            colorClass="border-purple-200 bg-purple-50/60 text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Rubric level label (full text)                                   */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border text-sm font-medium",
            passed
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-200"
          )}
          role="status"
          aria-label={rubricLevel}
        >
          {passed ? (
            <Star className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Star className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span>{rubricLevel}</span>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* LOCKED state message                                              */}
        {/* ---------------------------------------------------------------- */}
        {!passed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  {ar
                    ? `تحتاج إلى ${needed} ${needed === 1 ? "إجابة صحيحة إضافية" : "إجابات صحيحة إضافية"} لفتح البوابة`
                    : `You need ${needed} more correct ${needed === 1 ? "answer" : "answers"} to clear the gate`}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {ar
                    ? "راجع أسئلة الجاهزية وأعد المحاولة."
                    : "Review the readiness questions and try again."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CLEARED state message                                             */}
        {/* ---------------------------------------------------------------- */}
        {passed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {ar
                    ? "تهانينا! لقد اجتزت بوابة الجاهزية بنجاح."
                    : "Congratulations! You have cleared the readiness gate."}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {ar
                    ? "يمكنك الآن المتابعة لتقييم قابلية التوظيف."
                    : "You can now proceed to the employability assessment."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* 20-segment roadmap recap                                          */}
        {/* ---------------------------------------------------------------- */}
        <RoadmapRecap completedSlideIndices={completedSlideIndices} ar={ar} />

        {/* ---------------------------------------------------------------- */}
        {/* Action buttons                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Take Employability Assessment — enabled only when CLEARED */}
          <Button
            onClick={onTakeAssessment}
            disabled={!passed}
            className={cn(
              "w-full h-12 text-sm font-bold gap-2",
              passed
                ? "bg-[#0E6C3C] hover:bg-[#0a5530] text-white focus-visible:ring-emerald-500"
                : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
            )}
            aria-disabled={!passed}
            aria-label={
              passed
                ? ar ? "ابدأ تقييم قابلية التوظيف" : "Take Employability Assessment"
                : ar ? "بوابة الجاهزية مغلقة — لا يمكن الوصول إلى التقييم" : "Gate locked — assessment unavailable"
            }
          >
            {passed ? (
              <>
                <Unlock className="w-4 h-4" />
                {ar ? "ابدأ تقييم قابلية التوظيف" : "Take Employability Assessment"}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {ar ? "تقييم قابلية التوظيف (مقفل)" : "Employability Assessment (Locked)"}
              </>
            )}
          </Button>

          {/* Retry Readiness Gate — only shown when LOCKED */}
          {!passed && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="w-full h-11 text-sm font-semibold gap-2 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30 focus-visible:ring-amber-500"
              aria-label={
                ar
                  ? "إعادة المحاولة — مسح إجابات الجاهزية والعودة إلى مرحلة التحقق"
                  : "Retry Readiness Gate — clears S20 answers and returns to Check Phase"
              }
            >
              <RotateCcw className="w-4 h-4" />
              {ar ? "إعادة بوابة الجاهزية" : "Retry Readiness Gate"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
