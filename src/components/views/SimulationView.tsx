"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Flame,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/use-fetch";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface SimOption {
  text: string;
  correct?: boolean;
  credit?: number; // 0..1
  feedback?: string;
  rationale?: string;
}
interface DecisionPoint {
  competency?: string;
  prompt: string;
  options: SimOption[];
}
interface RubricAxis {
  name: string;
  weight?: number;
  excellent?: string;
  proficient?: string;
  developing?: string;
  beginning?: string;
}
interface SimulationPayload {
  title: string;
  context: string;
  opening: string;
  successCriteria?: string;
  company?: string;
  role?: string;
  decisionPoints?: DecisionPoint[];
  rubric?: RubricAxis[];
}
interface SimulationResponse {
  id: string;
  unitId: string;
  unitTitle?: string;
  title: string;
  context: string;
  opening: string;
  successCriteria?: string;
  company?: string;
  role?: string;
  confidence?: number;
  payload: SimulationPayload;
}
interface CourseLight {
  id: string;
  code: string;
  name: string;
  units: { id: string; title: string }[];
}
interface CoursesResponse {
  courses: CourseLight[];
}

// Employer presets tied to Saudi market
const EMPLOYERS = [
  { id: "alrajhi", name: "Al Rajhi Bank", sector: "Banking", color: "#1E8A5A" },
  { id: "stc", name: "stc", sector: "Telecom", color: "#00B4D8" },
  { id: "aramco", name: "Saudi Aramco", sector: "Energy", color: "#FFB700" },
  { id: "sdaia", name: "SDAIA", sector: "Government", color: "#0096C7" },
  { id: "sabic", name: "SABIC", sector: "Industry", color: "#1E8A5A" },
];

type Phase = "ready" | "running" | "active" | "done";

// ─────────────────────────────────────────────────────────────────────────────
//  SimulationView
// ─────────────────────────────────────────────────────────────────────────────
export function SimulationView() {
  const { selectedCourseId, setSelectedCourse } = useApp();
  const [unitId, setUnitId] = useState<string | null>(null);
  const [employerId, setEmployerId] = useState<string>("alrajhi");
  const [sim, setSim] = useState<SimulationResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [loadError, setLoadError] = useState<string | null>(null);

  // current decision index + per-decision selected option
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ idx: number; optionIdx: number; credit: number }[]>(
    [],
  );

  const { data: coursesData, loading: coursesLoading } =
    useFetch<CoursesResponse>("/api/iscarb/courses");
  const courses = coursesData?.courses ?? [];

  // Derive the EFFECTIVE selection (first course, then first unit) WITHOUT a
  // setState-in-effect cascade. Explicit selection still updates store/local
  // state via the Select handlers below.
  const effectiveCourseId = selectedCourseId ?? courses[0]?.id ?? null;
  const effectiveCourse = courses.find((c) => c.id === effectiveCourseId) ?? null;
  const effectiveUnitId =
    unitId && effectiveCourse?.units?.some((u) => u.id === unitId)
      ? unitId
      : effectiveCourse?.units?.[0]?.id ?? null;

  const employer = EMPLOYERS.find((e) => e.id === employerId)!;

  const startSim = async () => {
    if (!effectiveUnitId) return;
    setPhase("running");
    setLoadError(null);
    setSim(null);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswers([]);
    try {
      const res = await fetch("/api/iscarb/pipeline/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: effectiveUnitId, employer: employer.name }),
      });
      if (!res.ok) throw new Error(`Simulation failed (${res.status})`);
      const j = (await res.json()) as SimulationResponse;
      setSim(j);
      setPhase("active");
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to start simulation");
      setPhase("ready");
    }
  };

  const decisionPoints = sim?.payload?.decisionPoints ?? [];
  const rubric = sim?.payload?.rubric ?? [];
  const currentDP = decisionPoints[currentIdx];

  const totalCredit = answers.reduce((sum, a) => sum + a.credit, 0);
  const maxCredit = decisionPoints.length;
  const runningScore = maxCredit ? Math.round((totalCredit / maxCredit) * 100) : 0;

  const chooseOption = (optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);
    const opt = currentDP?.options[optionIdx];
    const credit = opt?.credit ?? (opt?.correct ? 1 : 0);
    setAnswers((prev) => [...prev, { idx: currentIdx, optionIdx, credit }]);
  };

  const nextDecision = () => {
    if (currentIdx + 1 >= decisionPoints.length) {
      setPhase("done");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
    }
  };

  const reset = () => {
    setSim(null);
    setPhase("ready");
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswers([]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header employer={employer} />

      {/* ── config bar ─────────────────────────────────────────────────────── */}
      {phase === "ready" && (
        <Card className="border-iscarb-green/15 shadow-sm">
          <CardContent className="grid gap-4 pt-0 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Course
              </label>
              <Select
                value={effectiveCourseId ?? undefined}
                onValueChange={(v) => {
                  setSelectedCourse(v);
                  const c = courses.find((x) => x.id === v);
                  setUnitId(c?.units[0]?.id ?? null);
                }}
                disabled={coursesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={coursesLoading ? "Loading…" : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-semibold">{c.code}</span> · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Unit
              </label>
              <Select value={effectiveUnitId ?? undefined} onValueChange={setUnitId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .find((c) => c.id === effectiveCourseId)
                    ?.units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Employer
              </label>
              <Select value={employerId} onValueChange={setEmployerId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYERS.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} · {e.sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-iscarb-gold/30 bg-iscarb-gold-soft p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Flame className="mt-0.5 size-5 shrink-0 text-iscarb-gold-dark" />
                <div>
                  <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                    This is how {employer.name} actually decides. Prove you belong here.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Each decision has a defensible answer. Wrong choices carry weight. Soft
                    answers are not accepted.
                  </div>
                </div>
              </div>
              <Button
                onClick={startSim}
                disabled={!effectiveUnitId}
                className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
              >
                <Zap className="size-4" />
                Start simulation
              </Button>
            </div>
            {loadError && (
              <div className="alert-iron mt-3 rounded-lg p-3 text-xs text-destructive">
                <div className="font-semibold">Could not start simulation</div>
                <div className="text-destructive/80">{loadError}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── running ───────────────────────────────────────────────────────── */}
      {phase === "running" && (
        <Card className="border-iscarb-cyan/15">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Loader2 className="size-10 animate-spin text-iscarb-green" />
            <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
              Generating simulation · {employer.name}
            </div>
            <div className="max-w-xs text-xs text-muted-foreground">
              The Simulate stage is calling the locked AiPrompt to produce a workplace scenario,
              decision points, and a zero-shot rubric.
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── active simulation ─────────────────────────────────────────────── */}
      {phase === "active" && sim && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-iscarb-green/15 shadow-sm">
              {/* scenario header */}
              <div
                className="rounded-t-xl px-6 py-4 text-white"
                style={{
                  background: `linear-gradient(135deg, ${employer.color}, #0E2A22)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                      {employer.name} · {sim.payload.role ?? employer.sector}
                    </span>
                  </div>
                  <Badge className="bg-white/15 text-white">
                    <Cpu className="size-3" /> {sim.confidence ? `${Math.round(sim.confidence * 100)}% conf.` : "AI-built"}
                  </Badge>
                </div>
                <h2 className="mt-2 font-display text-xl font-bold">{sim.payload.title}</h2>
              </div>

              <CardContent className="space-y-5 pt-0">
                {/* opening */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-iscarb-green">
                    Context
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-iscarb-ink dark:text-white/90">
                    {sim.payload.context}
                  </p>
                  {sim.payload.opening && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      "{sim.payload.opening}"
                    </p>
                  )}
                </div>

                {/* decision point */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan">
                        Decision {currentIdx + 1} of {decisionPoints.length}
                      </Badge>
                      {currentDP?.competency && (
                        <Badge variant="secondary" className="bg-iscarb-green/10 text-iscarb-green">
                          {currentDP.competency}
                        </Badge>
                      )}
                    </div>
                    <div className="rounded-lg border border-iscarb-ink/10 bg-card p-4">
                      <p className="text-base font-semibold leading-relaxed text-iscarb-ink dark:text-white">
                        {currentDP?.prompt}
                      </p>
                    </div>

                    <div className="grid gap-2.5">
                      {currentDP?.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isRevealed = selectedOption !== null;
                        const verity = (opt.credit ?? (opt.correct ? 1 : 0));
                        const tone =
                          verity >= 0.85
                            ? "correct"
                            : verity >= 0.4
                              ? "partial"
                              : "wrong";
                        return (
                          <button
                            key={i}
                            onClick={() => chooseOption(i)}
                            disabled={isRevealed}
                            className={cn(
                              "group relative flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                              !isRevealed &&
                                "border-border bg-card hover:border-iscarb-green/40 hover:bg-iscarb-green-soft/40 cursor-pointer",
                              isRevealed && isSelected && tone === "correct" &&
                                "border-iscarb-green bg-iscarb-green-soft",
                              isRevealed && isSelected && tone === "partial" &&
                                "border-iscarb-gold bg-iscarb-gold-soft",
                              isRevealed && isSelected && tone === "wrong" &&
                                "border-destructive/50 bg-red-50 dark:bg-red-950/20",
                              isRevealed && !isSelected && "border-border opacity-60",
                              isRevealed && !isSelected && tone === "correct" &&
                                "border-iscarb-green/50 bg-iscarb-green-soft/30",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                                !isRevealed && "border-border text-muted-foreground group-hover:border-iscarb-green",
                                isRevealed && isSelected && tone === "correct" && "border-iscarb-green bg-iscarb-green text-white",
                                isRevealed && isSelected && tone === "partial" && "border-iscarb-gold bg-iscarb-gold text-white",
                                isRevealed && isSelected && tone === "wrong" && "border-destructive bg-destructive text-white",
                                isRevealed && !isSelected && "border-border",
                              )}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-iscarb-ink dark:text-white">
                                {opt.text}
                              </div>
                              {isRevealed && (opt.feedback || opt.rationale) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-2 space-y-1 text-xs"
                                >
                                  {opt.feedback && (
                                    <div className="flex items-start gap-1.5">
                                      {tone === "correct" && (
                                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-iscarb-green" />
                                      )}
                                      {tone === "partial" && (
                                        <Flame className="mt-0.5 size-3.5 shrink-0 text-iscarb-gold-dark" />
                                      )}
                                      {tone === "wrong" && (
                                        <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                                      )}
                                      <span className="text-muted-foreground">{opt.feedback}</span>
                                    </div>
                                  )}
                                  {opt.rationale && (
                                    <div className="ml-5 rounded-md bg-iscarb-ink/[0.04] p-2 font-medium text-iscarb-ink dark:bg-white/5 dark:text-white/90">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-iscarb-gold-dark">
                                        Rationale ·
                                      </span>{" "}
                                      {opt.rationale}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>
                            {isRevealed && tone === "correct" && !isSelected && (
                              <CheckCircle2 className="size-4 text-iscarb-green" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedOption !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end"
                      >
                        <Button
                          onClick={nextDecision}
                          className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
                        >
                          {currentIdx + 1 >= decisionPoints.length ? "See evaluation" : "Next decision"}
                          <ArrowRight className="size-4" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* right rail: progress */}
          <div className="space-y-4">
            <Card className="border-iscarb-green/15">
              <CardContent className="space-y-3 pt-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Running score
                </div>
                <div className="flex items-end gap-2">
                  <span className="font-display text-5xl font-bold text-gradient-green">
                    {runningScore}
                  </span>
                  <span className="mb-1.5 text-xs text-muted-foreground">/ 100</span>
                </div>
                <Progress
                  value={runningScore}
                  className="h-2 bg-iscarb-green/15 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-iscarb-cyan [&>[data-slot=progress-indicator]]:to-iscarb-green"
                />
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="rounded-lg border border-border/60 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Decisions
                    </div>
                    <div className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
                      {answers.length}/{decisionPoints.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Clean hits
                    </div>
                    <div className="font-display text-lg font-bold text-iscarb-green">
                      {answers.filter((a) => a.credit >= 0.85).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-iscarb-gold/30 bg-iscarb-gold-soft/40">
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-iscarb-gold-dark" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-iscarb-gold-dark">
                    Discipline memo
                  </span>
                </div>
                <p className="font-arabic text-sm font-bold text-iscarb-gold-dark" dir="rtl">
                  نهاية كل الأعذار — سلّم الليلة.
                </p>
                <p className="text-xs text-muted-foreground">
                  The end of all excuses — ship tonight. Wrong choices don't end the sim; they
                  shape the rubric.
                </p>
              </CardContent>
            </Card>

            {sim.payload.successCriteria && (
              <Card className="border-border/60">
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-iscarb-green" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Success criteria
                    </span>
                  </div>
                  <p className="text-xs text-iscarb-ink dark:text-white/90">
                    {sim.payload.successCriteria}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── done / evaluation ─────────────────────────────────────────────── */}
      {phase === "done" && sim && (
        <EvaluationPanel
          score={runningScore}
          rubric={rubric}
          answers={answers}
          decisionPoints={decisionPoints}
          employerName={employer.name}
          onReset={reset}
          onRerun={startSim}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Evaluation
// ─────────────────────────────────────────────────────────────────────────────
function EvaluationPanel({
  score,
  rubric,
  answers,
  decisionPoints,
  employerName,
  onReset,
  onRerun,
}: {
  score: number;
  rubric: RubricAxis[];
  answers: { idx: number; optionIdx: number; credit: number }[];
  decisionPoints: DecisionPoint[];
  employerName: string;
  onReset: () => void;
  onRerun: () => void;
}) {
  const weak = answers.filter((a) => a.credit < 0.85).length;
  const passed = score >= 70;
  const topDecile = 88;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      <Card
        className={cn(
          "overflow-hidden border shadow-brand",
          passed ? "border-iscarb-green/30" : "border-iscarb-gold/40",
        )}
      >
        <div
          className={cn(
            "px-6 py-5 text-white",
            passed
              ? "bg-gradient-to-r from-iscarb-green to-iscarb-teal"
              : "bg-gradient-to-r from-iscarb-gold-dark to-iscarb-ink",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {passed ? (
                <Award className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-90">
                Zero-shot evaluation
              </span>
            </div>
            <Badge className="bg-white/20 text-white">{employerName}</Badge>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-display text-6xl font-bold leading-none">{score}</span>
            <span className="mb-1.5 text-sm opacity-80">/ 100</span>
            <span className="mb-1.5 ml-2 text-sm opacity-90">
              {passed ? "Career-ready threshold met" : "Below career-ready threshold"}
            </span>
          </div>
          <div className="mt-2 text-xs opacity-80">
            Top decile sits at {topDecile}. You are{" "}
            <span className="font-bold">{Math.max(0, topDecile - score)} points below</span>.
          </div>
        </div>
        <CardContent className="space-y-4 pt-0">
          {/* rubric axes */}
          {rubric.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rubric breakdown
              </div>
              <div className="space-y-2.5">
                {rubric.map((axis, i) => {
                  // derive a per-axis score from the running answers as a proxy
                  const slice =
                    answers.length > 0
                      ? answers
                          .map((a, idx) => ({
                            idx,
                            credit: a.credit,
                            comp: decisionPoints[idx]?.competency ?? "",
                          }))
                          .filter((a) =>
                            a.comp.toLowerCase().includes(axis.name.toLowerCase().split(" ")[0]),
                          )
                      : [];
                  const baseScore =
                    slice.length > 0
                      ? Math.round((slice.reduce((s, x) => s + x.credit, 0) / slice.length) * 100)
                      : Math.round(score + (i - 1) * 4);
                  const finalScore = Math.max(20, Math.min(100, baseScore));
                  return (
                    <RubricRow key={axis.name} axis={axis} score={finalScore} />
                  );
                })}
              </div>
            </div>
          )}

          {/* verdict */}
          {passed ? (
            <div className="alert-discipline rounded-lg border-l-4 border-iscarb-green bg-iscarb-green-soft/50 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-iscarb-green" />
                <span className="font-display text-sm font-bold text-iscarb-green">
                  You would survive a real assessment at {employerName}.
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Now sustain it. {weak} decision{weak === 1 ? "" : "s"} need tightening before
                you walk into the actual interview.
              </p>
            </div>
          ) : (
            <div className="alert-iron rounded-lg border-l-4 border-destructive p-4">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-destructive" />
                <span className="font-display text-sm font-bold text-destructive">
                  The end of all excuses.
                </span>
              </div>
              <p className="mt-1 text-xs text-destructive/80">
                You scored {score}. {employerName} would not advance this. No soft retries —
                open the rubric below, fix the {weak} weak decision{weak === 1 ? "" : "s"}, and
                rerun. Softness is what produced the gap.
              </p>
              <div className="mt-2 font-arabic text-sm font-bold text-destructive" dir="rtl">
                أنا أستطيع، أنا سأفعل — ابدأ الليلة.
              </div>
            </div>
          )}

          {/* decision recap */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Decision recap
            </div>
            <div className="space-y-1.5">
              {answers.map((a, i) => {
                const dp = decisionPoints[a.idx];
                const opt = dp?.options[a.optionIdx];
                const tone =
                  a.credit >= 0.85 ? "correct" : a.credit >= 0.4 ? "partial" : "wrong";
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md border border-border/60 bg-card p-2 text-xs"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                        tone === "correct" && "bg-iscarb-green",
                        tone === "partial" && "bg-iscarb-gold",
                        tone === "wrong" && "bg-destructive",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-iscarb-ink dark:text-white">
                        {dp?.prompt}
                      </div>
                      <div className="mt-0.5 text-muted-foreground">
                        → {opt?.text}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        tone === "correct" && "border-iscarb-green/40 text-iscarb-green",
                        tone === "partial" && "border-iscarb-gold/40 text-iscarb-gold-dark",
                        tone === "wrong" && "border-destructive/40 text-destructive",
                      )}
                    >
                      {Math.round(a.credit * 100)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button
              onClick={onRerun}
              className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
            >
              <Sparkles className="size-4" />
              Rerun simulation
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RubricRow({ axis, score }: { axis: RubricAxis; score: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-iscarb-ink dark:text-white">
            {axis.name}
          </span>
          {axis.weight !== undefined && (
            <Badge variant="secondary" className="text-[10px]">
              {Math.round(axis.weight * 100)}% wt
            </Badge>
          )}
        </div>
        <span className="font-mono text-sm font-bold text-iscarb-ink dark:text-white">
          {score}
          <span className="text-xs text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)",
          }}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground sm:grid-cols-4">
        <div>
          <span className="font-semibold text-iscarb-green">Excellent · </span>
          {axis.excellent ?? "—"}
        </div>
        <div>
          <span className="font-semibold text-iscarb-cyan">Proficient · </span>
          {axis.proficient ?? "—"}
        </div>
        <div>
          <span className="font-semibold text-iscarb-gold-dark">Developing · </span>
          {axis.developing ?? "—"}
        </div>
        <div>
          <span className="font-semibold text-destructive">Beginning · </span>
          {axis.beginning ?? "—"}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────────────────────────────────────
function Header({ employer }: { employer: { name: string; sector: string; color: string } }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
          Simulate stage
        </div>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: employer.color }}
        >
          {employer.name} · {employer.sector}
        </div>
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
        Interactive Student Simulation
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        The Simulate stage produces a workplace scenario grounded in Saudi regulation. You
        walk every decision; iSCARB scores every choice and exposes the rubric at the end.
        There is no soft path.
      </p>
    </div>
  );
}

export default SimulationView;
