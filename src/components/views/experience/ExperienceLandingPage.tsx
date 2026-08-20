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
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-12"
      dir={dir}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl space-y-6"
      >
        {/* ── Title ──────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-3 w-3" />
            {ar ? "تجربة تعلم تفاعلية" : "Interactive Learning Experience"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            {courseTitle}
          </h1>
        </motion.div>

        {/* ── Hook Narrative ("Why This Matters") ────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-emerald-500/20 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60">
              <Target className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
              {ar ? "لماذا هذا مهم" : "Why This Matters"}
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {overview.hookNarrative}
          </p>
        </motion.div>

        {/* ── Learning Outcomes ──────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-teal-500/15 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-lg space-y-4"
        >
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-300">
            {ar ? "ما ستتعلمه" : "What You'll Learn"}
          </h2>
          <ul className="space-y-3">
            {overview.learningOutcomes.slice(0, 5).map((outcome, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold border border-teal-400/20">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {outcome}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label={ar ? "الوقت المقدر" : "Estimated Time"}
            value={`${estimatedDurationMinutes} ${ar ? "دقيقة" : "min"}`}
          />
          <StatCard
            icon={<Layers className="h-4 w-4" />}
            label={ar ? "المفاهيم" : "Concepts"}
            value={String(navigation.totalConcepts)}
          />
          <StatCard
            icon={<BookOpen className="h-4 w-4" />}
            label={ar ? "المراحل" : "Stages"}
            value={String(navigation.stages.length)}
            className="col-span-2 sm:col-span-1"
          />
        </motion.div>

        {/* ── Prerequisites (if any) ────────────────────────────────────── */}
        {overview.prerequisites.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-amber-300/30 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-3.5 space-y-2"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
              {ar ? "المتطلبات المسبقة" : "Prerequisites"}
            </p>
            <ul className="space-y-1">
              {overview.prerequisites.map((p, i) => (
                <li
                  key={i}
                  className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── Start Learning CTA ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="pt-4">
          <button
            type="button"
            onClick={onStart}
            className="group w-full py-4 px-8 rounded-2xl text-base font-extrabold bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-xl hover:shadow-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 flex items-center justify-center gap-3 cursor-pointer"
          >
            {ar ? "ابدأ التعلم الآن" : "START LEARNING NOW"}
            <ChevronRight className={cn(
              "h-5 w-5 transition-transform group-hover:translate-x-1",
              ar && "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0"
            )} />
          </button>
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
