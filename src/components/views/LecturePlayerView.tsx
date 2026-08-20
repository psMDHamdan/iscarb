"use client";

/**
 * LecturePlayerView — orchestrator component for the Student Workbench.
 *
 * This is the final integration layer. It:
 *  - Uses `useLectureState(versionId)` for ALL state management
 *  - Implements the player mode state machine: ORIENTATION → GUIDED|REVIEW → S20_GATE → POST_LECTURE
 *  - Delegates rendering to:
 *      OrientationView     — pre-lecture mode selection
 *      WorkbenchLayout     — root two-panel container
 *      RoadmapSidebar      — left collapsible panel
 *      SlideCanvas         — left content area
 *      InteractiveZone     — right Activity + Notes panel
 *      S20ReadinessGate    — slide 20 readiness gate overlay
 *      PostLectureReport   — terminal screen after lecture completion
 *      VisualExpandModal   — fullscreen SVG modal
 *  - Retains all API call logic, progress persistence, and keyboard navigation
 *  - Does NOT contain any inline rendering code for slide content
 *
 * Requirements: 1.1–1.8, 2.1–2.7, 3.1–3.7, 4.1–4.8, 5.12, 7.1–7.7, 8.1–8.6,
 *               10.1–10.3, 11.1–11.5
 */

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";

// UI primitives
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";
import { XCircle } from "lucide-react";

// State hook
import { useLectureState } from "@/hooks/useLectureState";

// Sub-components
import { WorkbenchLayout } from "./learning/WorkbenchLayout";
import { RoadmapSidebar } from "./learning/RoadmapSidebar";
import { SlideCanvas } from "./learning/SlideCanvas";
import { InteractiveZone } from "./learning/InteractiveZone";
import { OrientationView } from "./learning/OrientationView";
import { S20ReadinessGate } from "./learning/S20ReadinessGate";
import { PostLectureReport } from "./learning/PostLectureReport";
import { VisualExpandModal } from "./learning/VisualExpandModal";
import { OrientationModal } from "./learning/OrientationModal";

// SVG renderer for expand modal
import { renderSvgDiagram } from "@/lib/lecture/renderer/svg-visual-renderer";
import { generateVisualPlaceholderDataUrl } from "@/lib/lecture/renderer/visual-placeholder";

// Content helpers
import { slideTitle, slideBullets } from "@/lib/lecture/renderer/content";
import type { SlideContentJson, ReadinessItemJson } from "@/lib/lecture/generation/types";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerData {
  version: any;
  artifacts: {
    id: string;
    slideNo: number;
    contentJson: SlideContentJson;
  }[];
  readinessItems: ReadinessItemJson[];
  concepts?: { id: string; name: string }[];
  /** slideNo → { type: poll | pause_discuss | collaboration | practice | worked_example } */
  interactions?: Record<string, { type: string | null; function: string | null }>;
}

// ---------------------------------------------------------------------------
// itemKeyFor — matches key scheme used in ReadinessItemCard / ActivityWidget
// ---------------------------------------------------------------------------
function itemKeyFor(slideNo: number, idx: number) {
  return `${slideNo}-${idx}`;
}

// ---------------------------------------------------------------------------
// LecturePlayerView
// ---------------------------------------------------------------------------
export function LecturePlayerView({
  versionId,
  isPreview: explicitPreview = false,
}: {
  versionId: string;
  isPreview?: boolean;
}) {
  const isPreview = explicitPreview || versionId.startsWith("PREVIEW_");
  const actualVersionId = isPreview && versionId.startsWith("PREVIEW_") ? versionId.replace("PREVIEW_", "") : versionId;

  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();

  // ── API data ──────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useApiQuery<PlayerData>(
    ["lecture", "player", actualVersionId],
    `/api/iscarb/lecture/packages/${actualVersionId}`,
  );

  const saveProgress = useApiMutation<{ progress: any }, any>(
    `/api/iscarb/lecture/packages/${actualVersionId}/progress`,
    { method: "PATCH" },
  );

  // ── Centralised state (useLectureState hook) ──────────────────────────────
  const {
    // Navigation
    currentSlideIndex,
    setCurrentSlideIndex,
    completedSlideIndices,
    setCompletedSlideIndices,

    // Player mode
    playerMode,
    setPlayerMode,

    // Guided phase
    guidedPhase,
    setGuidedPhase,
    guidedPhasesMap,
    setGuidedPhasesMap,

    // Answer / interaction
    selectedAnswers,
    setSelectedAnswers,
    reflectionInput,
    setReflectionInput,
    pollVotes,
    setPollVotes,
    confidence,
    setConfidence,
    selfRating,
    setSelfRating,

    // Mastery / scoring
    conceptMastery,
    setConceptMastery,
    misconceptionLog,
    setMisconceptionLog,
    xpScore,
    setXpScore,

    // AI Learning Coach / Session
    sessionId,
    initSession,
    misconceptionFeedback,
    requestMisconceptionFeedback,
    dismissMisconceptionFeedback,
    hintData,
    requestHint,
    teachItBackResult,
    requestTeachItBack,
    dismissTeachItBack,
    learningCoachLoading,

    // Notes
    slideNotes,
    updateNote,

    // UI
    sidebarCollapsed,
    setSidebarCollapsed,

    // Attempt input
    attemptInput,

    // Submission tracking
    submittedReflections,
    setSubmittedReflections,
    pollSubmitted,
    setPollSubmitted,

    // Offline queue
    pendingUpdates,

    // Raw progress data
    progressData,

    // Helpers
    persistPayload,
    queueSave,
  } = useLectureState(actualVersionId);

  // ── Local UI state not managed by useLectureState ─────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandModalOpen, setExpandModalOpen] = useState(false);
  const [showOrientationModal, setShowOrientationModal] = useState(true);

  // Whether the forward navigation was blocked — triggers inline warning in IZ
  const [showAdvanceWarning, setShowAdvanceWarning] = useState(false);

  // ── Refs for accessibility ────────────────────────────────────────────────
  const slideHeadingRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // ── Derived values ────────────────────────────────────────────────────────
  const slides = useMemo(() => {
    return deduplicateSlideArtifacts(data?.artifacts ?? []);
  }, [data?.artifacts]);
  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex];

  const readinessItems = useMemo(() => {
    return deduplicateReadinessItems(data?.readinessItems ?? []);
  }, [data?.readinessItems]);

  const groupedItems = useMemo(() => {
    const map = new Map<number, ReadinessItemJson[]>();
    for (const item of readinessItems) {
      if (!map.has(item.slideNo)) map.set(item.slideNo, []);
      map.get(item.slideNo)!.push(item);
    }
    return map;
  }, [readinessItems]);

  const totalQuestions = useMemo(() => readinessItems.length, [readinessItems]);

  const correctAnswers = useMemo(() => {
    let c = 0;
    for (const [slideNo, items] of groupedItems) {
      items.forEach((item, idx) => {
        const key = itemKeyFor(slideNo, idx);
        if (selectedAnswers[key] !== undefined && selectedAnswers[key] === item.correctIndex) c++;
      });
    }
    return c;
  }, [groupedItems, selectedAnswers]);

  const progressPercent = totalSlides > 0 ? ((currentSlideIndex + 1) / totalSlides) * 100 : 0;
  const isLastSlide = currentSlideIndex === totalSlides - 1;

  // Current slide's interaction type (for InteractiveZone)
  const currentInteractionType = currentSlide
    ? (data?.interactions?.[String(currentSlide.slideNo)]?.type ?? null)
    : null;

  // Current slide's readiness items
  const currentReadinessItems = useMemo(() => {
    if (!currentSlide) return [];
    return readinessItems.filter((i) => i.slideNo === currentSlide.slideNo);
  }, [readinessItems, currentSlide]);

  // Note content for the current slide
  const currentNoteContent = slideNotes[String(currentSlideIndex)] ?? "";

  // SVG for expand modal: get from current slide's visualIntent
  const currentVisualIntent = (currentSlide?.contentJson as any)?.visualIntent as string | undefined;
  const currentSvgMarkup = useMemo(() => {
    if (!currentSlide || !currentVisualIntent) return null;
    const bullets = slideBullets(currentSlide.contentJson);
    return renderSvgDiagram(currentVisualIntent, bullets, currentSlide.slideNo, 960, 540);
  }, [currentSlide, currentVisualIntent]);
  const currentFallbackDataUrl = useMemo(() => {
    if (!currentSlide || !currentVisualIntent) return null;
    return generateVisualPlaceholderDataUrl({
      slideNo: currentSlide.slideNo,
      fn: "core_concept",
      visualIntent: currentVisualIntent,
      width: 960,
      height: 540,
    });
  }, [currentSlide, currentVisualIntent]);

  // ── Slides data for RoadmapSidebar ───────────────────────────────────────
  const sidebarSlides = useMemo(
    () =>
      slides.map((s) => ({
        slideNo: s.slideNo,
        title: slideTitle(s.contentJson) || `Slide ${s.slideNo}`,
        cloIds: (s.contentJson as any).cloIds as string[] | undefined,
      })),
    [slides],
  );

  // ── Focus heading on slide change (Req 10.2) ─────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      slideHeadingRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentSlideIndex]);

  // ── ARIA live region update on slide change (Req 10.3) ───────────────────
  useEffect(() => {
    if (!currentSlide || !liveRef.current) return;
    const title = slideTitle(currentSlide.contentJson);
    liveRef.current.textContent = ar
      ? `شريحة ${currentSlide.slideNo} من ${totalSlides}: ${title}`
      : `Slide ${currentSlide.slideNo} of ${totalSlides}: ${title}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex]);

  // ── Listen for S20 gate-cleared event (fired by S20ReadinessGate) ────────
  useEffect(() => {
    const handleGateCleared = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.completedAt && !isPreview) {
        saveProgress.mutate(
          persistPayload({ completedAt: detail.completedAt } as any),
        );
      }
    };
    window.addEventListener("iscarb:gate-cleared", handleGateCleared);
    return () => window.removeEventListener("iscarb:gate-cleared", handleGateCleared);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  // ── Initialize Learning Coach Session (Req 11.3 & R3) ─────────────────────
  useEffect(() => {
    const projId = data?.version?.projectId || (data?.version as any)?.project?.id;
    if (projId && !isPreview) {
      initSession(projId, data?.concepts || []);
    }
  }, [data?.version?.projectId, (data?.version as any)?.project?.id, isPreview, initSession, data?.concepts]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  /**
   * Navigate to a specific slide index.
   * Always allowed (used by RoadmapSidebar and review navigation).
   * Requirements: 3.5 (Review Mode free navigation)
   */
  const goToSlide = useCallback(
    (index: number) => {
      const nextIndex = Math.max(0, Math.min(totalSlides - 1, index));
      if (nextIndex === currentSlideIndex) return;

      setCurrentSlideIndex(nextIndex);
      // Reset guided phase for new slide
      setGuidedPhase(0);
      setShowAdvanceWarning(false);

      const nextSlideNo = slides[nextIndex]?.slideNo ?? nextIndex + 1;
      // Update completed set
      setCompletedSlideIndices((prev) => {
        const next = new Set(prev);
        next.add(currentSlideIndex); // mark current as visited
        return next;
      });

      queueSave(() =>
        saveProgress.mutate(
          persistPayload({
            lastSlideNo: nextSlideNo,
            completedSlides: Array.from(
              new Set([...Array.from(completedSlideIndices), currentSlideIndex]),
            ) as any,
            ...(nextIndex === totalSlides - 1 ? { completedAt: new Date().toISOString() } : {}),
          } as any),
        ),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSlideIndex, totalSlides, slides, completedSlideIndices],
  );

  /**
   * Try to advance to the next slide.
   * In Guided Mode: blocked unless guidedPhase >= 2 (Check Phase submitted).
   * In Review Mode: always allowed.
   * Requirements: 3.4, 4.1, 4.6
   */
  const tryAdvance = useCallback(() => {
    const isGuidedMode = playerMode === "GUIDED";
    const checkPhaseDone = guidedPhase >= 2;

    if (isGuidedMode && !checkPhaseDone) {
      // Blocked — show inline warning (Req 4.7)
      setShowAdvanceWarning(true);
      return;
    }

    setShowAdvanceWarning(false);

    // If on last slide, transition to POST_LECTURE
    if (isLastSlide) {
      setPlayerMode("POST_LECTURE");
      return;
    }

    goToSlide(currentSlideIndex + 1);
  }, [playerMode, guidedPhase, isLastSlide, currentSlideIndex, goToSlide, setPlayerMode]);

  // ── Guided phase handlers ─────────────────────────────────────────────────

  /**
   * Called by SlideCanvas when the student submits a prediction (PREDICT → LEARN).
   * Requirements: 4.2, 4.3
   */
  const handlePredictSubmit = useCallback(
    (_text: string) => {
      setGuidedPhase(1);
      setShowAdvanceWarning(false);

      // Persist phase reached
      const newMap = { ...guidedPhasesMap, [currentSlide?.slideNo ?? 0]: 1 };
      setGuidedPhasesMap(newMap);
    },
    [currentSlide, guidedPhasesMap, setGuidedPhase, setGuidedPhasesMap],
  );

  /**
   * Called by SlideCanvas "Ready to Check?" or InteractiveZone (LEARN → CHECK).
   * Requirements: 4.4, 4.5
   */
  const handleReadyToCheck = useCallback(() => {
    setGuidedPhase(2);
    setShowAdvanceWarning(false);

    const newMap = { ...guidedPhasesMap, [currentSlide?.slideNo ?? 0]: 2 };
    setGuidedPhasesMap(newMap);
  }, [currentSlide, guidedPhasesMap, setGuidedPhase, setGuidedPhasesMap]);

  /**
   * Called by InteractiveZone / ActivityWidget when an activity is submitted.
   * Unlocks forward navigation (Check Phase complete).
   * Requirements: 4.6
   */
  const handleCheckPhaseUnlock = useCallback(() => {
    // Ensure guided phase is at CHECK (2) — activity submission completes the phase
    if (guidedPhase < 2) {
      setGuidedPhase(2);
    }
    setShowAdvanceWarning(false);

    const newMap = { ...guidedPhasesMap, [currentSlide?.slideNo ?? 0]: 2 };
    setGuidedPhasesMap(newMap);
  }, [guidedPhase, currentSlide, guidedPhasesMap, setGuidedPhase, setGuidedPhasesMap]);

  // ── Activity handlers ─────────────────────────────────────────────────────

  const handleActivitySubmit = useCallback(
    (type: "mcq" | "poll" | "reflection" | "worked_example", payload: unknown) => {
      let newScore = xpScore;

      if (type === "poll") {
        const vote = (payload as { vote: number }).vote;
        const pollKey = `poll-${currentSlide?.slideNo}`;
        if (!pollSubmitted[pollKey]) {
          setPollVotes((prev) => ({ ...prev, [pollKey]: vote }));
          setPollSubmitted((prev) => ({ ...prev, [pollKey]: true }));
          newScore = Math.min(100, xpScore + 5);
          setXpScore(newScore);
        }
      } else if (type === "reflection") {
        const text = (payload as { text: string }).text;
        const reflKey = `slide-${currentSlide?.slideNo}`;
        setReflectionInput((prev) => ({ ...prev, [reflKey]: text }));
        setSubmittedReflections((prev) => ({ ...prev, [reflKey]: true }));
        newScore = Math.min(100, xpScore + 5);
        setXpScore(newScore);
      } else if (type === "worked_example") {
        newScore = Math.min(100, xpScore + 5);
        setXpScore(newScore);
      }

      queueSave(() =>
        saveProgress.mutate(persistPayload({ score: newScore } as any)),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xpScore, currentSlide, pollSubmitted],
  );

  const handleReadinessAnswer = useCallback(
    (itemKey: string, optionIndex: number, item: ReadinessItemJson) => {
      if (selectedAnswers[itemKey] !== undefined) return;

      let targetCorrectIndex = item.correctIndex;
      if (
        (targetCorrectIndex === undefined || targetCorrectIndex === -1) &&
        Array.isArray(item.options)
      ) {
        targetCorrectIndex = item.options.findIndex(
          (o: any) => typeof o === "object" && o.isCorrect === true,
        );
      }
      if (targetCorrectIndex === -1 || targetCorrectIndex === undefined) targetCorrectIndex = 0;

      const newAnswers = { ...selectedAnswers, [itemKey]: optionIndex };
      setSelectedAnswers(newAnswers);

      const isCorrect = optionIndex === targetCorrectIndex;
      const newScore = isCorrect ? Math.min(100, xpScore + 10) : xpScore;
      if (isCorrect) {
        setXpScore(newScore);
        dismissMisconceptionFeedback();
      } else {
        const optText =
          typeof item.options[optionIndex] === "string"
            ? item.options[optionIndex]
            : (item.options[optionIndex] as any)?.text || `Option ${String.fromCharCode(65 + optionIndex)}`;
        const userConf = confidence[itemKey] || "somewhat";
        requestMisconceptionFeedback(item, optText, userConf);
      }

      // Update concept mastery
      const concepts: string[] =
        (currentSlide?.contentJson as any)?.conceptIds ?? [];
      const nextMastery = { ...conceptMastery };
      const nextMisconceptions = { ...misconceptionLog };
      concepts.forEach((c) => {
        if (isCorrect) {
          if (!nextMastery[c] || nextMastery[c] === "introduced") nextMastery[c] = "practiced";
          else if (nextMastery[c] === "practiced") nextMastery[c] = "applied";
        } else {
          nextMisconceptions[c] = (nextMisconceptions[c] || 0) + 1;
        }
      });
      setConceptMastery(nextMastery);
      setMisconceptionLog(nextMisconceptions);

      if (!isPreview) {
        queueSave(() =>
          saveProgress.mutate(
            persistPayload({
              score: newScore,
              selectedAnswers: newAnswers,
              conceptMastery: nextMastery,
              misconceptionLog: nextMisconceptions,
            } as any),
          ),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedAnswers, xpScore, currentSlide, conceptMastery, misconceptionLog, confidence, isPreview],
  );

  // ── Retry S20 Gate ────────────────────────────────────────────────────────
  const handleRetryS20 = useCallback(() => {
    const newAnswers = { ...selectedAnswers };
    for (const [slideNo, items] of groupedItems) {
      if (slideNo === 20) {
        items.forEach((_, idx) => {
          delete newAnswers[itemKeyFor(slideNo, idx)];
        });
      }
    }
    setSelectedAnswers(newAnswers);
    // Return to Check Phase for slide 20
    setGuidedPhase(2);
    setPlayerMode("GUIDED");

    queueSave(() => saveProgress.mutate(persistPayload({ selectedAnswers: newAnswers } as any)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnswers, groupedItems]);

  // ── Keyboard navigation (Req 10.1) ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Suppress when focus is inside text inputs (Req 10.1)
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target.getAttribute("role") === "textbox"
      )
        return;

      // Only handle bindings when in GUIDED or REVIEW mode (not ORIENTATION/POST_LECTURE)
      if (playerMode !== "GUIDED" && playerMode !== "REVIEW") return;

      const bindings: Record<string, () => void> = {
        ArrowRight: () => tryAdvance(),
        PageDown: () => tryAdvance(),
        ArrowLeft: () => goToSlide(Math.max(0, currentSlideIndex - 1)),
        PageUp: () => goToSlide(Math.max(0, currentSlideIndex - 1)),
        Home: () => goToSlide(0),
        End: () => goToSlide(totalSlides - 1),
      };

      const handler = bindings[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSlideIndex, totalSlides, playerMode, guidedPhase, tryAdvance, goToSlide]);

  // ── Loading / error / empty states ───────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center p-6">
        <div className="space-y-4 text-center max-w-md">
          <div className="p-4 rounded-full bg-[#0E6C3C]/10 text-[#0E6C3C] w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="text-base font-display font-bold text-foreground">
            {ar ? "جاري تحميل المنصة التفاعلية للطالب..." : "Loading Student Lecture Workbench..."}
          </div>
          <Progress value={65} className="h-2" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[75vh] items-center justify-center p-6">
        <Card className="max-w-md border-red-500/30 bg-red-500/5 rounded-3xl shadow-lg">
          <CardContent className="p-8 text-center space-y-3">
            <XCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-base font-bold text-red-700 dark:text-red-300">
              {ar ? "تعذر تحميل المحاضرة" : "Failed to load lecture workbench"}
            </p>
            <p className="text-xs text-muted-foreground">{(error as any)?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        {ar ? "لا توجد شرائح في هذه الحزمة." : "No slides found in this published package."}
      </div>
    );
  }

  // Auto-transition ORIENTATION to GUIDED mode so Workbench renders with modal overlay
  if (playerMode === "ORIENTATION") {
    setPlayerMode("GUIDED");
    setGuidedPhase(0);
    setShowOrientationModal(true);
  }

  // ── Player mode: POST_LECTURE ─────────────────────────────────────────────
  if (playerMode === "POST_LECTURE") {
    const sessionMinutes =
      (progressData?.progress as any)?.timeOnTaskMinutes ??
      Math.max(1, Math.round(totalSlides * 3));

    return (
      <PostLectureReport
        conceptMastery={conceptMastery}
        misconceptionLog={misconceptionLog}
        totalXp={xpScore}
        correctAnswers={correctAnswers}
        totalQuestions={totalQuestions}
        timeOnTaskMinutes={sessionMinutes}
        ar={ar}
        onRevisitWeakAreas={() => {
          setPlayerMode("REVIEW");
          goToSlide(0);
        }}
        onPracticeMode={() => {
          setPlayerMode("REVIEW");
          goToSlide(0);
        }}
      />
    );
  }

  // ── Guard: currentSlide must exist for GUIDED/REVIEW/S20_GATE modes ───────
  if (!currentSlide) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        {ar ? "لا توجد شرائح في هذه الحزمة." : "No slides found in this published package."}
      </div>
    );
  }

  // ── Determine if S20 Readiness Gate should show ───────────────────────────
  // Wire S20ReadinessGate when currentSlideIndex === 19 and guidedPhase === 2
  const showS20Gate =
    currentSlideIndex === 19 && guidedPhase === 2 && playerMode === "GUIDED";

  // ── Build sidebar slot ────────────────────────────────────────────────────
  const sidebarSlot = (
    <RoadmapSidebar
      slides={sidebarSlides}
      currentSlideIndex={currentSlideIndex}
      completedSlideIndices={completedSlideIndices}
      xpScore={xpScore}
      progressPercent={progressPercent}
      playerMode={playerMode === "GUIDED" ? "GUIDED" : "REVIEW"}
      onNavigate={goToSlide}
      onCollapse={() => setSidebarCollapsed(true)}
    />
  );

  // ── Build canvas slot (S20 Gate or SlideCanvas) ───────────────────────────
  const canvasSlot = showS20Gate ? (
    <S20ReadinessGate
      readinessItems={readinessItems}
      selectedAnswers={selectedAnswers}
      completedSlideIndices={completedSlideIndices}
      xpScore={xpScore}
      onRetry={handleRetryS20}
      onTakeAssessment={() => router.push("/assessment/employability")}
      ar={ar}
    />
  ) : (
    <SlideCanvas
      slide={currentSlide}
      playerMode={playerMode === "GUIDED" ? "GUIDED" : "REVIEW"}
      guidedPhase={guidedPhase as 0 | 1 | 2}
      ar={ar}
      headingRef={slideHeadingRef}
      onPredictSubmit={handlePredictSubmit}
      onReadyToCheck={handleReadyToCheck}
      completedSlideIndices={completedSlideIndices}
      totalSlides={totalSlides}
      onExpandVisual={currentVisualIntent ? () => setExpandModalOpen(true) : undefined}
    />
  );

  // ── Build interactive zone slot ───────────────────────────────────────────
  const interactiveZoneSlot = (
    <InteractiveZone
      slide={currentSlide}
      readinessItems={currentReadinessItems}
      versionId={actualVersionId}
      guidedPhase={guidedPhase as 0 | 1 | 2}
      playerMode={playerMode === "GUIDED" ? "GUIDED" : "REVIEW"}
      interactionType={currentInteractionType}
      ar={ar}
      noteContent={currentNoteContent}
      onNoteChange={(text) => updateNote(String(currentSlideIndex), text)}
      onActivitySubmit={handleActivitySubmit}
      onReadinessAnswer={handleReadinessAnswer}
      onCheckPhaseUnlock={handleCheckPhaseUnlock}
      readinessSelectedAnswers={selectedAnswers}
      showAdvanceWarning={showAdvanceWarning}
      misconceptionFeedback={misconceptionFeedback}
      onDismissMisconception={dismissMisconceptionFeedback}
      hintData={hintData}
      onRequestHint={requestHint}
      teachItBackResult={teachItBackResult}
      onRequestTeachItBack={requestTeachItBack}
      onDismissTeachItBack={dismissTeachItBack}
      learningCoachLoading={learningCoachLoading}
    />
  );

  // ── Render Workbench ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full">
      {isPreview && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4 text-center tracking-wider uppercase shadow-sm shrink-0 flex items-center justify-center gap-2">
          <span>🔍 {ar ? "وضع المعاينة لهيئة التدريس (معاينة حية لتجربة الطالب - لا يتم حفظ التقدم)" : "Faculty Student Experience Preview Mode (Read-only simulation - no student session recorded)"}</span>
        </div>
      )}
      <WorkbenchLayout
        isFullscreen={isFullscreen}
        onFullscreenToggle={() => setIsFullscreen((v) => !v)}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarCollapse={() => setSidebarCollapsed((v) => !v)}
        sidebar={sidebarSlot}
        canvas={canvasSlot}
        interactiveZone={interactiveZoneSlot}
      />

      {/* Accessibility ARIA live region for screen reader slide announcements */}
      {/* textContent is updated imperatively via liveRef — Req 10.3 */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      {/* Light Green Glassmorphic Orientation Modal */}
      <OrientationModal
        isOpen={showOrientationModal}
        onClose={() => setShowOrientationModal(false)}
        title={data.version?.title || "Interactive Lecture"}
        courseName={data.version?.project?.courseProfile?.title ?? "University Course"}
        clos={(data as any).clos ?? (data.version?.project?.courseProfile?.teacherEnteredClos as any) ?? []}
        conceptCount={totalSlides || 20}
        practiceCount={5}
        ar={ar}
        onStart={() => {
          setShowOrientationModal(false);
          setGuidedPhase(0);
        }}
      />

      {/* Fullscreen SVG expand modal — Req 5.12 */}
      <VisualExpandModal
        isOpen={expandModalOpen}
        svgMarkup={currentSvgMarkup}
        dataUrl={currentFallbackDataUrl}
        alt={currentVisualIntent ?? "Visual diagram"}
        onClose={() => setExpandModalOpen(false)}
        ar={ar}
      />
    </div>
  );
}
