"use client";

/**
 * MasterySummary — post-lesson mastery breakdown screen.
 * Upgraded with premium rich aesthetics, glassmorphism, and dynamic animations.
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  Compass,
  Lightbulb,
  Search,
  Dumbbell,
  Rocket,
  Flame,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  StudentStageNavViewModel,
  PedagogicalPhase,
} from "@/lib/lecture/projections/types";

export interface MasterySummaryProps {
  stages: StudentStageNavViewModel[];
  completedConceptIds: Set<string>;
  totalConcepts: number;
  estimatedDurationMinutes: number;
  courseTitle: string;
  ar: boolean;
  onRevisit: () => void;
  onFinish: () => void;
}

const STAGE_ICONS: Record<PedagogicalPhase, React.ElementType> = {
  DISCOVER: Compass,
  UNDERSTAND: Lightbulb,
  EXPLORE: Search,
  PRACTICE: Dumbbell,
  APPLY: Rocket,
  CHALLENGE: Flame,
  MASTER: Trophy,
};

const STAGE_COLORS: Record<PedagogicalPhase, { bar: string; text: string; bg: string; glow: string }> = {
  DISCOVER: { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.5)]" },
  UNDERSTAND: { bar: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50/50 dark:bg-teal-950/20", glow: "shadow-[0_0_12px_rgba(20,184,166,0.5)]" },
  EXPLORE: { bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-950/20", glow: "shadow-[0_0_12px_rgba(59,130,246,0.5)]" },
  PRACTICE: { bar: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", glow: "shadow-[0_0_12px_rgba(99,102,241,0.5)]" },
  APPLY: { bar: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50/50 dark:bg-purple-950/20", glow: "shadow-[0_0_12px_rgba(168,85,247,0.5)]" },
  CHALLENGE: { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/50 dark:bg-rose-950/20", glow: "shadow-[0_0_12px_rgba(244,63,94,0.5)]" },
  MASTER: { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20", glow: "shadow-[0_0_12px_rgba(245,158,11,0.5)]" },
};

const STAGE_LABELS: Record<PedagogicalPhase, { en: string; ar: string }> = {
  DISCOVER: { en: "Discover", ar: "اكتشف" },
  UNDERSTAND: { en: "Understand", ar: "افهم" },
  EXPLORE: { en: "Explore", ar: "استكشف" },
  PRACTICE: { en: "Practice", ar: "تدرّب" },
  APPLY: { en: "Apply", ar: "طبّق" },
  CHALLENGE: { en: "Challenge", ar: "تحدَّ" },
  MASTER: { en: "Master", ar: "أتقن" },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function MasterySummary({
  stages,
  completedConceptIds,
  totalConcepts,
  estimatedDurationMinutes,
  courseTitle,
  ar,
  onRevisit,
  onFinish,
}: MasterySummaryProps) {
  const completedCount = completedConceptIds.size;
  const masteryPercent = totalConcepts > 0 ? Math.round((completedCount / totalConcepts) * 100) : 0;
  const dir = ar ? "rtl" : "ltr";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 overflow-hidden font-sans"
      dir={dir}
    >
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 dark:bg-teal-900/30 blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVariants as any}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-2xl space-y-8"
      >
        {/* ── Congratulatory Header ───────────────────────────────────── */}
        <motion.div variants={itemVariants as any} className="text-center space-y-4">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/40 dark:border-emerald-500/30"
            />
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]"
            >
              <Trophy className="h-10 w-10 text-white drop-shadow-md" />
              <motion.div 
                className="absolute top-1 right-1"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-emerald-100" />
              </motion.div>
            </motion.div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 pb-1">
            {ar ? "أحسنت! أكملت التعلّم" : "Learning Complete!"}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            {courseTitle}
          </p>
        </motion.div>

        {/* ── Overall Stats (Glassmorphism) ───────────────────────────── */}
        <motion.div variants={itemVariants as any} className="grid grid-cols-3 gap-4">
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 text-center space-y-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl" />
            <span className="relative z-10 text-3xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm">
              {masteryPercent}%
            </span>
            <p className="relative z-10 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {ar ? "الإتقان" : "Mastery"}
            </p>
          </motion.div>
          
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 text-center space-y-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
            <div className="absolute top-0 left-0 w-16 h-16 bg-blue-400/10 rounded-full blur-xl" />
            <span className="relative z-10 text-3xl font-black text-slate-800 dark:text-slate-100 drop-shadow-sm">
              {completedCount}/{totalConcepts}
            </span>
            <p className="relative z-10 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {ar ? "المفاهيم" : "Concepts"}
            </p>
          </motion.div>
          
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 text-center space-y-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col items-center justify-center">
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full blur-xl" />
            <div className="relative z-10 flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100 drop-shadow-sm">
                {estimatedDurationMinutes}
              </span>
            </div>
            <p className="relative z-10 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {ar ? "دقائق" : "Minutes"}
            </p>
          </motion.div>
        </motion.div>

        {/* ── Per-Stage Breakdown ───────────────────────────────────────── */}
        <motion.div
          variants={itemVariants as any}
          className="rounded-[2rem] border border-white/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-7 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl"
        >
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-center mb-6">
            {ar ? "تفاصيل المراحل" : "Stage Breakdown"}
          </h2>

          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.stageKey];
              const colors = STAGE_COLORS[stage.stageKey];
              const labels = STAGE_LABELS[stage.stageKey];
              const completed = stage.conceptSummaries.filter((c) =>
                completedConceptIds.has(c.id),
              ).length;
              const total = stage.conceptCount;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isDone = pct === 100;

              return (
                <motion.div 
                  key={stage.stageKey} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                  className={cn(
                    "group relative rounded-2xl p-4 flex items-center gap-4 transition-all duration-300",
                    isDone ? "bg-white dark:bg-slate-800/80 shadow-sm border border-slate-100 dark:border-slate-700/50" : colors.bg
                  )}
                >
                  <div className={cn("p-2 rounded-xl transition-colors", isDone ? colors.bg : "bg-white/50 dark:bg-slate-900/50")}>
                    <Icon className={cn("h-5 w-5 shrink-0", colors.text)} />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-extrabold", isDone ? "text-slate-800 dark:text-slate-200" : colors.text)}>
                        {ar ? labels.ar : labels.en}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 overflow-hidden shadow-inner">
                      <motion.div
                        className={cn("h-full rounded-full relative", colors.bar, isDone && colors.glow)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 + idx * 0.1 }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="w-6 flex justify-end shrink-0">
                    {isDone ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 1 + idx * 0.1 }}>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-sm" />
                      </motion.div>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants as any} className="pt-4 pb-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onRevisit}
              className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-sm font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/20"
            >
              <RotateCcw className="h-4 w-4" />
              {ar ? "راجع المفاهيم" : "Review Concepts"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(16,185,129,0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onFinish}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 overflow-hidden relative group"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10">{ar ? "إنهاء المحاضرة" : "Finish Lesson"}</span>
              <ArrowRight className={cn("relative z-10 h-4 w-4", ar && "rotate-180")} />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

