"use client";

/**
 * JourneyNavigator — left-panel 7-stage compact navigator.
 *
 * Shows the pedagogical journey: Discover → Understand → Explore → Practice →
 * Apply → Challenge → Master. Each stage displays its name, concept count, and
 * completion state. The current stage is highlighted with an animated indicator.
 *
 * NOT a list of 20 slides — this is concept-stage navigation.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Lightbulb,
  Search,
  Dumbbell,
  Rocket,
  Flame,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  StudentStageNavViewModel,
  PedagogicalPhase,
} from "@/lib/lecture/projections/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JourneyNavigatorProps {
  stages: StudentStageNavViewModel[];
  currentStage: PedagogicalPhase;
  currentConceptId: string;
  completedConceptIds: Set<string>;
  totalConcepts: number;
  ar: boolean;
  onStageClick: (stageKey: PedagogicalPhase) => void;
  onConceptClick: (conceptId: string) => void;
}

// ---------------------------------------------------------------------------
// Stage metadata
// ---------------------------------------------------------------------------

const STAGE_META: Record<
  PedagogicalPhase,
  { icon: React.ComponentType<{ className?: string }>; color: string; activeColor: string; labelEn: string; labelAr: string }
> = {
  DISCOVER: {
    icon: Compass,
    color: "text-emerald-600 dark:text-emerald-400",
    activeColor: "bg-emerald-600 text-white",
    labelEn: "Discover",
    labelAr: "اكتشف",
  },
  UNDERSTAND: {
    icon: Lightbulb,
    color: "text-teal-600 dark:text-teal-400",
    activeColor: "bg-teal-600 text-white",
    labelEn: "Understand",
    labelAr: "افهم",
  },
  EXPLORE: {
    icon: Search,
    color: "text-blue-600 dark:text-blue-400",
    activeColor: "bg-blue-600 text-white",
    labelEn: "Explore",
    labelAr: "استكشف",
  },
  PRACTICE: {
    icon: Dumbbell,
    color: "text-indigo-600 dark:text-indigo-400",
    activeColor: "bg-indigo-600 text-white",
    labelEn: "Practice",
    labelAr: "تدرّب",
  },
  APPLY: {
    icon: Rocket,
    color: "text-purple-600 dark:text-purple-400",
    activeColor: "bg-purple-600 text-white",
    labelEn: "Apply",
    labelAr: "طبّق",
  },
  CHALLENGE: {
    icon: Flame,
    color: "text-rose-600 dark:text-rose-400",
    activeColor: "bg-rose-600 text-white",
    labelEn: "Challenge",
    labelAr: "تحدَّ",
  },
  MASTER: {
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    activeColor: "bg-amber-600 text-white",
    labelEn: "Master",
    labelAr: "أتقن",
  },
};

// ---------------------------------------------------------------------------
// JourneyNavigator
// ---------------------------------------------------------------------------

export function JourneyNavigator({
  stages,
  currentStage,
  currentConceptId,
  completedConceptIds,
  totalConcepts,
  ar,
  onStageClick,
  onConceptClick,
}: JourneyNavigatorProps) {
  const completedCount = completedConceptIds.size;
  const progressPercent =
    totalConcepts > 0 ? Math.round((completedCount / totalConcepts) * 100) : 0;

  return (
    <div
      className="flex flex-col h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 space-y-4 border-b border-white/20 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-3xl">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
          {ar ? "رحلة التعلّم" : "Your Journey"}
        </h2>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            <span>
              {completedCount}/{totalConcepts}{" "}
              {ar ? "مفاهيم" : "concepts"}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* ── Stage List ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2" aria-label={ar ? "مراحل التعلم" : "Learning stages"}>
        {stages.map((stage) => {
          const meta = STAGE_META[stage.stageKey];
          const Icon = meta.icon as React.ComponentType<{ className?: string }>;
          const isActive = stage.stageKey === currentStage;
          const stageCompleted = stage.conceptSummaries.length > 0 && stage.conceptSummaries.every((c) =>
            completedConceptIds.has(c.id),
          );

          return (
            <div key={stage.stageKey} className="space-y-1">
              {/* Stage header */}
              <button
                type="button"
                onClick={() => onStageClick(stage.stageKey)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all text-sm font-black active:scale-[0.98]",
                  isActive
                    ? `${meta.activeColor} shadow-md ring-2 ring-white/20 dark:ring-white/10`
                    : stageCompleted
                      ? "bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400"
                      : "hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <div className={cn(
                  "p-1.5 rounded-xl flex items-center justify-center",
                  isActive ? "bg-white/20" : "bg-slate-200/50 dark:bg-slate-700/50"
                )}>
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : meta.color)} />
                </div>
                <span className="flex-1 truncate tracking-wide">
                  {ar ? meta.labelAr : meta.labelEn}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-black px-2 py-0.5 rounded-lg",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400",
                  )}
                >
                  {stage.conceptCount}
                </span>
                {stageCompleted && (
                  <span className="text-emerald-500 text-xs font-black" aria-label={ar ? "مكتمل" : "Completed"}>
                    ✓
                  </span>
                )}
              </button>

              {/* Expanded concept list for active stage */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className={cn("py-2 space-y-1 relative", ar ? "pr-5" : "pl-5")}>
                      {/* Vertical connector line */}
                      <div className={cn("absolute top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full", ar ? "right-[26px]" : "left-[26px]")} />
                      
                      {stage.conceptSummaries.map((concept, idx) => {
                        const isCurrent = concept.id === currentConceptId;
                        const isDone = completedConceptIds.has(concept.id);
                        return (
                          <button
                            key={concept.id}
                            type="button"
                            onClick={() => onConceptClick(concept.id)}
                            className={cn(
                              "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all active:scale-[0.98]",
                              isCurrent
                                ? "bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-100 font-black shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 z-10"
                                : isDone
                                  ? "text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/40 z-10"
                                  : "text-slate-600 dark:text-slate-300 font-semibold hover:bg-white dark:hover:bg-slate-800/60 z-10",
                            )}
                            aria-current={isCurrent ? "true" : undefined}
                          >
                            <span
                              className={cn(
                                "w-2.5 h-2.5 rounded-full shrink-0 border-2 z-20 transition-all",
                                isCurrent
                                  ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                  : isDone
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                              )}
                            />
                            <div className="flex-1 flex items-center gap-2 truncate">
                              <span className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
                                S{concept.orderIndex}
                              </span>
                              <span className="truncate">{concept.title}</span>
                            </div>
                            {isDone && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
