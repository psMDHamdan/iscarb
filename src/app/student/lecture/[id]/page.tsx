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

import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  CheckCircle,
  Star,
  Menu,
  X,
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
  const [completedInteractions, setCompletedInteractions] = useState<Set<string>>(new Set());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    
    // Check if current concept requires interaction before proceeding
    const currentConceptView = experience.concepts[currentConceptId];
    if (currentConceptView) {
      const hasInteraction = !!currentConceptView.activity || !!currentConceptView.assessment;
      // Allow proceeding if already completed or marked
      if (hasInteraction && !completedInteractions.has(currentConceptId) && !completedConceptIds.has(currentConceptId)) {
        alert(ar ? "يرجى إكمال النشاط قبل المتابعة." : "Please complete the task to proceed.");
        return;
      }
    }
    if (isLastConcept) {
      // Mark the last concept as completed and show summary
      setCompletedConceptIds((prev) => {
        const next = new Set(prev);
        next.add(currentConceptId);
        return next;
      });
      setPhase("SUMMARY");
      return;
    }
    navigateTo(conceptOrder[currentIndex + 1]);
  }, [experience, currentConceptId, completedInteractions, completedConceptIds, ar, isLastConcept, currentIndex, conceptOrder, navigateTo]);

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
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-slate-50 to-slate-50 dark:from-emerald-900/20 dark:via-slate-950 dark:to-slate-950" />
        <div className="relative z-10 space-y-6 text-center max-w-sm w-full mx-4">
          <div className="glass-card p-8 flex flex-col items-center justify-center animate-pulse">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
              <BookOpen className="h-10 w-10 animate-bounce" />
            </div>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
              {ar ? "جاري تحضير تجربة التعلّم..." : "Preparing your learning experience..."}
            </p>
            <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-2/3 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error || !experience) {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-100/40 via-slate-50 to-slate-50 dark:from-rose-900/20 dark:via-slate-950 dark:to-slate-950" />
        <div className="relative z-10 glass-card p-10 text-center max-w-md w-full space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400/20 to-red-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
            <span className="text-3xl font-black">!</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {ar ? "تعذر تحميل التجربة التعليمية" : "Failed to load learning experience"}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {(error as Error)?.message ?? (ar ? "يرجى المحاولة مرة أخرى" : "Please try again later")}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:shadow-brand transition-all active:scale-[0.98]"
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
      className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased relative overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/30 via-slate-50 to-slate-50 dark:from-emerald-900/10 dark:via-slate-950 dark:to-slate-950 pointer-events-none" />
      
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-4 px-6 py-4 glass-panel border-b border-white/20 dark:border-white/5 shrink-0 shadow-sm">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden flex items-center justify-center p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all"
          aria-label={ar ? "التنقل" : "Navigate"}
        >
          <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Back to the lecture list */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-brand border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          aria-label={ar ? "رجوع" : "Back"}
        >
          <ChevronLeft className={cn("h-4 w-4", ar && "rotate-180")} />
          {ar ? "العودة للدروس" : "Back to Lectures"}
        </button>

        {/* Title */}
        <h1 className="flex-1 text-base font-black tracking-tight text-slate-800 dark:text-slate-200 truncate px-2">
          {experience.courseTitle}
        </h1>

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-3 min-w-[180px] bg-white/40 dark:bg-slate-900/40 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            {currentIndex + 1} / {conceptOrder.length}
          </span>
        </div>
      </header>

      {/* ── Main 3-Panel Layout ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 min-h-0 lg:flex-row flex-col overflow-hidden p-0 sm:p-4 gap-4">

        {/* Left Panel — Journey Navigator */}
        <div className="hidden lg:flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out w-64 xl:w-72 opacity-100">
          <div className="glass-card h-full rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-brand">
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
        </div>

        {/* Center Panel — Concept Content */}
        <main className="flex flex-col flex-1 min-w-0 overflow-hidden glass-card sm:rounded-3xl border-y sm:border border-white/20 dark:border-white/5 shadow-brand bg-white/80 dark:bg-slate-900/80">
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
              <div className="flex items-center justify-center h-full p-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                {ar ? "حدد مفهومًا للبدء" : "Select a concept to begin"}
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="flex items-center gap-4 px-6 py-4 border-t border-slate-200/40 dark:border-slate-700/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirstConcept}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                isFirstConcept
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:shadow-brand border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 active:scale-[0.98]",
              )}
              aria-label={ar ? "السابق" : "Previous"}
            >
              <ChevronLeft className={cn("h-4 w-4", ar && "rotate-180")} />
              {ar ? "السابق" : "Back"}
            </button>

            {/* Mobile progress */}
            <div className="flex-1 sm:hidden px-4">
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="flex-1 hidden sm:block" />

            <button
              type="button"
              onClick={goNext}
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black tracking-wide text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-brand hover:shadow-emerald-500/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.98]"
              aria-label={isLastConcept ? (ar ? "إنهاء" : "Finish") : (ar ? "التالي" : "Next")}
            >
              {isLastConcept
                ? (ar ? "عرض النتائج" : "See Results")
                : (ar ? "التالي" : "Next")}
              <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", ar && "rotate-180 group-hover:-translate-x-1")} />
            </button>
          </nav>
        </main>

        {/* Right Panel — Activity / Assessment / Coach */}
        <aside
          className={cn(
            "flex flex-col min-w-0 overflow-hidden border-t sm:border-t-0 sm:rounded-3xl glass-card border border-white/20 dark:border-white/5 shadow-brand",
            "lg:w-[32%] xl:w-[28%] max-w-md",
            "min-h-[300px] lg:min-h-0",
          )}
        >
          {currentConcept ? (
            <ActivityPanel 
              concept={currentConcept} 
              ar={ar}
              experienceId={experienceId}
              onActivitySubmit={(conceptId) => {
                setCompletedInteractions(prev => new Set(prev).add(conceptId));
              }}
              onAssessmentAnswer={(assessmentId, optionId) => {
                void assessmentId; void optionId;
                setCompletedInteractions(prev => new Set(prev).add(currentConcept.id));
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full p-6 text-sm font-medium text-slate-400 dark:text-slate-500">
              {ar ? "محتوى تفاعلي" : "Interactive content"}
            </div>
          )}
        </aside>
      </div>

      {/* ── Mobile Navigation Drawer ────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: ar ? 300 : -300 }}
            animate={{ x: 0 }}
            exit={{ x: ar ? 300 : -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "absolute top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden",
              ar ? "right-0" : "left-0"
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                {ar ? "التنقل" : "Navigate"}
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="h-[calc(100%-60px)] overflow-y-auto">
              <JourneyNavigator
                stages={experience.navigation.stages}
                currentStage={currentStage}
                currentConceptId={currentConceptId}
                completedConceptIds={completedConceptIds}
                totalConcepts={experience.navigation.totalConcepts}
                ar={ar}
                onStageClick={(stageKey) => {
                  handleStageClick(stageKey);
                  setMobileNavOpen(false);
                }}
                onConceptClick={(id) => {
                  navigateTo(id);
                  setMobileNavOpen(false);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
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
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string } | null>(null);

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/iscarb/student/lecture/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptTitle: challenge.title,
          taskPrompt: `${challenge.prompt}\n\nScenario: ${challenge.scenario}\n\nRubric: ${challenge.rubricCriteria.join("; ")}`,
          studentAnswer: response,
          lang: ar ? "ar" : "en",
          mode: "challenge",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation({ score: data.score || 3, feedback: data.feedback || (ar ? "تم تقييم إجابتك" : "Your response has been evaluated.") });
      } else {
        setEvaluation({ score: 3, feedback: ar ? "تم حفظ إجابتك." : "Your response has been saved." });
      }
    } catch {
      setEvaluation({ score: 3, feedback: ar ? "تم حفظ إجابتك." : "Your response has been saved." });
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-8" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm">
          <span className="text-sm">🔥</span>
          {ar ? "التحدي النهائي" : "Final Challenge"}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
          {challenge.title}
        </h1>
      </div>

      {/* Scenario */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-50/80 via-white to-white dark:from-rose-950/40 dark:via-slate-900/80 dark:to-slate-900/80 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 blur-3xl rounded-full" />
        <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
          {ar ? "السيناريو" : "Scenario"}
        </p>
        <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium relative z-10">
          {challenge.scenario}
        </p>
      </div>

      {/* Prompt */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 p-6 sm:p-8 space-y-4 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {ar ? "مهمتك" : "Your Task"}
        </p>
        <p className="text-lg sm:text-xl text-slate-900 dark:text-slate-100 leading-relaxed font-bold">
          {challenge.prompt}
        </p>
      </div>

      {/* Rubric Criteria */}
      <div className="rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-50/80 to-yellow-50/30 dark:from-amber-950/30 dark:to-slate-900/60 p-6 sm:p-8 space-y-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-400">
          {ar ? "معايير التقييم" : "Evaluation Criteria"}
        </p>
        <ul className="space-y-3">
          {challenge.rubricCriteria.map((criterion, i) => (
            <li key={i} className="flex items-start gap-4 text-sm sm:text-base text-amber-950 dark:text-amber-100/90 font-medium">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800/80 dark:to-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center text-xs font-black shadow-inner">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Response area */}
      <div className="space-y-3">
        <label
          htmlFor="challenge-response"
          className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400"
        >
          {ar ? "إجابتك" : "Your Response"}
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500" />
          <textarea
            id="challenge-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={8}
            disabled={submitted}
            className="relative w-full px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-base text-slate-800 dark:text-slate-200 leading-relaxed resize-y focus:outline-none focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner backdrop-blur-sm disabled:opacity-70"
            placeholder={ar ? "اكتب إجابتك هنا..." : "Write your response here..."}
            dir={ar ? "rtl" : "ltr"}
          />
        </div>

        {/* Submit button or evaluation result */}
        {!submitted ? (
          <button
            type="button"
            disabled={!response.trim() || isSubmitting}
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{ar ? "جاري التقييم..." : "Evaluating..."}</span>
              </>
            ) : (
              <span>{ar ? "إرسال التحدي" : "Submit Challenge"}</span>
            )}
          </button>
        ) : evaluation ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-white to-emerald-50/60 dark:from-slate-900 dark:to-emerald-950/30 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                  {ar ? "تم التقييم" : "Evaluated"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= evaluation.score
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              {evaluation.feedback}
            </p>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
