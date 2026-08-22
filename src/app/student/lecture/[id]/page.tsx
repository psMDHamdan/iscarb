"use client";

/**
 * Student Learning Experience Page — `/student/learn/[id]`
 *
 * Fetches a `StudentExperienceViewModel` from the API and renders a full
 * pedagogical learning experience with three distinct phases:
 *
 *   1. **Landing** — hook narrative, outcomes, estimated time, START button
 *   2. **Learning Player** — 3-panel layout (navigator + concept + activity)
 *   3. **Mastery Summary** — post-lesson completion breakdown
 *
 * Navigation is concept-based (not slide-based). The left panel shows 7
 * pedagogical stages (Discover → Master), the center renders rich concept
 * content, and the right panel shows context-sensitive activities/assessments.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";

// Experience sub-components
import { ExperienceLandingPage } from "@/components/views/experience/ExperienceLandingPage";
import { JourneyNavigator } from "@/components/views/experience/JourneyNavigator";
import { ConceptContent } from "@/components/views/experience/ConceptContent";
import { ActivityPanel } from "@/components/views/experience/ActivityPanel";
import { MasterySummary } from "@/components/views/experience/MasterySummary";

// Types
import type {
  StudentExperienceViewModel,
  StudentConceptViewModel,
  PedagogicalPhase,
  StudentFinalChallengeViewModel,
} from "@/lib/lecture/projections/types";

// ---------------------------------------------------------------------------
// Player phase enum (landing → playing → summary)
// ---------------------------------------------------------------------------

type PlayerPhase = "LANDING" | "PLAYING" | "SUMMARY";

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function StudentLearnPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useApp();
  const ar = lang === "ar";
  const experienceId = params.id;

  // ── API Fetch ─────────────────────────────────────────────────────────────
  const { data: experience, isLoading, error } = useApiQuery<StudentExperienceViewModel>(
    ["experience", experienceId],
    `/api/iscarb/lecture/experience/${experienceId}`,
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<PlayerPhase>("LANDING");
  const [currentConceptId, setCurrentConceptId] = useState<string>("");
  const [completedConceptIds, setCompletedConceptIds] = useState<Set<string>>(new Set());

  // ── Derived data ──────────────────────────────────────────────────────────

  /** Flat ordered list of concept IDs across all stages */
  const conceptOrder = useMemo(() => {
    if (!experience) return [];
    const ids: string[] = [];
    for (const stage of experience.navigation.stages) {
      for (const summary of stage.conceptSummaries) {
        ids.push(summary.id);
      }
    }
    return ids;
  }, [experience]);

  /** Current concept view model */
  const currentConcept: StudentConceptViewModel | null = useMemo(() => {
    if (!experience || !currentConceptId) return null;
    return experience.concepts[currentConceptId] ?? null;
  }, [experience, currentConceptId]);

  /** Current stage key */
  const currentStage: PedagogicalPhase = currentConcept?.stage ?? "DISCOVER";

  /** Current concept position */
  const currentIndex = useMemo(() => {
    return conceptOrder.indexOf(currentConceptId);
  }, [conceptOrder, currentConceptId]);

  const isFirstConcept = currentIndex <= 0;
  const isLastConcept = currentIndex >= conceptOrder.length - 1;

  /** Progress percentage */
  const progressPercent = useMemo(() => {
    if (conceptOrder.length === 0) return 0;
    return Math.round(((currentIndex + 1) / conceptOrder.length) * 100);
  }, [currentIndex, conceptOrder.length]);

  /** Whether we're on the final challenge concept */
  const isFinalChallenge = useMemo(() => {
    if (!currentConcept) return false;
    return currentConcept.stage === "CHALLENGE" && isLastConcept;
  }, [currentConcept, isLastConcept]);

  // ── Initialize on data load ───────────────────────────────────────────────

  useEffect(() => {
    if (experience && !currentConceptId) {
      setCurrentConceptId(experience.navigation.initialActiveConceptId);
    }
  }, [experience, currentConceptId]);

  // ── Navigation callbacks ──────────────────────────────────────────────────

  const navigateTo = useCallback(
    (conceptId: string) => {
      // Mark current concept as completed
      if (currentConceptId) {
        setCompletedConceptIds((prev) => {
          const next = new Set(prev);
          next.add(currentConceptId);
          return next;
        });
      }
      setCurrentConceptId(conceptId);
    },
    [currentConceptId],
  );

  const goNext = useCallback(() => {
    if (!experience || !currentConceptId) return;

    if (isLastConcept) {
      setCompletedConceptIds((prev) => {
        const next = new Set(prev);
        next.add(currentConceptId);
        return next;
      });
      setPhase("SUMMARY");
      return;
    }
    navigateTo(conceptOrder[currentIndex + 1]);
  }, [experience, currentConceptId, isLastConcept, currentIndex, conceptOrder, navigateTo]);

  const goPrev = useCallback(() => {
    if (isFirstConcept) return;
    navigateTo(conceptOrder[currentIndex - 1]);
  }, [isFirstConcept, currentIndex, conceptOrder, navigateTo]);

  const handleStageClick = useCallback(
    (stageKey: PedagogicalPhase) => {
      if (!experience) return;
      const stage = experience.navigation.stages.find((s) => s.stageKey === stageKey);
      if (stage && stage.conceptSummaries.length > 0) {
        navigateTo(stage.conceptSummaries[0].id);
      }
    },
    [experience, navigateTo],
  );

  const handleStart = useCallback(() => {
    setPhase("PLAYING");
  }, []);

  const handleRevisit = useCallback(() => {
    if (experience) {
      setCurrentConceptId(experience.navigation.initialActiveConceptId);
    }
    setPhase("PLAYING");
  }, [experience]);

  const handleFinish = useCallback(() => {
    router.push("/student/lecture");
  }, [router]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "PLAYING") return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target.getAttribute("role") === "textbox"
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, goNext, goPrev]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 via-slate-50/80 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="space-y-4 text-center max-w-md">
          <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
            <BookOpen className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            {ar ? "جاري تحضير تجربة التعلّم..." : "Preparing your learning experience..."}
          </p>
          <div className="h-1.5 w-48 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error || !experience) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 via-slate-50/80 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-white/90 dark:bg-slate-900/90 p-8 text-center space-y-4 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="text-lg font-bold text-red-700 dark:text-red-300">
            {ar ? "تعذر تحميل التجربة التعليمية" : "Failed to load learning experience"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {(error as Error)?.message ?? (ar ? "يرجى المحاولة مرة أخرى" : "Please try again later")}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {ar ? "العودة" : "Go Back"}
          </button>
        </div>
      </div>
    );
  }

  // ── LANDING phase ─────────────────────────────────────────────────────────

  if (phase === "LANDING") {
    return (
      <ExperienceLandingPage
        experience={experience}
        ar={ar}
        onStart={handleStart}
      />
    );
  }

  // ── SUMMARY phase ─────────────────────────────────────────────────────────

  if (phase === "SUMMARY") {
    return (
      <MasterySummary
        stages={experience.navigation.stages}
        completedConceptIds={completedConceptIds}
        totalConcepts={experience.navigation.totalConcepts}
        estimatedDurationMinutes={experience.estimatedDurationMinutes}
        courseTitle={experience.courseTitle}
        ar={ar}
        onRevisit={handleRevisit}
        onFinish={handleFinish}
      />
    );
  }

  // ── PLAYING phase — 3-panel layout ────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen bg-gradient-to-br from-emerald-50/50 via-slate-50/80 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shrink-0">
        {/* Back to the lecture list */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          aria-label={ar ? "رجوع" : "Back"}
        >
          <ChevronLeft className={cn("h-4 w-4", ar && "rotate-180")} />
          {ar ? "رجوع" : "Back"}
        </button>

        {/* Title */}
        <h1 className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
          {experience.courseTitle}
        </h1>

        {/* Edit in Studio — hidden from students, faculty-only */}

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2 min-w-[140px]">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tabular-nums">
            {currentIndex + 1}/{conceptOrder.length}
          </span>
        </div>
      </header>

      {/* ── Main 3-Panel Layout ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 lg:flex-row flex-col overflow-hidden">

        {/* Left Panel — Journey Navigator */}
        <div className="hidden lg:flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out w-64 xl:w-72 opacity-100">
          <JourneyNavigator
            stages={experience.navigation.stages}
            currentStage={currentStage}
            currentConceptId={currentConceptId}
            completedConceptIds={completedConceptIds}
            totalConcepts={experience.navigation.totalConcepts}
            ar={ar}
            onStageClick={handleStageClick}
            onConceptClick={navigateTo}
          />
        </div>

        {/* Center Panel — Concept Content */}
        <main className="flex flex-col flex-1 min-w-0 overflow-hidden border-x-0 lg:border-x border-slate-200/60 dark:border-slate-700/40">
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentConcept ? (
              isFinalChallenge && experience.finalChallenge ? (
                <FinalChallengeView
                  challenge={experience.finalChallenge}
                  ar={ar}
                />
              ) : (
                <ConceptContent concept={currentConcept} ar={ar} />
              )
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-sm text-slate-500 dark:text-slate-400">
                {ar ? "حدد مفهومًا للبدء" : "Select a concept to begin"}
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="flex items-center gap-3 px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shrink-0">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirstConcept}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                isFirstConcept
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700",
              )}
              aria-label={ar ? "السابق" : "Previous"}
            >
              <ChevronLeft className={cn("h-4 w-4", ar && "rotate-180")} />
              {ar ? "السابق" : "Back"}
            </button>

            {/* Mobile progress */}
            <div className="flex-1 sm:hidden">
              <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="flex-1 hidden sm:block" />

            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={isLastConcept ? (ar ? "إنهاء" : "Finish") : (ar ? "التالي" : "Next")}
            >
              {isLastConcept
                ? (ar ? "عرض النتائج" : "See Results")
                : (ar ? "التالي" : "Next")}
              <ChevronRight className={cn("h-4 w-4", ar && "rotate-180")} />
            </button>
          </nav>
        </main>

        {/* Right Panel — Activity / Assessment / Coach */}
        <aside
          className={cn(
            "flex flex-col min-w-0 overflow-hidden border-t lg:border-t-0",
            "lg:w-[32%] xl:w-[27%] max-w-md",
            "min-h-[300px] lg:min-h-0",
          )}
        >
          {currentConcept ? (
            <ActivityPanel
              concept={currentConcept}
              ar={ar}
              experienceId={experienceId}

              onActivitySubmit={(id) => {
                setCompletedConceptIds(prev => new Set(prev).add(currentConcept.id));
              }}
              onAssessmentAnswer={(id) => {
                setCompletedConceptIds(prev => new Set(prev).add(currentConcept.id));
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full p-6 text-sm text-slate-400 dark:text-slate-500">
              {ar ? "محتوى تفاعلي" : "Interactive content"}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FinalChallengeView — transfer problem for CHALLENGE stage
// ---------------------------------------------------------------------------

function FinalChallengeView({
  challenge,
  ar,
}: {
  challenge: StudentFinalChallengeViewModel;
  ar: boolean;
}) {
  const [response, setResponse] = useState("");

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 lg:p-6 max-w-3xl mx-auto w-full space-y-5" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-rose-600 text-white">
          🔥 {ar ? "التحدي النهائي" : "Final Challenge"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
          {challenge.title}
        </h1>
      </div>

      {/* Scenario */}
      <div className="rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-slate-900/60 p-5 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-rose-700 dark:text-rose-400">
          {ar ? "السيناريو" : "Scenario"}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {challenge.scenario}
        </p>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 p-5 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {ar ? "مهمتك" : "Your Task"}
        </p>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          {challenge.prompt}
        </p>
      </div>

      {/* Rubric Criteria */}
      <div className="rounded-2xl border border-amber-300/30 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-300">
          {ar ? "معايير التقييم" : "Evaluation Criteria"}
        </p>
        <ul className="space-y-2">
          {challenge.rubricCriteria.map((criterion, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="leading-relaxed">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Response area */}
      <div className="space-y-2">
        <label
          htmlFor="challenge-response"
          className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
        >
          {ar ? "إجابتك" : "Your Response"}
        </label>
        <textarea
          id="challenge-response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder={ar ? "اكتب إجابتك هنا..." : "Write your response here..."}
          dir={ar ? "rtl" : "ltr"}
        />
      </div>
    </div>
  );
}
