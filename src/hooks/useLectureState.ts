"use client";

/**
 * useLectureState — centralised lecture player state hook.
 *
 * Extracts all interactive and persistence state from LecturePlayerView.tsx
 * into a single, testable custom hook.
 *
 * Responsibilities:
 *  - Own every piece of state the player needs (slide position, mode, answers, etc.)
 *  - Provide `persistPayload()` that serialises state into the progress API shape
 *  - Manage a `navigator.onLine` queue so PATCH retries are drained on reconnect
 *  - Save/restore notes via localStorage(`iscarb-notes-{versionId}`)
 *  - Save/restore guided phases via localStorage(`iscarb-guided-phases-{versionId}`)
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 4.8
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useApiQuery } from "@/lib/use-api-query";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerMode = "ORIENTATION" | "GUIDED" | "REVIEW" | "S20_GATE" | "POST_LECTURE";

/** 0 = PREDICT, 1 = LEARN, 2 = CHECK */
export type GuidedPhase = 0 | 1 | 2;

export type SelfRating = "solved" | "partial" | "stuck";
export type Confidence = "low" | "medium" | "high";

/**
 * The progress payload shape sent to PATCH /api/iscarb/lecture/packages/{versionId}/progress
 * Matches the design spec persistPayload() shape exactly.
 */
export interface ProgressPayload {
  lastSlideNo: number;
  completedSlides: number[];
  score: number;
  selectedAnswers: Record<string, number>;
  reflectionInput: Record<string, string>;
  pollVotes: Record<string, number>;
  confidence: Record<string, Confidence>;
  selfRating: Record<string, SelfRating>;
  conceptMastery: Record<string, string>;
  misconceptionLog: Record<string, number>;
  /** Optional: present on last-slide completion */
  completedAt?: string;
}

/**
 * Restored progress data shape returned by GET progress endpoint.
 */
export interface ProgressData {
  progress: {
    lastSlideNo?: number;
    completedSlides?: number | number[];
    score?: number;
    selectedAnswers?: Record<string, number>;
    reflectionInput?: Record<string, string>;
    pollVotes?: Record<string, number>;
    confidence?: Record<string, Confidence>;
    selfRating?: Record<string, SelfRating>;
    conceptMastery?: Record<string, string>;
    misconceptionLog?: Record<string, number>;
    // Legacy answer shape (from the old LecturePlayerView)
    answers?: Record<string, unknown>;
    reflections?: Record<string, unknown>;
  } | null;
}

export interface LectureStateReturn {
  // ── Navigation ──────────────────────────────────────────────────────────────
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;

  /** Set of slide indices (0-based) that have been visited/completed */
  completedSlideIndices: Set<number>;
  setCompletedSlideIndices: React.Dispatch<React.SetStateAction<Set<number>>>;

  // ── Player mode state machine ────────────────────────────────────────────────
  playerMode: PlayerMode;
  setPlayerMode: (mode: PlayerMode) => void;

  // ── Guided mode per-slide phase ──────────────────────────────────────────────
  /** 0 = PREDICT, 1 = LEARN, 2 = CHECK (current slide's active phase) */
  guidedPhase: GuidedPhase;
  setGuidedPhase: (phase: GuidedPhase) => void;

  /**
   * Per-slide max phase reached, persisted to localStorage.
   * Key = slideNo (number), value = max GuidedPhase reached (0 | 1 | 2).
   */
  guidedPhasesMap: Record<number, number>;
  setGuidedPhasesMap: (map: Record<number, number>) => void;

  // ── Answer / interaction state ───────────────────────────────────────────────
  selectedAnswers: Record<string, number>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  reflectionInput: Record<string, string>;
  setReflectionInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  pollVotes: Record<string, number>;
  setPollVotes: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  confidence: Record<string, Confidence>;
  setConfidence: React.Dispatch<React.SetStateAction<Record<string, Confidence>>>;

  selfRating: Record<string, SelfRating>;
  setSelfRating: React.Dispatch<React.SetStateAction<Record<string, SelfRating>>>;

  // ── Mastery / scoring ────────────────────────────────────────────────────────
  conceptMastery: Record<string, string>;
  setConceptMastery: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  misconceptionLog: Record<string, number>;
  setMisconceptionLog: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  xpScore: number;
  setXpScore: React.Dispatch<React.SetStateAction<number>>;

  // ── Notes (localStorage-backed) ──────────────────────────────────────────────
  slideNotes: Record<string, string>;
  updateNote: (slideIndexKey: string, text: string) => void;

  // ── UI state ─────────────────────────────────────────────────────────────────
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // ── Attempt input (worked-example scratch area) ───────────────────────────────
  attemptInput: Record<string, string>;
  setAttemptInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // ── Submission tracking ───────────────────────────────────────────────────────
  submittedReflections: Record<string, boolean>;
  setSubmittedReflections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  pollSubmitted: Record<string, boolean>;
  setPollSubmitted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // ── AI Learning Coach / Session ──────────────────────────────────────────────
  sessionId: string | null;
  initSession: (projectId: string, initialConcepts?: any[]) => Promise<string | null>;
  misconceptionFeedback: Record<string, any> | null;
  requestMisconceptionFeedback: (question: any, selectedAnswer: string, confidence: string) => Promise<any>;
  dismissMisconceptionFeedback: () => void;
  hintData: Record<string, { hint: string; level: number }>;
  requestHint: (question: string, level: number) => Promise<any>;
  teachItBackResult: any | null;
  requestTeachItBack: (conceptName: string, conceptDefinition: string, studentResponse: string) => Promise<any>;
  dismissTeachItBack: () => void;
  learningCoachLoading: boolean;

  // ── Pending offline updates ───────────────────────────────────────────────────
  pendingUpdates: React.MutableRefObject<(() => void)[]>;

  // ── Raw progress data (from API, for callers that need it) ────────────────────
  progressData: ProgressData | null;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  /**
   * Serialises current state into the ProgressPayload shape expected by the
   * PATCH /api/iscarb/lecture/packages/{versionId}/progress endpoint.
   *
   * Shape (per design spec):
   * {
   *   lastSlideNo: currentSlideIndex + 1,
   *   completedSlides: [...completedSlideIndices],
   *   score: xpScore,
   *   selectedAnswers,
   *   reflectionInput,
   *   pollVotes,
   *   confidence,
   *   selfRating,
   *   conceptMastery,
   *   misconceptionLog,
   * }
   *
   * Accepts an optional `overrides` map that is shallow-merged on top of the
   * base payload (used by goToSlide, handleRetryS20, etc.).
   *
   * Requirements: 11.1, 11.2
   */
  persistPayload: (overrides?: Partial<ProgressPayload> & Record<string, unknown>) => ProgressPayload;

  /**
   * Queues or immediately executes a save function depending on
   * navigator.onLine. When offline, the call is pushed into `pendingUpdates`;
   * it will be drained automatically when the `online` event fires.
   *
   * Requirements: 11.4
   */
  queueSave: (saveFn: () => void) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useLectureState(versionId)
 *
 * Central state manager for the lecture player. Accepts only the versionId
 * (the stable ID for localStorage keys and API calls) and returns all state
 * variables, setters, and helpers needed by the Workbench.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 4.8
 */
export function useLectureState(versionId: string): LectureStateReturn {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlideIndices, setCompletedSlideIndices] = useState<Set<number>>(new Set());

  // ── Player mode ──────────────────────────────────────────────────────────────
  const [playerMode, setPlayerMode] = useState<PlayerMode>("ORIENTATION");

  // ── Guided phase ─────────────────────────────────────────────────────────────
  const [guidedPhase, setGuidedPhase] = useState<GuidedPhase>(0);
  const [guidedPhasesMap, setGuidedPhasesMapState] = useState<Record<number, number>>({});

  // ── Answer / interaction ─────────────────────────────────────────────────────
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [reflectionInput, setReflectionInput] = useState<Record<string, string>>({});
  const [submittedReflections, setSubmittedReflections] = useState<Record<string, boolean>>({});
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
  const [pollSubmitted, setPollSubmitted] = useState<Record<string, boolean>>({});
  const [confidence, setConfidence] = useState<Record<string, Confidence>>({});
  const [attemptInput, setAttemptInput] = useState<Record<string, string>>({});
  const [selfRating, setSelfRating] = useState<Record<string, SelfRating>>({});

  // ── Mastery / scoring ─────────────────────────────────────────────────────────
  const [conceptMastery, setConceptMastery] = useState<Record<string, string>>({});
  const [misconceptionLog, setMisconceptionLog] = useState<Record<string, number>>({});
  const [xpScore, setXpScore] = useState(0);

  // ── AI Learning Coach / Session ──────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [misconceptionFeedback, setMisconceptionFeedback] = useState<Record<string, any> | null>(null);
  const [hintData, setHintData] = useState<Record<string, { hint: string; level: number }>>({});
  const [teachItBackResult, setTeachItBackResult] = useState<any | null>(null);
  const [learningCoachLoading, setLearningCoachLoading] = useState(false);

  // ── Notes ─────────────────────────────────────────────────────────────────────
  const [slideNotes, setSlideNotes] = useState<Record<string, string>>({});

  // ── UI ────────────────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Offline retry queue ───────────────────────────────────────────────────────
  // Requirements: 11.4
  const pendingUpdates = useRef<(() => void)[]>([]);

  // ── Fetch progress from API ───────────────────────────────────────────────────
  // Requirements: 11.3
  const { data: progressData } = useApiQuery<ProgressData>(
    ["lecture", "progress", versionId],
    `/api/iscarb/lecture/packages/${versionId}/progress`,
  );

  // ── Restore notes from localStorage on mount ─────────────────────────────────
  // Requirements: 11.5
  useEffect(() => {
    if (!versionId) return;
    try {
      const saved = localStorage.getItem(`iscarb-notes-${versionId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        if (parsed && typeof parsed === "object") {
          setSlideNotes(parsed);
        }
      }
    } catch {
      // localStorage unavailable or JSON parse failed — degrade gracefully
    }
  }, [versionId]);

  // ── Restore guided phases from localStorage on mount ─────────────────────────
  // Requirements: 4.8
  useEffect(() => {
    if (!versionId) return;
    try {
      const saved = localStorage.getItem(`iscarb-guided-phases-${versionId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<number, number>;
        if (parsed && typeof parsed === "object") {
          setGuidedPhasesMapState(parsed);
        }
      }
    } catch {
      // localStorage unavailable — in-session state still works
      console.warn("[useLectureState] Could not restore guided phases from localStorage");
    }
  }, [versionId]);

  // ── Restore state from API progress response ──────────────────────────────────
  // Requirements: 11.3
  useEffect(() => {
    if (!progressData?.progress) return;
    const p = progressData.progress;

    if (typeof p.lastSlideNo === "number") {
      setCurrentSlideIndex(Math.max(0, Math.min(19, p.lastSlideNo - 1)));
    }

    if (typeof p.score === "number") {
      setXpScore(p.score);
    }

    // Restore completedSlides — support both array (new) and number (legacy) shapes
    if (Array.isArray(p.completedSlides)) {
      setCompletedSlideIndices(new Set(p.completedSlides));
    } else if (typeof p.completedSlides === "number" && typeof p.lastSlideNo === "number") {
      // Legacy: treat all slides up to completedSlides count as completed
      const completed = new Set<number>();
      for (let i = 0; i < p.completedSlides; i++) completed.add(i);
      setCompletedSlideIndices(completed);
    }

    // New payload shape: flat fields
    if (p.selectedAnswers && typeof p.selectedAnswers === "object") {
      setSelectedAnswers(p.selectedAnswers);
    }
    if (p.reflectionInput && typeof p.reflectionInput === "object") {
      setReflectionInput(p.reflectionInput);
      // Restore submitted state: any key with a non-empty value is considered submitted
      const sub: Record<string, boolean> = {};
      for (const k of Object.keys(p.reflectionInput)) {
        if (p.reflectionInput[k]?.trim()) sub[k] = true;
      }
      setSubmittedReflections(sub);
    }
    if (p.pollVotes && typeof p.pollVotes === "object") {
      setPollVotes(p.pollVotes);
      setPollSubmitted(
        Object.keys(p.pollVotes).reduce<Record<string, boolean>>((acc, k) => {
          acc[k] = true;
          return acc;
        }, {}),
      );
    }
    if (p.confidence && typeof p.confidence === "object") {
      setConfidence(p.confidence);
    }
    if (p.selfRating && typeof p.selfRating === "object") {
      setSelfRating(p.selfRating);
    }
    if (p.conceptMastery && typeof p.conceptMastery === "object") {
      setConceptMastery(p.conceptMastery);
    }
    if (p.misconceptionLog && typeof p.misconceptionLog === "object") {
      setMisconceptionLog(p.misconceptionLog);
    }

    // Legacy answer shape support (from old LecturePlayerView)
    if (p.answers && typeof p.answers === "object") {
      const ans = p.answers as Record<string, unknown>;

      if (!p.selectedAnswers) {
        const sel: Record<string, number> = {};
        for (const k of Object.keys(ans)) {
          if (k.startsWith("slide-") || /^\d+-\d+$/.test(k)) {
            sel[k] = Number(ans[k]);
          }
        }
        if (Object.keys(sel).length > 0) setSelectedAnswers(sel);
      }

      if (!p.pollVotes && ans.polls && typeof ans.polls === "object") {
        const polls = ans.polls as Record<string, number>;
        setPollVotes(polls);
        setPollSubmitted(
          Object.keys(polls).reduce<Record<string, boolean>>((acc, k) => {
            acc[k] = true;
            return acc;
          }, {}),
        );
      }

      if (!p.confidence && ans.confidence && typeof ans.confidence === "object") {
        setConfidence(ans.confidence as Record<string, Confidence>);
      }

      if (!p.selfRating && ans.ratings && typeof ans.ratings === "object") {
        setSelfRating(ans.ratings as Record<string, SelfRating>);
      }

      if (!p.conceptMastery && ans.conceptMastery && typeof ans.conceptMastery === "object") {
        setConceptMastery(ans.conceptMastery as Record<string, string>);
      }

      if (!p.misconceptionLog && ans.misconceptionLog && typeof ans.misconceptionLog === "object") {
        setMisconceptionLog(ans.misconceptionLog as Record<string, number>);
      }

      if (ans.attempts && typeof ans.attempts === "object") {
        setAttemptInput(ans.attempts as Record<string, string>);
      }
    }

    // Legacy reflections shape support
    if (!p.reflectionInput && p.reflections && typeof p.reflections === "object") {
      const refl = p.reflections as Record<string, unknown>;
      const texts: Record<string, string> = {};
      const sub: Record<string, boolean> = {};
      for (const k of Object.keys(refl)) {
        if (k.startsWith("slide-")) {
          texts[k] = String(refl[k] ?? "");
          sub[k] = true;
        }
      }
      if (Object.keys(texts).length > 0) {
        setReflectionInput(texts);
        setSubmittedReflections(sub);
      }
    }
  }, [progressData]);

  // ── Offline drain on reconnect ────────────────────────────────────────────────
  // Requirements: 11.4
  useEffect(() => {
    const drain = () => {
      while (pendingUpdates.current.length > 0) {
        pendingUpdates.current.shift()?.();
      }
    };
    window.addEventListener("online", drain);
    return () => window.removeEventListener("online", drain);
  }, []);

  // ── Persist guided phases map to localStorage ─────────────────────────────────
  // Requirements: 4.8
  const setGuidedPhasesMap = useCallback(
    (map: Record<number, number>) => {
      setGuidedPhasesMapState(map);
      if (!versionId) return;
      try {
        localStorage.setItem(`iscarb-guided-phases-${versionId}`, JSON.stringify(map));
      } catch {
        // Requirement 4.8: Log warning; in-session state still works
        console.warn("[useLectureState] Could not persist guided phases to localStorage");
      }
    },
    [versionId],
  );

  // ── Note update helper ────────────────────────────────────────────────────────
  // Requirements: 11.5
  const updateNote = useCallback(
    (slideIndexKey: string, text: string) => {
      setSlideNotes((prev) => {
        const next = { ...prev, [slideIndexKey]: text };
        if (versionId) {
          try {
            localStorage.setItem(`iscarb-notes-${versionId}`, JSON.stringify(next));
          } catch {
            // localStorage unavailable — degrade gracefully
          }
        }
        return next;
      });
    },
    [versionId],
  );

  // ── persistPayload ────────────────────────────────────────────────────────────
  // Requirements: 11.1, 11.2
  //
  // Shape per design spec:
  // {
  //   lastSlideNo: currentSlideIndex + 1,
  //   completedSlides: [...completedSlideIndices],
  //   score: xpScore,
  //   selectedAnswers,
  //   reflectionInput,
  //   pollVotes,
  //   confidence,
  //   selfRating,
  //   conceptMastery,
  //   misconceptionLog,
  // }
  const persistPayload = useCallback(
    (overrides: Partial<ProgressPayload> & Record<string, unknown> = {}): ProgressPayload => {
      const base: ProgressPayload = {
        lastSlideNo: currentSlideIndex + 1,
        completedSlides: Array.from(completedSlideIndices),
        score: xpScore,
        selectedAnswers,
        reflectionInput,
        pollVotes,
        confidence,
        selfRating,
        conceptMastery,
        misconceptionLog,
      };
      return { ...base, ...overrides } as ProgressPayload;
    },
    [
      currentSlideIndex,
      completedSlideIndices,
      xpScore,
      selectedAnswers,
      reflectionInput,
      pollVotes,
      confidence,
      selfRating,
      conceptMastery,
      misconceptionLog,
    ],
  );

  // ── queueSave ─────────────────────────────────────────────────────────────────
  // Requirements: 11.4
  const queueSave = useCallback((saveFn: () => void) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      pendingUpdates.current.push(saveFn);
    } else {
      saveFn();
    }
  }, []);

  // ── AI Learning Coach callbacks ──────────────────────────────────────────────
  const initSession = useCallback(async (projectId: string, initialConcepts?: any[]) => {
    try {
      const res = await fetch("/api/learning/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, initialConcepts }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session?.id) {
          setSessionId(data.session.id);
          if (data.session.currentSlideNo && data.session.currentSlideNo > 0) {
            setCurrentSlideIndex(data.session.currentSlideNo);
          }
          if (Array.isArray(data.session.mastery)) {
            const masteryMap: Record<string, string> = {};
            data.session.mastery.forEach((m: any) => {
              masteryMap[m.conceptId] = m.masteryState;
            });
            if (Object.keys(masteryMap).length > 0) {
              setConceptMastery((prev) => ({ ...masteryMap, ...prev }));
            }
          }
          return data.session.id;
        }
      }
    } catch (e) {
      console.warn("[useLectureState] session init failed:", e);
    }
    return null;
  }, []);

  const requestMisconceptionFeedback = useCallback(
    async (question: any, selectedAnswer: string, confidenceVal: string) => {
      setLearningCoachLoading(true);
      try {
        const sid = sessionId || "temp_session";
        const res = await fetch("/api/learning/misconception", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            slideNo: currentSlideIndex + 1,
            question,
            selectedAnswer,
            confidence: confidenceVal,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setMisconceptionFeedback(data);
          // Increment misconception log
          const conceptKey = typeof question === "object" && question.cloId ? question.cloId : `concept_slide_${currentSlideIndex + 1}`;
          setMisconceptionLog((prev) => ({
            ...prev,
            [conceptKey]: (prev[conceptKey] || 0) + 1,
          }));
          return data;
        }
      } catch (e) {
        console.warn("[useLectureState] misconception feedback failed:", e);
      } finally {
        setLearningCoachLoading(false);
      }
      return null;
    },
    [sessionId, currentSlideIndex]
  );

  const requestHint = useCallback(
    async (question: string, level: number) => {
      setLearningCoachLoading(true);
      try {
        const sid = sessionId || "temp_session";
        const res = await fetch("/api/learning/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            slideNo: currentSlideIndex + 1,
            question,
            hintLevel: level,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const key = `${currentSlideIndex + 1}`;
          const hintText = data.hint || data.feedbackReceived || "";
          setHintData((prev) => ({ ...prev, [key]: { hint: hintText, level } }));
          return data;
        }
      } catch (e) {
        console.warn("[useLectureState] hint request failed:", e);
      } finally {
        setLearningCoachLoading(false);
      }
      return null;
    },
    [sessionId, currentSlideIndex]
  );

  const requestTeachItBack = useCallback(
    async (conceptName: string, conceptDefinition: string, studentResponse: string) => {
      setLearningCoachLoading(true);
      try {
        const sid = sessionId || "temp_session";
        const res = await fetch("/api/learning/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            slideNo: currentSlideIndex + 1,
            studentResponse,
            conceptName,
            conceptDefinition,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTeachItBackResult(data);

          if (data.isMasteryDemonstrated) {
            setConceptMastery((prev) => ({
              ...prev,
              [conceptName]: "MASTERED",
            }));
            setXpScore((prev) => prev + 50);

            // Sync mastery to session if sessionId exists
            if (sessionId) {
              fetch("/api/learning/session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  conceptMasteryUpdates: { [conceptName]: "MASTERED" },
                }),
              }).catch(() => {});
            }
          }
          return data;
        }
      } catch (e) {
        console.warn("[useLectureState] teach-it-back failed:", e);
      } finally {
        setLearningCoachLoading(false);
      }
      return null;
    },
    [sessionId, currentSlideIndex]
  );

  const dismissMisconceptionFeedback = useCallback(() => setMisconceptionFeedback(null), []);
  const dismissTeachItBack = useCallback(() => setTeachItBackResult(null), []);

  return {
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
    setAttemptInput,

    // Submission tracking
    submittedReflections,
    setSubmittedReflections,
    pollSubmitted,
    setPollSubmitted,

    // Offline queue
    pendingUpdates,

    // Raw progress data
    progressData: progressData ?? null,

    // Helpers
    persistPayload,
    queueSave,
  };
}
