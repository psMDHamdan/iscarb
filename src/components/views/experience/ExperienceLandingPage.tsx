"use client";

/**
 * ExperienceLandingPage — the pre-lesson landing screen shown before the
 * student enters the 3-panel learning player.
 *
 * Displays:
 *  - Course title & hook narrative ("Why This Matters")
 *  - 3-5 learning outcomes with numbered badges
 *  - Estimated time, concept count, prerequisites
 *  - Prominent "START LEARNING" call-to-action
 *
 * Premium feel: gradient background, glassmorphic cards, staggered entrance.
 */

import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Layers,
  Target,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { StudentExperienceViewModel } from "@/lib/lecture/projections/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ExperienceLandingPageProps {
  experience: StudentExperienceViewModel;
  ar: boolean;
  onStart: () => void;
}

// ---------------------------------------------------------------------------
// Stagger animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
} as const;

// ---------------------------------------------------------------------------
// ExperienceLandingPage
// ---------------------------------------------------------------------------

export function ExperienceLandingPage({
  experience,
  ar,
  onStart,
}: ExperienceLandingPageProps) {
  const { courseTitle, estimatedDurationMinutes, overview, navigation } = experience;
  const dir = ar ? "rtl" : "ltr";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 overflow-hidden"
      dir={dir}
    >
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-300/20 dark:bg-emerald-900/20 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-300/20 dark:bg-teal-900/20 blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-emerald-400/10 dark:bg-emerald-800/10 blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-2xl space-y-6 z-10"
      >
        {/* ── Title ──────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-emerald-800 dark:text-emerald-300 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
            <Sparkles className="h-3.5 w-3.5" />
            {ar ? "تجربة تعلم تفاعلية" : "Interactive Learning Experience"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
            {courseTitle}
          </h1>
        </motion.div>

        {/* ── Hook Narrative ("Why This Matters") ────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-emerald-900/5 space-y-4 relative overflow-hidden group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-10 transition duration-500 rounded-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 shadow-inner">
                <Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                {ar ? "لماذا هذا مهم" : "Why This Matters"}
              </h2>
            </div>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
              {overview.hookNarrative}
            </p>
          </div>
        </motion.div>

        {/* ── Learning Outcomes ──────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-teal-900/5 space-y-5"
        >
          <h2 className="text-sm font-black uppercase tracking-widest text-teal-800 dark:text-teal-300">
            {ar ? "ما ستتعلمه" : "What You'll Learn"}
          </h2>
          <ul className="space-y-4">
            {overview.learningOutcomes.slice(0, 5).map((outcome, i) => (
              <li key={i} className="flex items-start gap-4 group">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-black shadow-inner border border-white/50 dark:border-white/10 group-hover:scale-110 transition-transform">
                  {i + 1}
                </span>
                <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                  {outcome}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label={ar ? "الوقت المقدر" : "Estimated Time"}
            value={`${estimatedDurationMinutes} ${ar ? "دقيقة" : "min"}`}
          />
          <StatCard
            icon={<Layers className="h-5 w-5" />}
            label={ar ? "المفاهيم" : "Concepts"}
            value={String(navigation.totalConcepts)}
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label={ar ? "المراحل" : "Stages"}
            value={String(navigation.stages.length)}
            className="col-span-2 sm:col-span-1"
          />
        </motion.div>

        {/* ── Prerequisites (if any) ────────────────────────────────────── */}
        {overview.prerequisites.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-slate-900/60 px-6 py-4 space-y-3 backdrop-blur-md"
          >
            <p className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-400">
              {ar ? "المتطلبات المسبقة" : "Prerequisites"}
            </p>
            <ul className="space-y-2">
              {overview.prerequisites.map((p, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200 leading-relaxed flex items-center gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── Start Learning CTA ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="pt-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500" />
            <button
              type="button"
              onClick={onStart}
              className="relative w-full py-4 sm:py-5 px-8 rounded-2xl text-base sm:text-lg font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl hover:shadow-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
            >
              {ar ? "ابدأ التعلم الآن" : "START LEARNING NOW"}
              <ChevronRight className={cn(
                "h-6 w-6 transition-transform group-hover:translate-x-1.5",
                ar && "rotate-180 group-hover:-translate-x-1.5 group-hover:translate-x-0"
              )} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard helper
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-4 flex flex-col items-center gap-1 shadow-sm",
        className,
      )}
    >
      <div className="text-emerald-600 dark:text-emerald-400">{icon}</div>
      <span className="text-lg font-black text-slate-900 dark:text-slate-50">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}
