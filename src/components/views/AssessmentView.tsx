"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  AlertTriangle,
  Flag,
  Loader2,
  Languages,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/lib/store";
import { useSession } from "@/lib/use-session";
import { authHeaders } from "@/lib/client-auth";
import { cn } from "@/lib/utils";
import { DIMENSIONS, isPass } from "@/lib/assessment";
import { saveEmployabilityAttempt } from "@/lib/assessment/attempt-report-store";
import { recordScoredText } from "@/lib/assessment/finish-scoring";
import {
  ensureFourChoices,
  getExamQuestionType,
  isExamSetReady,
  isGenerationFailedModule,
  markMcqLoaded,
  prepareExamModules,
} from "@/lib/assessment/exam-mcq";
import {
  ASSESSMENT_DURATION_MINUTES,
  ASSESSMENT_DURATION_SECONDS,
  clearExamSession,
  computeSecondsLeft,
  loadExamSession,
  saveExamSession,
  type ExamTimerSessionV1,
} from "@/lib/assessment/exam-timer";
import {
  createAttemptId,
  saveReportBuildJob,
} from "@/lib/assessment/report-build-job";
import { ScoreMeter, ScoreBar } from "@/components/iscarb/ScoreMeter";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types (API payloads) ─────────────────────────────────────────────────────

interface RubricCriterion {
  criterion: string;
  weight: number;
  // descriptor removed — not sent to frontend
  gate?: boolean;
}
interface ModuleBrief {
  code: string;
  title: string;
  titleAr: string | null;
  dimension: string;
  level: string;
  framework: string;
  focus: string;
  scenario: string;
  scenarioAr?: string | null;
  instructions: string;
  instructionsAr?: string | null;
  rubric: RubricCriterion[];
  passThreshold: number;
  questionType?: string;
  choices?: string[];
  choicesAr?: string[] | null;
  specialization: string | null;
  generated: boolean;
  dynamicLoaded?: boolean;
  estimateMinutes: number | null;
  contentSource?: string;
}
interface ModulesResponse {
  specialization: string;
  jobFitSource: "curated" | "generic";
  cluster: string;
  counts: { total: number; universal: number; jobFit: number };
  modules: ModuleBrief[];
  passThreshold: number;
  attemptId?: string;
  preparing?: boolean;
  progress?: { done: number; total: number };
}
interface CriterionScore {
  criterion: string;
  weight: number;
  score: number;
  max: number;
}
interface ScoreResult {
  moduleCode: string;
  moduleTitle: string;
  dimension: string;
  score: number;
  band: string;
  passed: boolean;
  perCriterion: CriterionScore[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  persistedId: string | null;
  /** "ai" on the normal path; "fallback" only when AI genuinely failed. */
  source?: string;
}
interface DimensionScore {
  dimension: string;
  label: string;
  labelAr: string;
  weight: number;
  score: number;
  moduleCount: number;
  band: string;
}
interface ProfileResult {
  composite: number;
  band: string;
  passed: boolean;
  specialization: string | null;
  dimensions: DimensionScore[];
  covered: string[];
  computedAt: string;
}

type Phase = "intro" | "list" | "assess" | "done";

const DIM_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  core_professionalism: Brain,
  business_digital: Cpu,
  job_fit: Target,
  growth_potential: TrendingUp,
};

/** Short labels for compact start-screen category boxes. */
const DIM_SHORT_LABEL: Record<string, { en: string; ar: string }> = {
  core_professionalism: { en: "Core", ar: "الاحتراف" },
  business_digital: { en: "Business & Digital", ar: "الأعمال والرقمي" },
  job_fit: { en: "Job-Fit", ar: "الملاءمة الوظيفية" },
  growth_potential: { en: "Growth", ar: "النمو" },
};

const SPEC_SUGGESTIONS = [
  "Accounting / Finance",
  "Cybersecurity",
  "Health Management",
  "Artificial Intelligence / Data Science",
  "Computer Science / IT",
  "Finance",
] as const;

function isGenericSpecialization(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    !v ||
    v === "general" ||
    v === "general studies" ||
    v === "undeclared" ||
    v === "n/a" ||
    v === "none" ||
    v === "other"
  );
}
const DIM_ORDER = DIMENSIONS.map((d) => d.id);
/** Warn when ≤5 minutes remain or ≤10% of total time. */
const WARN_SECONDS_FLOOR = 5 * 60;
/**
 * AI four-block scoring can take up to ~240s server-side. Client abort must sit
 * above that so we never cut off a live AI call. Heuristic is server-side only
 * after a real AI failure — never a client shortcut.
 */
const SCORE_REQUEST_TIMEOUT_MS = 270_000;
const SCORE_NETWORK_RETRIES = 1;
/**
 * Parallel AI scoring concurrency (client → /score).
 * Chosen at 5 to match 5 NVIDIA keys / server AI_CONCURRENCY_MAX default.
 * Live bench at concurrency 4 already produced 429s; 8–10 historically caused
 * 100–185s key-timeout spikes. Same limit for mid-exam BG scoring and Finish.
 * Throughput also improves via continuous pool (mapWithConcurrency) vs chunk barriers.
 */
const SCORE_AI_CONCURRENCY = 5;

/**
 * Arabic JIT translation cache (localStorage). Keyed by module code but every
 * entry carries the exact English scenario it was produced from — live_ai
 * questions regenerate per attempt, so a stale translation for the same code
 * is never applied to different content.
 */
const AR_TRANSLATION_CACHE_KEY = "iscarb:ar-translations:v2";
/** How many live_ai questions to keep translating ahead (active + prefetch). */
const AR_TRANSLATE_PREFETCH = 6;

// ── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Shuffle array within dimension groups so question order varies each attempt. */
function shuffleModulesWithSeed<T extends { dimension: string }>(arr: T[], seed: number): T[] {
  const dimGroups = new Map<string, T[]>();
  for (const item of arr) {
    if (!dimGroups.has(item.dimension)) dimGroups.set(item.dimension, []);
    dimGroups.get(item.dimension)!.push(item);
  }
  const result: T[] = [];
  for (const [, group] of dimGroups) {
    let s = seed;
    for (let i = group.length - 1; i > 0; i--) {
      s = ((s * 1664525) + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [group[i], group[j]] = [group[j]!, group[i]!];
    }
    result.push(...group);
  }
  return result;
}

// ── View ─────────────────────────────────────────────────────────────────────

export function AssessmentView() {
  const router = useRouter();
  const { lang } = useApp();
  const { studentId: sessionStudentId, role: sessionRole, isLoading: sessionLoading } = useSession();
  const ar = lang === "ar";
  /** Students act as themselves via the session claim. */
  const effectiveStudentId = sessionStudentId || null;

  const [phase, setPhase] = useState<Phase>("intro");
  /** True while the exam has not started (intro preview / module list). */
  const [specInput, setSpecInput] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [needSpecialty, setNeedSpecialty] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [previewTotal, setPreviewTotal] = useState(47);
  const [modules, setModules] = useState<ModuleBrief[]>([]);
  const [loadingStart, setLoadingStart] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [startModuleCode, setStartModuleCode] = useState<string | null>(null);
  /** Module currently being regenerated after an AI generation failure. */
  const [retryingCode, setRetryingCode] = useState<string | null>(null);
  /** Per-module retry error — only shown on the module it belongs to. */
  const [retryError, setRetryError] = useState<{ code: string; message: string } | null>(null);
  // ISC-QA-008: single activeCode state — header and content always derived
  // from the same object in one React commit, eliminating the 1–1.5 s race
  // where the question number updated before the scenario/options panel.
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [scoring, setScoring] = useState(false);
  const [scoreProgress, setScoreProgress] = useState<{ done: number; total: number } | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  /** Draft answers keyed by module code — restored on Back / jump. */
  const [answers, setAnswers] = useState<Record<string, string>>({});
  /** Flagged for later review — yellow in the navigator. */
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  /** Per-question scores kept quietly until the final report. */
  const [savedResults, setSavedResults] = useState<ScoreResult[]>([]);
  const [completedCodes, setCompletedCodes] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [flagConfirmOpen, setFlagConfirmOpen] = useState(false);
  const [unansweredOpen, setUnansweredOpen] = useState(false);
  const [unansweredNumbers, setUnansweredNumbers] = useState<number[]>([]);
  const [pendingUnansweredSnap, setPendingUnansweredSnap] = useState<Record<
    string,
    string
  > | null>(null);
  const [pendingSubmitAnswers, setPendingSubmitAnswers] = useState<Record<
    string,
    string
  > | null>(null);

  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  /** Deep-link id for this attempt's detailed report on /student/results/[id]. */
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [prepareProgress, setPrepareProgress] = useState<{ done: number; total: number } | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  /** Wall-clock exam start — remaining time is derived from this (survives refresh). */
  const [examStartedAtMs, setExamStartedAtMs] = useState<number | null>(null);
  const examStartedAtRef = useRef<number | null>(null);
  const sessionRestoredRef = useRef(false);

  const responseRef = useRef(response);
  const answersRef = useRef(answers);
  const flaggedRef = useRef(flagged);
  const scoringRef = useRef(scoring);
  const timedOutRef = useRef(false);
  const finishingRef = useRef(false);
  const phaseRef = useRef(phase);
  const currentModuleRef = useRef<ModuleBrief | null>(null);
  const specializationRef = useRef(specialization);
  const studentIdRef = useRef(effectiveStudentId);
  const attemptIdRef = useRef<string | null>(null);
  const flatModulesRef = useRef<ModuleBrief[]>([]);
  /** Last successfully scored answer text per module — Finish skips unchanged. */
  const lastScoredTextRef = useRef<Record<string, string>>({});
  const savedResultsRef = useRef<ScoreResult[]>([]);
  /** Cached modules payload for Start click (loaded at intro, applied only on Start). */
  const modulesPayloadRef = useRef<ModulesResponse | null>(null);
  const prewarmStartedRef = useRef(false);
  /** In-flight background AI scores keyed by module code. */
  const inflightScoresRef = useRef<
    Map<string, { text: string; promise: Promise<void>; abort: AbortController }>
  >(new Map());
  /** Generation counter — discard stale results when the answer changes mid-flight. */
  const scoreGenerationRef = useRef<Record<string, number>>({});
  const bgActiveRef = useRef(0);
  const bgWaitersRef = useRef<Array<() => void>>([]);
  const scoreAndPersistRef = useRef<
    (module: ModuleBrief, text: string, opts?: { signal?: AbortSignal; generation?: number }) => Promise<boolean>
  >(async () => false);
  /** Cached Arabic translations: { [moduleCode]: { scenario, scenarioAr, … } }. */
  const translationCacheRef = useRef<
    Record<string, { scenario: string; scenarioAr: string; instructionsAr: string | null; choicesAr: string[] | null }>
  >({});
  /** Module codes with a translation request in flight — prevents duplicate calls. */
  const inFlightTranslationsRef = useRef<Set<string>>(new Set());

  // Load the Arabic translation cache once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AR_TRANSLATION_CACHE_KEY);
      if (raw) translationCacheRef.current = JSON.parse(raw) ?? {};
    } catch { /* private mode / storage unavailable */ }
  }, []);

  useEffect(() => {
    responseRef.current = response;
  }, [response]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    flaggedRef.current = flagged;
  }, [flagged]);
  useEffect(() => {
    scoringRef.current = scoring;
  }, [scoring]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    specializationRef.current = specialization;
  }, [specialization]);
  useEffect(() => {
    studentIdRef.current = effectiveStudentId;
  }, [effectiveStudentId]);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);
  useEffect(() => {
    savedResultsRef.current = savedResults;
  }, [savedResults]);

  // Autosave load on mount
  useEffect(() => {
    if (typeof window === "undefined" || !effectiveStudentId) return;
    try {
      const stored = window.localStorage.getItem(`iscarb:drafts:${effectiveStudentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnswers(parsed);
        answersRef.current = parsed;
      }
    } catch { }
  }, [effectiveStudentId]);

  // Optional deep-link: startModule only (specialty comes from Student.program).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const startMod = params.get("startModule");
    if (startMod && startMod.trim()) {
      setStartModuleCode(startMod.trim());
    }
  }, []);

  // Restore in-progress exam from sessionStorage (timer start persists across refresh).
  // Otherwise load specialty preview for the start gate — do NOT begin the exam yet.
  useEffect(() => {
    if (sessionRestoredRef.current) return;
    if (!effectiveStudentId) return;
    sessionRestoredRef.current = true;

    const session = loadExamSession();
    if (
      session &&
      Array.isArray(session.modules) &&
      session.modules.length > 0 &&
      (!session.studentId || session.studentId === effectiveStudentId)
    ) {
      const mods = prepareExamModules(session.modules as ModuleBrief[]);
      const left = computeSecondsLeft(session.startedAtMs, session.durationMinutes);
      setSpecialization(session.specialization);
      setSpecInput(session.specialization);
      setModules(mods);
      setAnswers(session.answers);
      answersRef.current = session.answers;
      setFlagged(session.flagged);
      flaggedRef.current = session.flagged;
      setActiveCode(session.activeCode ?? null);
      // Restore the attempt id so scoring targets the same validated set the
      // student saw — never the latest in-progress attempt (which may still be
      // preparing → 409 "Validated question not ready").
      if (session.attemptId) {
        attemptIdRef.current = session.attemptId;
        setAttemptId(session.attemptId);
      }
      // Legacy sessions stored dimIdx/modIdx — derive activeCode from them.
      if (!session.activeCode && typeof session.dimIdx === "number" && typeof session.modIdx === "number") {
        const dimMap2: Record<string, ModuleBrief[]> = {};
        for (const id of DIM_ORDER) dimMap2[id] = [];
        for (const m of mods) {
          const key = m.dimension in dimMap2 ? m.dimension : "core_professionalism";
          dimMap2[key].push(m);
        }
        const active2 = DIM_ORDER.filter((id) => (dimMap2[id] ?? []).length > 0);
        const dimId2 = active2[session.dimIdx] ?? active2[0];
        const dimMods2 = dimId2 ? dimMap2[dimId2] ?? [] : [];
        const mod2 = dimMods2[session.modIdx] ?? dimMods2[0] ?? null;
        if (mod2) setActiveCode(mod2.code);
      }
    }

    if (phaseRef.current !== "intro") return;
    // Show the intro screen instantly — fire-and-forget the API call.
    // The UI renders StartReadyPanel immediately; data populates in background.
    void loadIntroPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveStudentId]);

  const modulesByDim = useMemo(() => {
    const map: Record<string, ModuleBrief[]> = {};
    for (const id of DIM_ORDER) map[id] = [];
    for (const m of modules) {
      const key = m.dimension in map ? m.dimension : "core_professionalism";
      map[key].push(m);
    }
    return map;
  }, [modules]);

  const activeDims = useMemo(
    () => DIM_ORDER.filter((id) => (modulesByDim[id] ?? []).length > 0),
    [modulesByDim],
  );

  /** Flat sequence matching dimension order — used for navigator jumps. */
  const flatModules = useMemo(() => {
    const list: ModuleBrief[] = [];
    for (const id of activeDims) {
      list.push(...(modulesByDim[id] ?? []));
    }
    return list;
  }, [activeDims, modulesByDim]);

  // ISC-QA-008: currentModule is derived atomically from activeCode — a single
  // state value. React commits the entire derived tree in one render, so the
  // question number (from currentFlatIndex) and the content panel (from
  // currentModule) can never show different questions simultaneously.
  const currentModule = useMemo(
    () => flatModules.find((m) => m.code === activeCode) ?? flatModules[0] ?? null,
    [flatModules, activeCode],
  );
  const currentDimId = currentModule
    ? (Object.keys(modulesByDim).find((id) =>
      modulesByDim[id]?.some((m) => m.code === currentModule.code)
    ) ?? null)
    : null;
  const currentDimMeta = DIMENSIONS.find((d) => d.id === currentDimId);

  useEffect(() => {
    flatModulesRef.current = flatModules;
  }, [flatModules]);

  useEffect(() => {
    currentModuleRef.current = currentModule;
  }, [currentModule]);

  const currentFlatIndex = useMemo(() => {
    if (!currentModule) return 0;
    const idx = flatModules.findIndex((m) => m.code === currentModule.code);
    return idx >= 0 ? idx : 0;
  }, [flatModules, currentModule]);


  const totalModules = flatModules.length;
  /** Answered = non-empty draft (includes current textarea). */
  const answeredCodes = useMemo(() => {
    const map = { ...answers };
    if (currentModule) map[currentModule.code] = response;
    return new Set(
      Object.entries(map)
        .filter(([, text]) => text.trim().length > 0)
        .map(([code]) => code),
    );
  }, [answers, currentModule, response]);

  const completedCount = answeredCodes.size;
  const overallProgress = totalModules
    ? Math.round((completedCount / totalModules) * 100)
    : 0;
  const questionNumber = currentFlatIndex + 1;

  const warnLow =
    secondsLeft != null &&
    totalSeconds != null &&
    secondsLeft > 0 &&
    (secondsLeft <= WARN_SECONDS_FLOOR || secondsLeft <= Math.ceil(totalSeconds * 0.1));

  function persistCurrentInto(
    base?: Record<string, string>,
  ): Record<string, string> {
    const next = { ...(base || answersRef.current) };
    if (currentModuleRef.current) next[currentModuleRef.current.code] = responseRef.current;
    setAnswers(next);
    answersRef.current = next;

    if (typeof window !== "undefined" && effectiveStudentId) {
      window.localStorage.setItem(`iscarb:drafts:${effectiveStudentId}`, JSON.stringify(next));
    }

    return next;
  }

  function goToFlatIndex(index: number, answersSnap: Record<string, string>) {
    const target = flatModules[index];
    if (!target) return;
    // Atomic navigation (QA-008): a single activeCode drives both the question
    // number and the content panel — header and body can never desync.
    setActiveCode(target.code);
    setResponse(answersSnap[target.code] ?? "");
    setScoreError(null);
    setSubmitError(null);
  }

  const finishAndShowProfile = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    clearExamSession();
    examStartedAtRef.current = null;
    setExamStartedAtMs(null);
    setSecondsLeft(null);
    const studentId = studentIdRef.current;
    if (!studentId) {
      setPhase("done");
      finishingRef.current = false;
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    setPhase("done");
    try {
      const res = await fetch("/api/iscarb/assessment/profile", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
        body: JSON.stringify({
          studentId,
          specialization: specializationRef.current,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Profile failed (${res.status})`);
      }
      const json = await res.json();
      setProfile(json.profile as ProfileResult);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Could not compute profile");
    } finally {
      setProfileLoading(false);
      finishingRef.current = false;
    }
  }, []);

  const scoreAndPersist = useCallback(
    async (
      module: ModuleBrief,
      text: string,
      opts?: { signal?: AbortSignal; generation?: number; healed?: boolean },
    ): Promise<boolean> => {
      // Ensure an attempt exists before scoring: restored sessions can be
      // missing the id (pre-persistence snapshot), and a freshly started exam
      // may not have returned it yet. POST /attempt creates-or-reuses the
      // student's in-progress attempt; without it the score route 400s.
      let attemptId = attemptIdRef.current;
      if (!attemptId) {
        try {
          const resolveRes = await fetch(`/api/iscarb/assessment/attempt`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ specialization: specializationRef.current }),
          });
          if (resolveRes.ok) {
            const resolveData = (await resolveRes.json()) as { attemptId?: string };
            if (resolveData.attemptId) {
              attemptId = resolveData.attemptId;
              attemptIdRef.current = attemptId;
              setAttemptId(attemptId);
            }
          }
        } catch {
          /* backend fallback will retry the lookup below */
        }
      }
      const payload = JSON.stringify({
        specialization: specializationRef.current,
        moduleCode: module.code,
        response: text,
        selectedIndex: Array.isArray(module.choices)
          ? (() => {
            const i = module.choices.indexOf(text);
            return i >= 0 ? i : undefined;
          })()
          : undefined,
        studentId: studentIdRef.current || undefined,
        attemptId: attemptId || undefined,
        validate: false,
      });

      let res: Response | null = null;
      let lastErr: unknown = null;
      let lastAborted = false;
      for (let attempt = 0; attempt <= SCORE_NETWORK_RETRIES; attempt++) {
        if (opts?.signal?.aborted) {
          throw new DOMException("Scoring aborted", "AbortError");
        }
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        opts?.signal?.addEventListener("abort", onAbort, { once: true });
        const timer = window.setTimeout(() => controller.abort(), SCORE_REQUEST_TIMEOUT_MS);
        try {
          res = await fetch("/api/iscarb/assessment/score", {
            method: "POST",
            headers: authHeaders({
              "Content-Type": "application/json",
              Accept: "application/json",
            }),
            body: payload,
            signal: controller.signal,
          });
          break;
        } catch (err) {
          lastErr = err;
          lastAborted = controller.signal.aborted;
          if (opts?.signal?.aborted) throw err;
        } finally {
          window.clearTimeout(timer);
          opts?.signal?.removeEventListener("abort", onAbort);
        }
        if (attempt < SCORE_NETWORK_RETRIES) await sleep(1500 * (attempt + 1));
      }

      if (!res) {
        throw new Error(
          lastAborted
            ? `Scoring timed out after ${Math.round(SCORE_REQUEST_TIMEOUT_MS / 1000)}s for ${module.code}`
            : `Lost connection to the scoring service while submitting ${module.code}`,
          { cause: lastErr },
        );
      }

      // Stale: candidate changed the answer while this request was in flight.
      if (
        (opts?.generation != null && scoreGenerationRef.current[module.code] !== opts.generation) ||
        (answersRef.current[module.code] ?? "").trim() !== text.trim()
      ) {
        return false;
      }

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; score?: number; source?: string };
        if (typeof j.score === "number") {
          const result = j as unknown as ScoreResult;
          recordScoredText(lastScoredTextRef.current, module.code, text);
          setSavedResults((prev) => {
            const without = prev.filter((r) => r.moduleCode !== module.code);
            return [...without, result];
          });
          setCompletedCodes((prev) => (prev.includes(module.code) ? prev : [...prev, module.code]));
          return true;
        }
        // 409 "Validated question not ready": the attemptId we sent is stale
        // (regenerated set / another specialty's attempt). 400 "attemptId is
        // required": a restored session had no attempt id and the backend
        // couldn't resolve one. Self-heal: re-resolve the attempt id for the
        // current specialty and retry ONCE (bounded — never a loop).
        const healable =
          (res.status === 409 && /validated question not ready/i.test(j.error || "")) ||
          (res.status === 400 && /attemptId is required/i.test(j.error || ""));
        if (healable && !opts?.healed) {
          const healRes = await fetch(`/api/iscarb/assessment/attempt`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ specialization: specializationRef.current }),
          });
          if (healRes.ok) {
            const healData = (await healRes.json()) as { attemptId?: string };
            if (healData.attemptId) {
              attemptIdRef.current = healData.attemptId;
              setAttemptId(healData.attemptId);
              return scoreAndPersist(module, text, { ...opts, healed: true });
            }
          }
        }
        throw new Error(j.error || `Scoring failed (${res.status})`);
      }
      const result = (await res.json()) as ScoreResult;
      // Re-check staleness after JSON parse (answer may have changed).
      if (
        (opts?.generation != null && scoreGenerationRef.current[module.code] !== opts.generation) ||
        (answersRef.current[module.code] ?? "").trim() !== text.trim()
      ) {
        return false;
      }
      recordScoredText(lastScoredTextRef.current, module.code, text);
      setSavedResults((prev) => {
        const without = prev.filter((r) => r.moduleCode !== module.code);
        return [...without, result];
      });
      setCompletedCodes((prev) => (prev.includes(module.code) ? prev : [...prev, module.code]));
      return true;
    },
    [],
  );

  scoreAndPersistRef.current = scoreAndPersist;

  async function acquireBgSlot() {
    if (bgActiveRef.current < SCORE_AI_CONCURRENCY) {
      bgActiveRef.current++;
      return;
    }
    await new Promise<void>((resolve) => {
      bgWaitersRef.current.push(() => {
        bgActiveRef.current++;
        resolve();
      });
    });
  }

  function releaseBgSlot() {
    bgActiveRef.current = Math.max(0, bgActiveRef.current - 1);
    const next = bgWaitersRef.current.shift();
    if (next) next();
  }

  /**
   * Score this answer with AI in the background as the candidate progresses.
   * Re-select / edit bumps generation and aborts the prior in-flight call for
   * that module so the stored score always matches the final answer.
   */
  function enqueueBackgroundScore(mod: ModuleBrief, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (lastScoredTextRef.current[mod.code] === trimmed) return;

    const prev = inflightScoresRef.current.get(mod.code);
    if (prev && prev.text === trimmed) return; // already scoring this exact text
    if (prev) prev.abort.abort();

    const generation = (scoreGenerationRef.current[mod.code] ?? 0) + 1;
    scoreGenerationRef.current[mod.code] = generation;
    const abort = new AbortController();

    const promise = (async () => {
      await acquireBgSlot();
      try {
        if (abort.signal.aborted) return;
        if ((answersRef.current[mod.code] ?? "").trim() !== trimmed) return;
        await scoreAndPersistRef.current(mod, trimmed, {
          signal: abort.signal,
          generation,
        });
      } catch (err) {
        if (abort.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(`Background AI score failed for ${mod.code}:`, err);
      } finally {
        releaseBgSlot();
        const cur = inflightScoresRef.current.get(mod.code);
        if (cur?.text === trimmed) inflightScoresRef.current.delete(mod.code);
      }
    })();

    inflightScoresRef.current.set(mod.code, { text: trimmed, promise, abort });
  }

  /**
   * Freeze answers and hand off to /student/results/[id] for scoring + report.
   * Exam view does not wait for AI scoring — Building Report lives on results.
   */
  const submitAllAnswers = useCallback(
    async (snap: Record<string, string>) => {
      // A manual submit and the timer's auto-submit can both land here.
      if (scoringRef.current) return;
      setScoring(true);
      scoringRef.current = true;
      setScoreError(null);
      setSubmitError(null);
      setFlagConfirmOpen(false);
      setPendingSubmitAnswers(null);
      setScoreProgress(null);
      try {
        const list = flatModulesRef.current;
        const answered = list.filter((mod) => (snap[mod.code] ?? "").trim().length > 0);
        if (answered.length === 0) {
          setSubmitError(
            "You must answer at least one question to submit the assessment and generate a profile.",
          );
          setScoring(false);
          scoringRef.current = false;
          return;
        }

        const studentId = studentIdRef.current;
        if (!studentId) {
          setSubmitError("Your session expired. Please sign in again, then submit.");
          setScoring(false);
          scoringRef.current = false;
          return;
        }

        // Cancel in-flight mid-exam scores; results page will catch up from lastScoredText.
        for (const job of inflightScoresRef.current.values()) {
          job.abort.abort();
        }
        inflightScoresRef.current.clear();

        try {
          window.localStorage.setItem(`iscarb:drafts:${studentId}`, JSON.stringify(snap));
        } catch {
          /* ignore */
        }

        const attemptId = attemptIdRef.current || (await (async () => {
          const res = await fetch("/api/iscarb/assessment/attempt", {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ specialization: specializationRef.current }),
          });
          const json = (await res.json().catch(() => ({}))) as { attemptId?: string };
          if (json.attemptId) {
            attemptIdRef.current = json.attemptId;
            setAttemptId(json.attemptId);
          }
          return json.attemptId || createAttemptId();
        })());
        saveReportBuildJob({
          version: 1,
          attemptId,
          studentId,
          specialization: specializationRef.current,
          timedOut: timedOutRef.current,
          modules: list.map((m) => ({
            code: m.code,
            title: m.title,
            titleAr: m.titleAr,
            dimension: m.dimension,
            scenario: m.scenario,
            instructions: m.instructions,
            questionType: m.questionType,
            choices: m.choices,
          })),
          answers: { ...snap },
          lastScoredText: { ...lastScoredTextRef.current },
          savedResults: savedResultsRef.current.map((r) => ({
            moduleCode: r.moduleCode,
            moduleTitle: r.moduleTitle,
            dimension: r.dimension,
            score: r.score,
            band: r.band,
            passed: r.passed,
            feedback: r.feedback,
            strengths: r.strengths,
            improvements: r.improvements,
            perCriterion: r.perCriterion,
            source: r.source,
          })),
          status: "pending",
          error: null,
          progress: null,
          createdAt: new Date().toISOString(),
        });

        clearExamSession();
        examStartedAtRef.current = null;
        setExamStartedAtMs(null);
        setSecondsLeft(null);

        router.push(`/student/results/${attemptId}`);
      } catch (e) {
        setSubmitError(
          e instanceof Error ? e.message : "Could not submit the assessment. Please try again.",
        );
        setScoring(false);
        scoringRef.current = false;
      }
    },
    [router],
  );

  const handleTimeUp = useCallback(async () => {
    if (timedOutRef.current || phaseRef.current !== "assess") return;
    timedOutRef.current = true;
    setTimedOut(true);
    setSecondsLeft(0);
    setFlagConfirmOpen(false);
    setUnansweredOpen(false);
    setUnansweredNumbers([]);
    setPendingUnansweredSnap(null);
    setPendingSubmitAnswers(null);
    setSubmitError(null);

    // Persist current textarea without empty/flag gates — auto-submit as-is.
    const snap = { ...answersRef.current };
    const mod = currentModuleRef.current;
    if (mod) snap[mod.code] = responseRef.current;
    setAnswers(snap);
    answersRef.current = snap;

    // A submit already in flight will finish the attempt on its own.
    if (scoringRef.current) return;
    await submitAllAnswers(snap);
  }, [submitAllAnswers]);

  // Deadline-based countdown from stored start — does not reset on question nav.
  useEffect(() => {
    if (phase !== "assess" || examStartedAtMs == null) return;
    const tick = () => {
      const left = computeSecondsLeft(examStartedAtMs, ASSESSMENT_DURATION_MINUTES);
      setSecondsLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [phase, examStartedAtMs]);

  // Persist exam + start time so refresh cannot reset the clock to 45:00.
  useEffect(() => {
    if (phase !== "assess" || examStartedAtMs == null || modules.length === 0) return;
    const snapAnswers = { ...answers };
    if (currentModule) snapAnswers[currentModule.code] = response;
    const payload: ExamTimerSessionV1 = {
      version: 1,
      startedAtMs: examStartedAtMs,
      durationMinutes: ASSESSMENT_DURATION_MINUTES,
      specialization,
      studentId: effectiveStudentId,
      modules,
      answers: snapAnswers,
      flagged,
      activeCode: currentModule?.code ?? null,
      attemptId: attemptIdRef.current ?? null,
      completedCodes,
      savedResults,
      lastScoredText: lastScoredTextRef.current,
    };
    saveExamSession(payload);
  }, [
    phase,
    examStartedAtMs,
    modules,
    answers,
    response,
    currentModule,
    flagged,
    completedCodes,
    savedResults,
    specialization,
    effectiveStudentId,
  ]);

  // Graceful timeout: save in-progress answer, then finish → report.
  useEffect(() => {
    if (phase === "assess" && secondsLeft === 0 && examStartedAtMs != null && !timedOutRef.current) {
      void handleTimeUp();
    }
  }, [phase, secondsLeft, examStartedAtMs, handleTimeUp]);

  // Polling for generating modules
  useEffect(() => {
    if (phase !== "assess") return;
    const hasGenerating = modules.some((m) => m.contentSource === "generating_in_background");
    if (!hasGenerating) return;

    let mounted = true;
    const interval = window.setInterval(async () => {
      try {
        const spec = specializationRef.current || "";
        const endpoint = spec
          ? `/api/iscarb/assessment/modules?specialization=${encodeURIComponent(spec)}`
          : `/api/iscarb/assessment/modules`;
        const res = await fetch(endpoint, { headers: authHeaders() });
        if (!res.ok) return;
        const body = (await res.json()) as ModulesResponse;
        if (body.modules && mounted) {
          setModules((prev) => {
            const freshMap = new Map(body.modules.map(m => [m.code, markMcqLoaded(m)]));
            let changed = false;
            const next = prev.map(m => {
              const fresh = freshMap.get(m.code);
              // Only update if the content source changed from background to ready
              if (fresh && fresh.contentSource !== m.contentSource) {
                changed = true;
                return { ...m, ...fresh, loaded: true };
              }
              return m;
            });
            return changed ? next : prev;
          });
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 3000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [phase, modules]);

  // JIT Translation for Live AI questions — the active question translates
  // first, then the next few are prefetched in the background so navigation is
  // instant. Results are cached in localStorage (keyed by scenario text) so
  // revisits and refreshes never re-translate.
  useEffect(() => {
    if (phase !== "assess" || lang !== "ar") return;

    // 1. Apply any cached translations immediately — no AI call needed.
    let cachedChanged = false;
    const withCache = modules.map((m) => {
      const cached = translationCacheRef.current[m.code];
      if (cached && cached.scenario === m.scenario && !m.scenarioAr && m.scenario) {
        cachedChanged = true;
        return { ...m, ...cached };
      }
      return m;
    });
    if (cachedChanged) setModules(withCache);

    // 2. Live_ai modules that still need Arabic (placeholders have no scenario).
    const untranslated = withCache.filter(
      (m) => m.contentSource === "live_ai" && m.scenario && !m.scenarioAr,
    );
    if (untranslated.length === 0) return;

    // Active question first, then the next few in exam order.
    const targetList = [
      ...(currentModule ? [currentModule] : []),
      ...untranslated.filter((m) => m.code !== currentModule?.code),
    ].slice(0, AR_TRANSLATE_PREFETCH);

    for (const mod of targetList) {
      if (inFlightTranslationsRef.current.has(mod.code)) continue;
      inFlightTranslationsRef.current.add(mod.code);
      void (async () => {
        try {
          const res = await fetch("/api/iscarb/assessment/translate", {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              scenario: mod.scenario,
              instructions: mod.instructions,
              choices: mod.choices,
            }),
          });
          if (!res.ok) return;
          const translated = await res.json();
          if (translated.scenarioAr) {
            const entry = {
              scenario: mod.scenario,
              scenarioAr: translated.scenarioAr,
              instructionsAr: translated.instructionsAr ?? null,
              choicesAr: translated.choicesAr ?? null,
            };
            translationCacheRef.current[mod.code] = entry;
            try {
              window.localStorage.setItem(
                AR_TRANSLATION_CACHE_KEY,
                JSON.stringify(translationCacheRef.current),
              );
            } catch { /* storage full / private mode */ }
            setModules((prev) =>
              prev.map((m) => (m.code === mod.code ? { ...m, ...entry } : m)),
            );
          }
        } catch (err) {
          // ignore translation errors
        } finally {
          inFlightTranslationsRef.current.delete(mod.code);
        }
      })();
    }
  }, [phase, modules, lang]);

  /** Background: wait for the up-front validated set (never generate mid-exam). */
  async function prewarmModules(spec: string) {
    if (prewarmStartedRef.current || !spec) return;
    prewarmStartedRef.current = true;
    try {
      const deadline = Date.now() + 25 * 60_000;
      while (Date.now() < deadline && phaseRef.current === "intro") {
        const res = await fetch(
          `/api/iscarb/assessment/modules?specialization=${encodeURIComponent(spec)}`,
          { headers: authHeaders() },
        );
        const body = (await res.json().catch(() => ({}))) as ModulesResponse;
        if (typeof body.attemptId === "string" && body.attemptId) {
          attemptIdRef.current = body.attemptId;
          setAttemptId(body.attemptId);
        }
        if (res.status === 202 || body.preparing) {
          if (body.progress) setPrepareProgress(body.progress);
          await new Promise((r) => window.setTimeout(r, 2000));
          continue;
        }
        if (
          res.ok &&
          Array.isArray(body.modules) &&
          body.modules.length > 0 &&
          (body.specialization || spec) === specializationRef.current &&
          phaseRef.current === "intro"
        ) {
          modulesPayloadRef.current = body;
          setPrepareProgress(null);
        }
        return;
      }
    } catch {
      // Start will poll until ready.
    }
  }

  async function loadIntroPreview() {
    setStartError(null);
    setNeedSpecialty(false);
    prewarmStartedRef.current = false;
    modulesPayloadRef.current = null;

    // Show intro screen instantly — do NOT set loadingStart here on first load.
    // Only show spinner on explicit retry (when introReady is already false).
    const showSpinner = !introReady;
    if (showSpinner) setLoadingStart(true);

    try {
      const currentSpec = specializationRef.current || "";
      const endpoint = currentSpec
        ? `/api/iscarb/assessment/modules?specialization=${encodeURIComponent(currentSpec)}&mode=preview`
        : `/api/iscarb/assessment/modules?mode=preview`;

      const res = await fetch(endpoint, {
        headers: authHeaders(),
      });
      const json = (await res.json().catch(() => ({}))) as ModulesResponse & {
        details?: { code?: string };
        error?: string;
      };
      if (!res.ok) {
        const code = json.details?.code;
        if (res.status === 400 && (code === "NEED_SPECIALTY" || /specialty required/i.test(json.error || ""))) {
          if (json.details?.specialization) {
            setSpecInput(json.details.specialization);
          }
          setNeedSpecialty(true);
          setStartError(null);
          return;
        }
        throw new Error(json.error || `Could not load exam preview (${res.status})`);
      }
      modulesPayloadRef.current = json;
      const spec = json.specialization || currentSpec || "";
      setSpecialization(spec);
      setSpecInput(spec);
      setPreviewTotal(json.counts?.total ?? json.modules?.length ?? 47);
      setIntroReady(true);
      // Fire-and-forget: start AI generation in the background now.
      void prewarmModules(spec);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to load exam preview");
    } finally {
      setLoadingStart(false);
    }
  }

  /** User clicked Start Exam — wait for the validated set if needed, then begin. */
  async function startExam() {
    setLoadingStart(true);
    setStartError(null);
    try {
      let json = modulesPayloadRef.current;
      if (!json?.modules?.length) {
        const currentSpec = specializationRef.current || "";
        const endpoint = currentSpec
          ? `/api/iscarb/assessment/modules?specialization=${encodeURIComponent(currentSpec)}`
          : `/api/iscarb/assessment/modules`;
        const deadline = Date.now() + 25 * 60_000;
        while (Date.now() < deadline) {
          const res = await fetch(endpoint, { headers: authHeaders() });
          const body = (await res.json().catch(() => ({}))) as ModulesResponse & {
            details?: { code?: string };
            error?: string;
          };
          if (typeof body.attemptId === "string" && body.attemptId) {
            attemptIdRef.current = body.attemptId;
            setAttemptId(body.attemptId);
          }
          if (res.status === 400) {
            const code = body.details?.code;
            if (code === "NEED_SPECIALTY" || /specialty required/i.test(body.error || "")) {
              setNeedSpecialty(true);
              setIntroReady(false);
              return;
            }
          }
          if (res.status === 202 || body.preparing) {
            if (body.progress) setPrepareProgress(body.progress);
            // Poll every 3s until the exam set is fully ready.
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          if (!res.ok) {
            throw new Error(body.error || `Could not load modules (${res.status})`);
          }
          json = body;
          modulesPayloadRef.current = body;
          break;
        }
      }
      if (!json?.modules?.length) {
        throw new Error("Exam questions are still being prepared. Please try again in a moment.");
      }
      await applyLoadedModules(json, json.specialization || specializationRef.current || "");
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setLoadingStart(false);
    }
  }

  async function saveSpecialtyAndContinue() {
    const spec = specInput.trim();
    if (!spec || isGenericSpecialization(spec)) {
      setStartError(ar ? "أدخل تخصصاً صالحاً" : "Enter a valid specialty");
      return;
    }
    setLoadingStart(true);
    setStartError(null);
    try {
      const saveRes = await fetch(`/api/iscarb/assessment/specialty`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ specialty: spec }),
      });
      if (!saveRes.ok) {
        if (saveRes.status !== 401 && saveRes.status !== 403 && saveRes.status !== 404) {
          const err = await saveRes.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Could not save specialty");
        }
        // If 401/403/404, they are likely an Admin previewing the assessment. 
        // We just set the state and continue without saving to the DB.
      }

      setSpecialization(spec);
      specializationRef.current = spec;
      setNeedSpecialty(false);
      await loadIntroPreview();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to save specialty");
      setLoadingStart(false);
    }
  }

  async function applyLoadedModules(json: ModulesResponse, spec: string) {
    const loaded = json.modules ?? [];
    const secs = ASSESSMENT_DURATION_SECONDS;
    const startedAt = Date.now();
    setSpecialization(json.specialization || spec);
    setSpecInput(json.specialization || spec);

    // One-time prep: shuffle + resolve every MCQ from curated/pregen. No live AI.
    const shuffled = prepareExamModules(shuffleModulesWithSeed(loaded, Date.now()));
    if (!isExamSetReady(shuffled)) {
      throw new Error(
        ar
          ? "تعذر تجهيز أسئلة التقييم. حاول مرة أخرى."
          : "Could not prepare the exam questions. Please try again.",
      );
    }

    // Yield so the "Preparing your exam…" UI can paint before we enter assess.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    setModules(shuffled);
    setActiveCode(startModuleCode ?? null);
    setResponse("");
    setAnswers({});
    answersRef.current = {};
    setFlagged({});
    flaggedRef.current = {};
    setSavedResults([]);
    setCompletedCodes([]);
    lastScoredTextRef.current = {};
    scoreGenerationRef.current = {};
    for (const job of inflightScoresRef.current.values()) job.abort.abort();
    inflightScoresRef.current.clear();
    bgWaitersRef.current = [];
    bgActiveRef.current = 0;
    setSubmitError(null);
    setFlagConfirmOpen(false);
    setUnansweredOpen(false);
    setUnansweredNumbers([]);
    setPendingUnansweredSnap(null);
    setPendingSubmitAnswers(null);
    setProfile(null);
    setTimedOut(false);
    if (json.attemptId) {
      attemptIdRef.current = json.attemptId;
      setAttemptId(json.attemptId);
    }
    timedOutRef.current = false;
    finishingRef.current = false;
    examStartedAtRef.current = startedAt;
    setExamStartedAtMs(startedAt);
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setPhase("assess");
    saveExamSession({
      version: 1,
      startedAtMs: startedAt,
      durationMinutes: ASSESSMENT_DURATION_MINUTES,
      specialization: json.specialization || spec,
      studentId: effectiveStudentId,
      modules: shuffled,
      answers: {},
      flagged: {},
      activeCode: startModuleCode ?? null,
      attemptId: attemptIdRef.current ?? null,
      completedCodes: [],
      savedResults: [],
      lastScoredText: {},
    });
    if (startModuleCode) {
      setActiveCode(startModuleCode);
    }
  }

  /**
   * Regenerate ONLY the modules flagged generation_failed. The server returns
   * the full exam set with the failed module freshly generated — no default or
   * catalog content is ever served. Replace by code (order/answers preserved)
   * and persist through the existing session-save effect.
   */
  async function retryGeneration(code: string) {
    if (retryingCode) return;
    setRetryingCode(code);
    setRetryError(null);
    try {
      const currentSpec = specializationRef.current || "";
      const endpoint = currentSpec
        ? `/api/iscarb/assessment/modules?specialization=${encodeURIComponent(currentSpec)}&retry=1`
        : `/api/iscarb/assessment/modules?retry=1`;
      const res = await fetch(endpoint, { headers: authHeaders() });
      const body = (await res.json().catch(() => ({}))) as ModulesResponse & { error?: string };
      if (!res.ok) throw new Error(body.error || `Could not regenerate the question (${res.status})`);

      const fresh = (body.modules ?? []).map((m) => markMcqLoaded(m));
      const byCode = new Map(fresh.map((m) => [m.code, m]));
      const next = modules.map((m) => byCode.get(m.code) ?? m);
      setModules(next);
      if (isGenerationFailedModule(byCode.get(code) ?? next.find((m) => m.code === code) ?? null)) {
        setRetryError({
          code,
          message: ar
            ? "لا يزال توليد هذا السؤال يواجه مشكلة. أعد المحاولة بعد لحظة."
            : "This question is still failing to generate. Please retry in a moment.",
        });
      }
    } catch (err) {
      setRetryError({
        code,
        message: err instanceof Error ? err.message : "Could not regenerate the question.",
      });
    } finally {
      setRetryingCode(null);
    }
  }

  function quietScoreDraft(mod: ModuleBrief, text: string) {
    enqueueBackgroundScore(mod, text);
  }

  function attemptFinish(snap: Record<string, string>) {
    const unansweredIdx: number[] = [];
    flatModules.forEach((m, i) => {
      if (!(snap[m.code] ?? "").trim()) unansweredIdx.push(i + 1);
    });
    if (unansweredIdx.length > 0) {
      setSubmitError(null);
      setUnansweredNumbers(unansweredIdx);
      setPendingUnansweredSnap(snap);
      setUnansweredOpen(true);
      return;
    }

    const flagCount = flatModules.filter((m) => flagged[m.code]).length;
    if (flagCount > 0) {
      setPendingSubmitAnswers(snap);
      setFlagConfirmOpen(true);
      return;
    }

    void submitAllAnswers(snap);
  }

  function goToForgottenQuestion() {
    const snap = pendingUnansweredSnap ?? persistCurrentInto();
    const first = unansweredNumbers[0];
    setUnansweredOpen(false);
    setPendingUnansweredSnap(null);
    setUnansweredNumbers([]);
    if (first != null) {
      goToFlatIndex(first - 1, snap);
    }
  }

  function onUnansweredDialogOpenChange(open: boolean) {
    if (open) {
      setUnansweredOpen(true);
      return;
    }
    // Dismiss (OK / Escape / overlay) → jump to the forgotten question.
    if (pendingUnansweredSnap != null || unansweredNumbers.length > 0) {
      goToForgottenQuestion();
      return;
    }
    setUnansweredOpen(false);
  }
  function handleSave() {
    if (!currentModule) return;
    const snap = persistCurrentInto();
    const text = (snap[currentModule.code] ?? "").trim();
    if (text) {
      setScoreError(null);
      enqueueBackgroundScore(currentModule, text);
    }
  }

  async function goNextOrFinish() {
    if (!currentModule || scoring) return;
    const snap = persistCurrentInto();
    const text = (snap[currentModule.code] ?? "").trim();
    const isLast = currentFlatIndex >= totalModules - 1;

    if (text) {
      setScoreError(null);
      enqueueBackgroundScore(currentModule, text);
    }

    if (isLast) {
      attemptFinish(snap);
      return;
    }
    goToFlatIndex(currentFlatIndex + 1, snap);
  }

  function goBackQuestion() {
    if (scoring || currentFlatIndex <= 0) return;
    const snap = persistCurrentInto();
    if (currentModule) quietScoreDraft(currentModule, snap[currentModule.code] ?? "");
    goToFlatIndex(currentFlatIndex - 1, snap);
  }

  function jumpToQuestion(index: number) {
    if (scoring || index === currentFlatIndex) return;
    if (index < 0 || index >= totalModules) return;
    const snap = persistCurrentInto();
    if (currentModule) quietScoreDraft(currentModule, snap[currentModule.code] ?? "");
    goToFlatIndex(index, snap);
  }

  function toggleFlag() {
    if (!currentModule) return;
    setFlagged((prev) => {
      const next = { ...prev, [currentModule.code]: !prev[currentModule.code] };
      if (!next[currentModule.code]) delete next[currentModule.code];
      flaggedRef.current = next;
      return next;
    });
  }

  function onResponseChange(value: string) {
    setResponse(value);
    if (!currentModule) return;
    const mod = currentModule;
    setAnswers((prev) => {
      const next = { ...prev, [mod.code]: value };
      answersRef.current = next;

      if (typeof window !== "undefined" && effectiveStudentId) {
        window.localStorage.setItem(`iscarb:drafts:${effectiveStudentId}`, JSON.stringify(next));
      }

      return next;
    });
    // Background AI score as soon as an answer is selected/changed (MCQ or text).
    enqueueBackgroundScore(mod, value);
  }

  function confirmFlaggedSubmit() {
    const snap = pendingSubmitAnswers ?? persistCurrentInto();
    setPendingSubmitAnswers(null);
    setFlagConfirmOpen(false);
    void submitAllAnswers(snap);
  }

  function cancelFlaggedSubmit() {
    const snap = pendingSubmitAnswers ?? answers;
    setPendingSubmitAnswers(null);
    setFlagConfirmOpen(false);
    // Prefer first flagged question so the navigator makes sense.
    const firstFlagged = flatModules.findIndex((m) => flagged[m.code]);
    if (firstFlagged >= 0) goToFlatIndex(firstFlagged, snap);
  }

  function onFlagDialogOpenChange(open: boolean) {
    if (open) {
      setFlagConfirmOpen(true);
      return;
    }
    // Dismissed (Cancel / Escape / overlay) while a submit was pending → treat as cancel.
    if (pendingSubmitAnswers != null) {
      cancelFlaggedSubmit();
      return;
    }
    setFlagConfirmOpen(false);
  }

  function restart() {
    clearExamSession();
    examStartedAtRef.current = null;
    setExamStartedAtMs(null);
    setPhase("intro");
    setSavedResults([]);
    setResponse("");
    setAnswers({});
    answersRef.current = {};
    setFlagged({});
    flaggedRef.current = {};
    setCompletedCodes([]);
    lastScoredTextRef.current = {};
    setSubmitError(null);
    setFlagConfirmOpen(false);
    setUnansweredOpen(false);
    setUnansweredNumbers([]);
    setPendingUnansweredSnap(null);
    setPendingSubmitAnswers(null);
    setSecondsLeft(null);
    setTotalSeconds(null);
    setTimedOut(false);
    setAttemptId(null);
    timedOutRef.current = false;
    finishingRef.current = false;
    setProfile(null);
    setProfileError(null);
    setIntroReady(false);
    modulesPayloadRef.current = null;
    void loadIntroPreview();
  }

  // Persist attempt snapshot once the profile is ready so the detailed report deep-link works.
  useEffect(() => {
    if (phase !== "done" || !profile || !effectiveStudentId || attemptId) return;
    const snap = saveEmployabilityAttempt({
      studentId: effectiveStudentId,
      specialization,
      computedAt: profile.computedAt || new Date().toISOString(),
      timedOut,
      profile: {
        composite: profile.composite,
        band: profile.band,
        passed: profile.passed,
        specialization: profile.specialization,
        dimensions: profile.dimensions,
        covered: profile.covered,
        computedAt: profile.computedAt,
      },
      results: savedResults.map((r) => ({
        moduleCode: r.moduleCode,
        moduleTitle: r.moduleTitle,
        dimension: r.dimension,
        score: r.score,
        band: r.band,
        passed: r.passed,
        feedback: r.feedback,
        strengths: r.strengths,
        improvements: r.improvements,
      })),
      modules: modules.map((m) => ({
        code: m.code,
        title: m.title,
        titleAr: m.titleAr,
        dimension: m.dimension,
        scenario: m.scenario,
        instructions: m.instructions,
      })),
      answers: { ...answersRef.current },
    });
    setAttemptId(snap.id);
  }, [
    phase,
    profile,
    effectiveStudentId,
    attemptId,
    specialization,
    timedOut,
    savedResults,
    modules,
  ]);

  const flaggedCount = useMemo(
    () => flatModules.filter((m) => flagged[m.code]).length,
    [flatModules, flagged],
  );

  // Block the full UI until we know the session role.
  // useSession defaults role to "student" while loading — we must wait for the
  // real role before rendering anything interactive, otherwise a faculty user
  // can click MCQ options in the loading window and hit the student-only API.
  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iscarb-green border-t-transparent" />
      </div>
    );
  }


  return (
    <div className="relative min-h-[70vh] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <section className="bg-brand-mesh relative overflow-hidden border-b border-border/60">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-3xl px-3 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3">
            <Badge className="gap-1.5 border-iscarb-green/20 bg-iscarb-green-soft text-iscarb-green-dark hover:bg-iscarb-green-soft">
              <ClipboardCheck className="h-3.5 w-3.5" />
              {ar ? "تقييم القابلية للتوظيف" : "Employability Assessment"}
            </Badge>
          </div>

          {/* Timer + question progress during the exam */}
          {phase === "assess" ? (
            <ExamProgressChrome
              ar={ar}
              questionNumber={questionNumber}
              totalModules={totalModules}
              overallProgress={overallProgress}
              secondsLeft={secondsLeft ?? 0}
              warnLow={warnLow}
              flatModules={flatModules}
              currentFlatIndex={currentFlatIndex}
              answeredCodes={answeredCodes}
              flagged={flagged}
              onJump={jumpToQuestion}
            />
          ) : null}

          <h1
            className={cn(
              "font-display text-xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-2xl md:text-3xl",
              phase === "assess" ? "mt-2 sr-only" : "mt-1",
            )}
          >
            {phase === "intro"
              ? ar
                ? "ابدأ تقييم القابلية للتوظيف"
                : "Start your Employability Assessment"
              : phase === "assess"
                ? ar
                  ? "التقييم"
                  : "Assessment"
                : ar
                  ? "نتيجتك"
                  : "Your result"}
          </h1>
          {phase === "intro" && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {ar
                ? "تقييم سيناريوهات يجيب ملف قابليتك للتوظيف عبر أربعة أبعاد."
                : "A scenario-based assessment that builds your four-dimension employability profile."}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {needSpecialty ? (
                <SpecialtyGate
                  ar={ar}
                  specInput={specInput}
                  setSpecInput={setSpecInput}
                  loading={loadingStart}
                  error={startError}
                  onSave={saveSpecialtyAndContinue}
                />
              ) : startError && !introReady ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 px-6 py-16 text-center">
                  <p className="text-sm font-medium text-destructive">{startError}</p>
                  <Button type="button" onClick={() => void loadIntroPreview()} className="cursor-pointer">
                    {ar ? "إعادة المحاولة" : "Retry"}
                  </Button>
                </div>
              ) : loadingStart && introReady ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 px-6 py-16 text-center">
                  <Loader2 className="size-8 animate-spin text-iscarb-green" />
                  <p className="text-base font-semibold text-iscarb-ink dark:text-white">
                    {ar ? "جارٍ تجهيز تقييمك…" : "Preparing your exam…"}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {ar
                      ? "نجهّز جميع الأسئلة مرة واحدة قبل البدء — لن يكون هناك انتظار أثناء التقييم."
                      : "Assembling all questions once before you begin — no waiting mid-exam."}
                  </p>
                  {prepareProgress ? (
                    <p className="text-xs text-muted-foreground">
                      {prepareProgress.done}/{prepareProgress.total}
                    </p>
                  ) : null}
                </div>
              ) : (
                <StartReadyPanel
                  ar={ar}
                  specialization={specialization}
                  questionCount={previewTotal}
                  durationMinutes={ASSESSMENT_DURATION_MINUTES}
                  loading={loadingStart}
                  error={startError}
                  onStart={() => void startExam()}
                />
              )}
            </motion.div>
          )}

          {phase === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ModuleListPanel
                ar={ar}
                modules={flatModules}
                onStart={() => {
                  const firstUnansweredIdx = flatModules.findIndex(m => !(answers[m.code] || "").trim());
                  if (firstUnansweredIdx > 0) {
                    goToFlatIndex(firstUnansweredIdx, answers);
                  }
                  // Real start triggers timer
                  timedOutRef.current = false;
                  finishingRef.current = false;
                  setPhase("assess");
                }}
              />
            </motion.div>
          )}

          {phase === "assess" && currentModule && currentDimMeta && (
            <motion.div
              key={currentModule.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <QuestionPanel
                ar={ar}
                dimLabel={ar ? currentDimMeta.labelAr : currentDimMeta.label}
                module={currentModule}

                response={response}
                setResponse={onResponseChange}
                scoring={scoring}
                scoreProgress={scoreProgress}
                scoreError={scoreError}
                submitError={submitError}
                flagged={Boolean(flagged[currentModule.code])}
                onToggleFlag={toggleFlag}
                canGoBack={currentFlatIndex > 0}
                onBack={goBackQuestion}
                onSave={handleSave}
                onNext={goNextOrFinish}
                isLast={currentFlatIndex >= totalModules - 1}
                retrying={retryingCode === currentModule.code}
                retryError={retryError?.code === currentModule.code ? retryError.message : null}
                onRetryGeneration={() => void retryGeneration(currentModule.code)}
              />
            </motion.div>
          )}

          {phase === "assess" && !currentModule && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {ar ? "لا توجد وحدات لهذا التخصص." : "No modules found for this specialization."}
                <div className="mt-4">
                  <Button variant="outline" onClick={restart}>
                    {ar ? "رجوع" : "Back"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <DonePanel
                ar={ar}
                loading={profileLoading}
                error={profileError}
                profile={profile}
                attemptId={attemptId}
                timedOut={timedOut}
                onRetry={() => void finishAndShowProfile()}
                onRestart={restart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={unansweredOpen} onOpenChange={onUnansweredDialogOpenChange}>
        <AlertDialogContent dir={ar ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ar ? "أسئلة بلا إجابة" : "Unanswered questions"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredNumbers.length === 1
                ? ar
                  ? `لقد نسيت السؤال رقم ${unansweredNumbers[0]}. أكمل إجابتك قبل الإرسال.`
                  : `You forgot Question ${unansweredNumbers[0]}. Please answer it before submitting.`
                : ar
                  ? `لقد نسيت الأسئلة التالية: ${unansweredNumbers.join("، ")}. سنُعيدك إلى أول سؤال ناقص.`
                  : `You forgot these questions: ${unansweredNumbers.join(", ")}. We’ll take you back to the first one.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={ar ? "sm:flex-row-reverse" : undefined}>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                goToForgottenQuestion();
              }}
              className="cursor-pointer bg-iscarb-green text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-iscarb-green-dark hover:shadow-md hover:shadow-iscarb-green/25 focus-visible:ring-2 focus-visible:ring-iscarb-green/40 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99]"
            >
              {ar ? "العودة إلى السؤال" : "Go to question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={flagConfirmOpen} onOpenChange={onFlagDialogOpenChange}>
        <AlertDialogContent dir={ar ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ar ? "أسئلة معلّمة للمراجعة" : "Flagged questions remaining"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ar
                ? `لديك ${flaggedCount} أسئلة معلّمة. هل تريد الإرسال على أي حال؟`
                : `You have ${flaggedCount} flagged question${flaggedCount === 1 ? "" : "s"}. Submit anyway?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={ar ? "sm:flex-row-reverse" : undefined}>
            <AlertDialogCancel className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-iscarb-green/40 hover:bg-iscarb-green-soft/40 hover:text-iscarb-green-dark hover:shadow-sm active:translate-y-0">
              {ar ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmFlaggedSubmit();
              }}
              className="cursor-pointer bg-iscarb-green text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-iscarb-green-dark hover:shadow-md hover:shadow-iscarb-green/25 focus-visible:ring-2 focus-visible:ring-iscarb-green/40 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99]"
            >
              {ar ? "إرسال على أي حال" : "Submit anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Timer + progress + compact question navigator */
function ExamProgressChrome({
  ar,
  questionNumber,
  totalModules,
  overallProgress,
  secondsLeft,
  warnLow,
  flatModules,
  currentFlatIndex,
  answeredCodes,
  flagged,
  onJump,
}: {
  ar: boolean;
  questionNumber: number;
  totalModules: number;
  overallProgress: number;
  secondsLeft: number;
  warnLow: boolean;
  flatModules: ModuleBrief[];
  currentFlatIndex: number;
  answeredCodes: Set<string>;
  flagged: Record<string, boolean>;
  onJump: (index: number) => void;
}) {
  const mins = Math.floor(Math.max(0, secondsLeft) / 60);
  const secs = Math.max(0, secondsLeft) % 60;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-iscarb-green/20 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-iscarb-green-dark shadow-sm backdrop-blur-sm sm:gap-2 sm:px-3 sm:text-xs dark:bg-card/70 dark:text-iscarb-green">
          <span className="tabular-nums">
            {ar
              ? `سؤال ${Math.min(questionNumber, totalModules)} من ${totalModules}`
              : `Question ${Math.min(questionNumber, totalModules)} of ${totalModules}`}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="tabular-nums text-muted-foreground">{overallProgress}%</span>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold tabular-nums shadow-sm sm:px-3 sm:text-xs",
            warnLow
              ? "border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
              : "border-border/70 bg-white/80 text-iscarb-ink dark:bg-card/70 dark:text-white",
          )}
        >
          <Clock className={cn("size-3.5 shrink-0", warnLow && "text-amber-600")} />
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <div className="rounded-full border border-iscarb-green/15 bg-white/50 p-1 shadow-sm backdrop-blur-sm sm:p-1.5 dark:bg-card/40">
        <Progress
          value={overallProgress}
          className="h-1.5 bg-iscarb-green-soft/60 sm:h-2"
          indicatorClassName="bg-iscarb-green rounded-full"
        />
      </div>

      {/* Compact question overview — scrollable on small screens */}
      <div
        className="max-h-[4.5rem] overflow-y-auto overscroll-contain sm:max-h-none sm:overflow-visible"
        role="navigation"
        aria-label={ar ? "نظرة على الأسئلة" : "Question overview"}
      >
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {flatModules.map((m, i) => {
            const isCurrent = i === currentFlatIndex;
            const isFlagged = Boolean(flagged[m.code]);
            const isAnswered = answeredCodes.has(m.code);
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => onJump(i)}
                title={
                  ar
                    ? `سؤال ${i + 1}${isFlagged ? " · معلّم" : isAnswered ? " · مُجاب" : ""}`
                    : `Question ${i + 1}${isFlagged ? " · flagged" : isAnswered ? " · answered" : ""}`
                }
                aria-current={isCurrent ? "step" : undefined}
                aria-label={ar ? `سؤال ${i + 1}` : `Question ${i + 1}`}
                className={cn(
                  "flex size-6 cursor-pointer items-center justify-center rounded-md text-[9px] font-bold tabular-nums transition-colors touch-manipulation sm:size-7 sm:text-[10px]",
                  isFlagged &&
                  "bg-amber-400 text-amber-950 hover:bg-amber-500 dark:bg-amber-500 dark:text-amber-950",
                  !isFlagged &&
                  isAnswered &&
                  "bg-iscarb-green text-white hover:bg-iscarb-green-dark",
                  !isFlagged &&
                  !isAnswered &&
                  "border border-border/70 bg-white/70 text-muted-foreground hover:border-iscarb-green/40 hover:text-foreground dark:bg-card/60",
                  isCurrent && "ring-2 ring-iscarb-ink/40 ring-offset-1 dark:ring-white/50",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {warnLow && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-50/80 px-3 py-2 text-[11px] leading-snug text-amber-900 sm:items-center sm:text-xs dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 sm:mt-0" />
          {ar
            ? "الوقت ينفد — احفظ إجابتك وانتقل للسؤال التالي."
            : "Time is running low — save your answer and continue."}
        </p>
      )}
    </div>
  );
}

// ── Ready-to-begin gate (specialty from profile — no picker) ────────────────

function StartReadyPanel({
  ar,
  specialization,
  questionCount,
  durationMinutes,
  loading,
  error,
  onStart,
}: {
  ar: boolean;
  specialization: string;
  questionCount: number;
  durationMinutes: number;
  loading: boolean;
  error: string | null;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-card/60 p-4 sm:space-y-6 sm:p-6 md:p-8">
      <div className="space-y-2 text-center sm:text-start">
        <h2 className="font-display text-lg font-bold text-iscarb-ink dark:text-white sm:text-xl md:text-2xl">
          {ar ? "جاهز للبدء؟" : "Ready to begin?"}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {ar
            ? "تخصصك محفوظ في ملفك. راجع التفاصيل ثم اضغط بدء عندما تكون مستعداً."
            : "Your specialty is already on your profile. Review the details, then click Start when you’re ready."}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <li className="col-span-2 flex items-start gap-3 rounded-xl border border-border/80 bg-background/80 px-3 py-2.5 sm:col-span-1 sm:px-4 sm:py-3">
          <Target className="mt-0.5 size-4 shrink-0 text-iscarb-green sm:size-5" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {ar ? "تخصصك" : "Your specialty"}
            </p>
            <p className="truncate text-sm font-semibold text-iscarb-ink dark:text-white">
              {specialization || "—"}
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/80 px-3 py-2.5 sm:px-4 sm:py-3">
          <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-iscarb-green sm:size-5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {ar ? "الأسئلة" : "Questions"}
            </p>
            <p className="text-sm font-semibold text-iscarb-ink dark:text-white">
              {ar ? `${questionCount} سؤالاً` : `${questionCount} questions`}
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/80 px-3 py-2.5 sm:px-4 sm:py-3">
          <Clock className="mt-0.5 size-4 shrink-0 text-iscarb-green sm:size-5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {ar ? "المدة" : "Time limit"}
            </p>
            <p className="text-sm font-semibold text-iscarb-ink dark:text-white">
              {ar ? `${durationMinutes} دقيقة` : `${durationMinutes} minutes`}
            </p>
          </div>
        </li>
      </ul>

      {/* Four exam categories — compact 2×2 on phone, 4-up on tablet+ */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
          {ar ? "أبعاد التقييم الأربعة" : "Four assessment categories"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {DIMENSIONS.map((d) => {
            const Icon = DIM_ICON[d.id] ?? ClipboardCheck;
            const short = DIM_SHORT_LABEL[d.id];
            const label = ar ? short?.ar ?? d.labelAr : short?.en ?? d.label;
            return (
              <div
                key={d.id}
                className="flex h-full min-h-[5.5rem] flex-col items-center rounded-xl border border-border/80 bg-background/80 px-2 py-3 text-center sm:min-h-[6rem] sm:px-2.5"
              >
                <Icon className="size-4 shrink-0 text-iscarb-green sm:size-5" aria-hidden />
                <p className="mt-1.5 flex min-h-[2.5rem] items-center justify-center text-xs font-bold leading-snug text-iscarb-ink dark:text-white sm:min-h-[2.75rem] sm:text-sm">
                  {label}
                </p>
                <p className="mt-auto pt-1 text-xs font-bold tabular-nums text-iscarb-green-dark sm:text-sm">
                  {Math.round(d.weight * 100)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <Button
        type="button"
        disabled={loading || !specialization}
        onClick={onStart}
        className="group h-12 w-full min-h-12 cursor-pointer gap-2 rounded-xl bg-iscarb-green text-sm font-bold text-white touch-manipulation hover:bg-iscarb-green/90"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {ar ? "جارٍ تجهيز تقييمك…" : "Preparing your exam…"}
          </>
        ) : (
          <>
            {ar ? "بدء التقييم" : "Start Exam"}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </div>
  );
}

// ── Edge-case specialty gate (missing Student.program only) ─────────────────

function SpecialtyGate({
  ar,
  specInput,
  setSpecInput,
  loading,
  error,
  onSave,
}: {
  ar: boolean;
  specInput: string;
  setSpecInput: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-card/60 p-4 sm:space-y-6 sm:p-6 md:p-8">
      <div className="space-y-2">
        <h2 className="font-display text-lg font-bold text-iscarb-ink dark:text-white sm:text-xl">
          {ar ? "أكمل تخصصك للمتابعة" : "Add your specialty to continue"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "لم يُحفظ تخصص على ملفك. اختر تخصصاً مرة واحدة — سيُستخدم في تقييم القابلية للتوظيف."
            : "Your profile has no specialty yet. Choose it once — it drives your Employability Exam Job-Fit questions."}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-iscarb-ink dark:text-white">
          {ar ? "تخصصك" : "Your specialty / major"}
        </label>
        <input
          value={specInput}
          onChange={(e) => setSpecInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          placeholder={
            ar ? "مثال: المحاسبة، الأمن السيبراني…" : "e.g. Accounting, Cybersecurity…"
          }
          className="h-12 w-full rounded-xl border border-input/80 bg-background px-4 text-sm shadow-sm transition-all focus-visible:border-iscarb-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-iscarb-green/10"
          dir={ar ? "rtl" : "ltr"}
        />
        <div className="flex flex-wrap gap-1.5">
          {SPEC_SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setSpecInput(q)}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                specInput.toLowerCase() === q.toLowerCase()
                  ? "border-iscarb-green bg-iscarb-green-soft text-iscarb-green-dark"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-iscarb-green/40 hover:text-foreground",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <Button
        type="button"
        disabled={loading || !specInput.trim()}
        onClick={onSave}
        className="group h-12 w-full cursor-pointer gap-2 rounded-xl bg-iscarb-green text-sm font-bold text-white"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {ar ? "جارٍ الحفظ…" : "Saving…"}
          </>
        ) : (
          <>
            {ar ? "حفظ والمتابعة" : "Save & continue"}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}

// ── Exam question ────────────────────────────────────────────────────────────

function getQuestionType(module: ModuleBrief): "mcq" {
  return getExamQuestionType(module);
}

function getDefaultChoices(module: ModuleBrief): string[] {
  return ensureFourChoices(module, module.choices);
}

function McqOptions({
  choices,
  value,
  onChange,
  disabled,
  ar,
  onAutoAdvance,
}: {
  choices: string[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  ar: boolean;
  onAutoAdvance: () => void;
}) {
  // Keyboard shortcuts 1–4 select an option (mirrors the A–D chips).
  useEffect(() => {
    if (disabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < choices.length && choices[idx]) {
        if (value === choices[idx]) return; // already selected
        e.preventDefault();
        onChange(choices[idx]!);
        setTimeout(onAutoAdvance, 600);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, value, onChange, onAutoAdvance, disabled]);

  return (
    // Options are 2–4 sentence professional strategies now — a single column
    // keeps them readable (two columns would crush long option text).
    <div className="grid grid-cols-1 gap-3 sm:gap-4" role="radiogroup" aria-label={ar ? "الخيارات" : "Options"}>
      {choices.map((choice, i) => {
        const isSelected = value === choice;
        const letter = String.fromCharCode(65 + i);
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => {
              if (disabled || isSelected) return;
              onChange(choice);
              setTimeout(onAutoAdvance, 600);
            }}
            className={cn(
              "group relative flex min-h-[3.5rem] touch-manipulation flex-col overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 sm:p-5",
              isSelected
                ? "border-iscarb-green bg-gradient-to-br from-iscarb-green-soft/40 to-transparent shadow-[0_6px_24px_-8px_rgba(26,188,156,0.45)]"
                : "border-border/60 bg-card hover:-translate-y-0.5 hover:border-iscarb-green/50 hover:bg-muted/40 hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)]",
              disabled && !isSelected && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none",
              ar && "text-right"
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-200 sm:size-9",
                  isSelected
                    ? "border-iscarb-green bg-iscarb-green text-white shadow-[0_0_0_4px_rgba(26,188,156,0.15)]"
                    : "border-border bg-muted/60 text-muted-foreground group-hover:border-iscarb-green/50 group-hover:text-iscarb-green-dark"
                )}
              >
                {letter}
              </span>
              <span
                className={cn(
                  "flex-1 pt-0.5 text-[13px] font-medium leading-relaxed sm:pt-1 sm:text-sm",
                  isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {choice.replace(/^(?:Option\s*\d+|Option\s*[A-D]|[A-D])\s*[\:\.\-]\s*/i, "").trim()}
              </span>
              {isSelected && <CheckCircle2 className="size-5 shrink-0 text-iscarb-green" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuestionPanel({
  ar,
  dimLabel,
  module,

  response,
  setResponse,
  scoring,
  scoreProgress,
  scoreError,
  submitError,
  flagged,
  onToggleFlag,
  canGoBack,
  onBack,
  onSave,
  onNext,
  isLast,
  retrying,
  retryError,
  onRetryGeneration,
}: {
  ar: boolean;
  dimLabel: string;
  module: ModuleBrief;

  response: string;
  setResponse: (v: string) => void;
  scoring: boolean;
  scoreProgress: { done: number; total: number } | null;
  scoreError: string | null;
  submitError: string | null;
  flagged: boolean;
  onToggleFlag: () => void;
  canGoBack: boolean;
  onBack: () => void;
  onSave: () => void;
  onNext: () => void;
  isLast: boolean;
  retrying: boolean;
  retryError: string | null;
  onRetryGeneration: () => void;
}) {
  const Icon = DIM_ICON[module.dimension] ?? ClipboardCheck;
  const generationFailed = isGenerationFailedModule(module);

  const displayScenario = ar ? module.scenarioAr || module.scenario : module.scenario;
  const displayInstructions = ar ? module.instructionsAr || module.instructions : module.instructions;
  const displayChoices =
    ar && Array.isArray(module.choicesAr) && module.choicesAr.length === 4
      ? module.choicesAr
      : getDefaultChoices(module);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-iscarb-green/30 bg-iscarb-green-soft/80 px-2.5 py-1 text-xs font-semibold text-iscarb-green-dark sm:px-3 sm:text-sm">
            <Icon className="size-3.5 shrink-0" />
            <span className="truncate max-w-[10rem] sm:max-w-none">{dimLabel}</span>
          </span>
          {module.contentSource === "live_ai" && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 sm:text-xs dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300"
              title="Generated live for your specialization by AI"
            >
              <Sparkles className="size-3" />
              {ar ? "مولّد بتخصصك" : "AI · Personalized"}
            </span>
          )}
          {ar &&
            module.contentSource === "live_ai" &&
            module.scenario &&
            !module.scenarioAr && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 sm:text-xs dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                <Loader2 className="size-3 animate-spin" />
                {ar ? "جاري الترجمة…" : "Translating…"}
              </span>
            )}
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {ar && module.titleAr ? module.titleAr : module.title}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFlag}
          disabled={scoring}
          aria-pressed={flagged}
          className={cn(
            "h-9 shrink-0 gap-1.5 rounded-full px-3 text-xs touch-manipulation sm:rounded-lg sm:text-sm",
            flagged
              ? "border-amber-500/50 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Flag className={cn("size-3.5", flagged && "fill-current")} />
          <span className="sm:hidden">{flagged ? (ar ? "إلغاء" : "Unflag") : ar ? "علّم" : "Flag"}</span>
          <span className="hidden sm:inline">
            {flagged
              ? ar
                ? "إلغاء التحديد"
                : "Unflag"
              : ar
                ? "تحديد للمراجعة"
                : "Flag"}
          </span>
        </Button>
      </div>

      {generationFailed ? (
        <GenerationFailedCard
          ar={ar}
          retrying={retrying}
          error={retryError}
          onRetry={onRetryGeneration}
        />
      ) : module.contentSource === "generating_in_background" ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Loader2 className="size-8 animate-spin text-iscarb-green" />
          <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
            {ar ? "جاري تحضير هذا السؤال لك..." : "Preparing this question for you..."}
          </div>
          <div className="text-xs text-muted-foreground">
            {ar ? "يتم الآن صياغة السؤال بناءً على تخصصك" : "Personalizing scenario based on your specialization"}
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border-l-4 border-l-iscarb-green bg-muted/30 p-3 text-sm leading-relaxed sm:p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-iscarb-green-dark">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 shrink-0" />
                {ar ? "السيناريو" : "Scenario"}
              </div>

            </div>
            {displayScenario}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Target className="size-4 shrink-0 text-iscarb-green" />
              {ar ? "المطلوب منك" : "Task — your decision"}
            </div>
            <p className="rounded-xl border border-iscarb-green/20 bg-white/70 p-3.5 text-[15px] font-semibold leading-relaxed text-iscarb-ink sm:p-4 sm:text-base dark:bg-card/60 dark:text-white">
              {displayInstructions}
            </p>
          </div>

          <McqOptions
            choices={displayChoices}
            value={response}
            onChange={setResponse}
            disabled={scoring}
            ar={ar}
            onAutoAdvance={onNext}
          />

          <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
            {ar ? "يمكنك استخدام المفاتيح 1–4 للاختيار" : "Tip: press 1–4 on your keyboard to choose"}
          </p>

          {scoreError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive">
              {scoreError}
            </div>
          )}
          {submitError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive">
              {submitError}
            </div>
          )}
        </>
      )}

      <div className="-mx-1 sticky bottom-0 z-10 flex gap-2 border-t border-border/60 bg-background/95 px-1 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pb-0 sm:backdrop-blur-none">
        {canGoBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={scoring}
            className="h-11 w-16 shrink-0 cursor-pointer gap-1.5 rounded-xl text-xs font-semibold touch-manipulation transition-colors hover:bg-accent hover:text-accent-foreground sm:h-12 sm:w-28 sm:gap-2 sm:text-sm"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{ar ? "رجوع" : "Back"}</span>
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={onSave}
          disabled={scoring}
          className="h-11 w-16 shrink-0 cursor-pointer gap-1.5 rounded-xl text-xs font-semibold touch-manipulation transition-colors hover:bg-accent hover:text-accent-foreground sm:h-12 sm:w-28 sm:gap-2 sm:text-sm"
        >
          {ar ? "حفظ" : "Save"}
        </Button>
        <Button
          type="button"
          disabled={scoring}
          onClick={onNext}
          className="group h-11 min-w-0 flex-1 cursor-pointer gap-2 rounded-xl bg-iscarb-green text-sm font-bold text-white shadow-sm touch-manipulation transition-all duration-200 hover:-translate-y-0.5 hover:bg-iscarb-green-dark hover:shadow-md hover:shadow-iscarb-green/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iscarb-green/40 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:h-12"
        >
          {scoring ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {ar ? "جارٍ الإرسال…" : "Submitting…"}
            </>
          ) : (
            <>
              {isLast ? (ar ? "إنهاء" : "Finish") : ar ? "التالي" : "Next"}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Shown when live AI generation failed for a module. The exam never serves
 * default/catalog content — the candidate retries until the question is
 * freshly generated for their specialization, or navigates on.
 */
function GenerationFailedCard({
  ar,
  retrying,
  error,
  onRetry,
}: {
  ar: boolean;
  retrying: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  useEffect(() => {
    if (!retrying && !error) {
      onRetry();
    }
  }, [retrying, error, onRetry]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-50/40 px-6 py-12 text-center dark:border-amber-500/40 dark:bg-amber-950/20">
      <span className="flex size-12 items-center justify-center rounded-full border border-amber-400/50 bg-white text-amber-600 shadow-sm dark:bg-card dark:text-amber-400">
        <Sparkles className="size-6 animate-pulse" />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-bold text-iscarb-ink dark:text-white">
          {ar ? "جاري توليد السؤال..." : "Generating question..."}
        </p>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          {ar
            ? "نولّد كل سؤال خصيصاً لتخصصك — نرجو الانتظار قليلاً."
            : "Every question is generated fresh for your specialty. Please wait a moment while the AI creates this for you."}
        </p>
      </div>
      {error && <p className="max-w-md text-xs font-medium text-destructive">{error}</p>}
      <div className="flex items-center gap-2 text-sm font-bold text-amber-600 mt-2">
        <Loader2 className="size-5 animate-spin" />
        {ar ? "الذكاء الاصطناعي يعمل الآن" : "AI is working..."}
      </div>
    </div>
  );
}

// ── Module List (Day 16) ───────────────────────────────────────────────────────

function ModuleListPanel({
  ar,
  modules,
  onStart,
}: {
  ar: boolean;
  modules: ModuleBrief[];
  onStart: () => void;
}) {
  const total = modules.length;
  // All pending initially for a fresh exam
  const completed = 0;
  const progress = Math.round((completed / total) * 100) || 0;
  const totalMins = modules.reduce((sum, m) => sum + (m.estimateMinutes || 2), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{ar ? "وحدات قابلية التوظيف" : "Employability Modules"}</h2>
          <p className="text-sm text-muted-foreground">
            {ar ? `أكمل جميع الوحدات الـ ${total} للحصول على ملفك الشخصي` : `Complete all ${total} modules to get your profile`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-iscarb-green">
            <Clock className="size-4" />
            {ar ? `الوقت المقدر: ${totalMins} دقيقة` : `Est. Time: ${totalMins} mins`}
          </div>
          <Button onClick={onStart} className="gap-2 bg-iscarb-green text-white hover:bg-iscarb-green-dark rounded-xl">
            {ar ? "ابدأ التقييم" : "Start Assessment"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-muted-foreground">{ar ? "التقدم" : "Progress"}</span>
          <span className="font-bold">{completed} / {total} {ar ? "مكتمل" : "completed"} ({progress}%)</span>
        </div>
        <Progress value={progress} className="h-2.5 bg-muted" indicatorClassName="bg-iscarb-green" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, i) => {
          const Icon = DIM_ICON[mod.dimension] ?? ClipboardCheck;
          return (
            <div key={mod.code} className="flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-iscarb-green" />
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-iscarb-green-soft text-iscarb-green-dark">
                    <Icon className="size-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                    {ar ? "معلق" : "Pending"}
                  </Badge>
                </div>
                <Badge variant="secondary" className={cn("text-[10px]", mod.generated ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30")}>
                  {mod.generated ? (ar ? "توليد تلقائي" : "Auto-generated") : (ar ? "منتقى" : "Curated")}
                </Badge>
              </div>
              <h3 className="mb-1 text-sm font-bold line-clamp-2" title={ar && mod.titleAr ? mod.titleAr : mod.title}>
                {ar && mod.titleAr ? mod.titleAr : mod.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {mod.focus}
              </p>
              <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <span>{ar ? "الوحدة" : "Module"} {i + 1}</span>
                <span className="flex items-center gap-1"><Clock className="size-3" /> {mod.estimateMinutes || 2} {ar ? "د" : "m"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Result (light summary after exam) ────────────────────────────────────────

function DonePanel({
  ar,
  loading,
  error,
  profile,
  attemptId,
  timedOut,
  onRetry,
  onRestart,
}: {
  ar: boolean;
  loading: boolean;
  error: string | null;
  profile: ProfileResult | null;
  attemptId: string | null;
  timedOut: boolean;
  onRetry: () => void;
  onRestart: () => void;
}) {
  if (loading) {
    return (
      <Card className="border-iscarb-green/15">
        <CardContent className="space-y-3 py-10">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-4 w-48" />
          <p className="text-center text-xs text-muted-foreground">
            {ar ? "جارٍ إعداد نتيجتك…" : "Preparing your result…"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={onRestart}>
              {ar ? "البداية" : "Start over"}
            </Button>
            <Button onClick={onRetry} className="bg-iscarb-green text-white hover:bg-iscarb-green-dark">
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-3 py-10 text-center">
          <Award className="mx-auto size-10 text-iscarb-green/40" />
          <p className="text-sm text-muted-foreground">
            {ar ? "لا توجد نتيجة بعد." : "No result yet."}
          </p>
          <Button variant="outline" onClick={onRestart}>
            {ar ? "البداية" : "Start over"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const passed = profile.passed;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {timedOut && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-50/80 px-3 py-2 text-center text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {ar ? "انتهى الوقت — تم إرسال الامتحان تلقائياً." : "Time's up — your exam has been submitted automatically."}
        </p>
      )}

      {/* Hero score card */}
      <div className="rounded-2xl border border-iscarb-green/30 bg-gradient-to-br from-iscarb-green-soft/60 to-transparent px-6 py-8 text-center">
        <Award className="mx-auto mb-2 size-12 text-iscarb-green" />
        <h2 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
          {ar ? "نتيجة التقييم" : "Assessment Complete"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? "ملف قابلية التوظيف الرباعي الأبعاد" : "Four-Dimension Employability Profile"}
        </p>
        <div className="mt-6 flex flex-col items-center gap-1">
          <span className="font-display text-6xl font-bold tabular-nums text-iscarb-ink dark:text-white">
            {Math.round(profile.composite)}
          </span>
          <span className="text-lg text-muted-foreground">/ 100</span>
          <span className={cn(
            "mt-2 rounded-full px-4 py-1 text-sm font-bold capitalize",
            profile.band === "strong" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" :
              profile.band === "proficient" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" :
                profile.band === "developing" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" :
                  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
          )}>
            {profile.band}
          </span>
        </div>
      </div>

      {/* 4D Radar-style breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {ar ? "الأبعاد الأربعة" : "Four Dimensions"}
        </h3>
        {profile.dimensions.map((d) => {
          const Icon = DIM_ICON[d.dimension] ?? ClipboardCheck;
          const pct = Math.round(d.score);
          const bandColor =
            d.band === "strong" ? "bg-emerald-500" :
              d.band === "proficient" ? "bg-blue-500" :
                d.band === "developing" ? "bg-amber-400" :
                  "bg-red-400";
          const textColor =
            d.band === "strong" ? "text-emerald-700 dark:text-emerald-400" :
              d.band === "proficient" ? "text-blue-700 dark:text-blue-400" :
                d.band === "developing" ? "text-amber-700 dark:text-amber-400" :
                  "text-red-700 dark:text-red-400";
          return (
            <div key={d.dimension} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-iscarb-green-soft text-iscarb-green">
                  <Icon className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-iscarb-ink dark:text-white">
                      {ar ? d.labelAr : d.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-semibold capitalize", textColor)}>
                        {d.band}
                      </span>
                      <span className="font-display text-lg font-bold tabular-nums">
                        {pct}<span className="text-xs font-normal text-muted-foreground">/100</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", bandColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{ar ? `${d.moduleCount} وحدة` : `${d.moduleCount} module${d.moduleCount !== 1 ? "s" : ""}`}</span>
                <span className="font-medium">{Math.round(d.weight * 100)}% {ar ? "من الدرجة الكلية" : "of composite"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* What this score means */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {ar ? "تفسير الدرجة" : "Score Interpretation"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { band: "weak", label: ar ? "ضعيف" : "Weak", range: "0–39", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
            { band: "developing", label: ar ? "قيد التطور" : "Developing", range: "40–59", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
            { band: "proficient", label: ar ? "كفؤ" : "Proficient", range: "60–79", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
            { band: "strong", label: ar ? "متميّز" : "Strong", range: "80–100", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
          ].map((b) => (
            <div key={b.band} className={cn(
              "rounded-lg px-2.5 py-2 text-center text-xs font-semibold",
              b.band === profile.band ? b.color + " ring-2 ring-offset-1 ring-current" : "bg-background border text-muted-foreground"
            )}>
              <div className="font-bold">{b.label}</div>
              <div className="mt-0.5 text-[10px] opacity-80">{b.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 pt-1">
        {attemptId ? (
          <Button asChild className="h-12 w-full rounded-xl bg-iscarb-green text-sm font-bold text-white hover:bg-iscarb-green-dark">
            <Link href={`/student/results/${attemptId}`}>
              {ar ? "عرض التقرير التفصيلي" : "View Detailed Report"}
              <ArrowRight className="ms-2 size-4" />
            </Link>
          </Button>
        ) : (
          <Button disabled className="h-12 w-full rounded-xl bg-iscarb-green text-sm font-bold text-white opacity-70">
            {ar ? "جارٍ تجهيز التقرير…" : "Preparing report…"}
          </Button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onRestart} className="h-11 rounded-xl font-semibold">
            {ar ? "إعادة التقييم" : "Retake"}
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl font-semibold">
            <Link href="/student">{ar ? "الرئيسية" : "Dashboard"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
