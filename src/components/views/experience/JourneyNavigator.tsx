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
import { motion } from "framer-motion";
import {
  Compass,
  Lightbulb,
  Search,
  Dumbbell,
  Rocket,
  Flame,
  Trophy,
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
  { icon: React.ElementType<{ className?: string }>; color: string; activeColor: string; labelEn: string; labelAr: string }
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
      className="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700/60"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 space-y-3 border-b border-slate-200/60 dark:border-slate-700/40 shrink-0">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {ar ? "رحلة التعلّم" : "Your Journey"}
        </h2>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>
              {completedCount}/{totalConcepts}{" "}
              {ar ? "مفاهيم" : "concepts"}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* ── Stage List ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1" aria-label={ar ? "مراحل التعلم" : "Learning stages"}>
        {stages.map((stage) => {
          const meta = STAGE_META[stage.stageKey];
          const Icon = meta.icon;
          const isActive = stage.stageKey === currentStage;
          const stageCompleted = stage.conceptSummaries.every((c) =>
            completedConceptIds.has(c.id),
          );

          return (
            <div key={stage.stageKey} className="space-y-0.5">
              {/* Stage header */}
              <button
                type="button"
                onClick={() => onStageClick(stage.stageKey)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-bold",
                  isActive
                    ? `${meta.activeColor} shadow-md`
                    : stageCompleted
                      ? "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : meta.color)} />
                <span className="flex-1 truncate">
                  {ar ? meta.labelAr : meta.labelEn}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400",
                  )}
                >
                  {stage.conceptCount}
                </span>
                {stageCompleted && (
                  <span className="text-emerald-500 text-xs" aria-label={ar ? "مكتمل" : "Completed"}>
                    ✓
                  </span>
                )}
              </button>

              {/* Expanded concept list for active stage */}
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className={cn("py-1 space-y-0.5", ar ? "pr-7" : "pl-7")}>
                    {stage.conceptSummaries.map((concept) => {
                      const isCurrent = concept.id === currentConceptId;
                      const isDone = completedConceptIds.has(concept.id);
                      return (
                        <button
                          key={concept.id}
                          type="button"
                          onClick={() => onConceptClick(concept.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all",
                            isCurrent
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold"
                              : isDone
                                ? "text-slate-400 dark:text-slate-500"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40",
                          )}
                          aria-current={isCurrent ? "true" : undefined}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              isCurrent
                                ? "bg-emerald-500"
                                : isDone
                                  ? "bg-slate-300 dark:bg-slate-600"
                                  : "bg-slate-300 dark:bg-slate-700",
                            )}
                          />
                          <span className="flex-1 truncate">{concept.title}</span>
                          {isDone && (
                            <span className="text-emerald-500 text-[10px]">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
