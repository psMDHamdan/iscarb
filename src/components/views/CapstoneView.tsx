"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Gauge,
  GraduationCap,
  Layers,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReadinessRing } from "@/components/iscarb/ReadinessRing";
import { R2COutputPanel, type R2COutputResult } from "@/components/iscarb/R2COutputPanel";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/use-fetch";

// ─────────────────────────────────────────────────────────────────────────────
//  Types — match the response shapes documented by Task 2-a
// ─────────────────────────────────────────────────────────────────────────────
interface StudentBrief {
  id: string;
  name: string;
  email: string;
  program: string;
  college: string;
  cohort: string;
  readinessScore: number;
}
interface StudentsResponse {
  students: StudentBrief[];
}

interface MarketSignalRef {
  employer: string;
  skill: string;
  demandIndex: number;
}

interface CapstoneResponse {
  title: string;
  employer?: string;
  problem?: string;
  deliverables?: string[];
  skills?: string[];
  timeline?: string;
  successMetric?: string;
  studentId?: string;
  studentName?: string;
  marketSignal?: MarketSignalRef | null;
  confidence?: number;
  latencyMs?: number;
  model?: string;
  source?: "ai" | "fallback" | "fallback-no-prompt";
  error?: string;
}

interface RubricAxis {
  name: string;
  score?: number;
  evidence?: string;
  gap?: string;
}
interface EvaluateResponse {
  score: number;
  confidence?: number;
  rubric?: RubricAxis[];
  feedback?: string;
  skillsAssessed?: string[];
  latencyMs?: number;
  model?: string;
  source?: "ai" | "fallback" | "fallback-no-prompt";
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CapstoneView
// ─────────────────────────────────────────────────────────────────────────────
export function CapstoneView() {
  const { selectedStudentId, setSelectedStudent } = useApp();
  const { t, ar, lang } = useI18n();

  const { data: studentsData, loading: studentsLoading, error: studentsError } =
    useFetch<StudentsResponse>("/api/iscarb/students");
  const students = studentsData?.students ?? [];

  // auto-pick first student if none selected
  useEffect(() => {
    if (students.length && !selectedStudentId) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudentId, setSelectedStudent]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [capstone, setCapstone] = useState<CapstoneResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluateResponse | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Step 2 of the AI Project Builder wizard: turn the generated brief into
  // runnable starter code, INLINE on this same page (R&D merge: this used to
  // navigate away to a separate "Requirement → Code" view via a one-shot
  // r2cSeed handoff — now it's one continuous Brief → Code flow).
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [codeResult, setCodeResult] = useState<R2COutputResult | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  async function handleGenerateCode() {
    if (!capstone) return;
    setCodeGenerating(true);
    setCodeError(null);
    const requirement = [
      capstone.title,
      capstone.problem,
      Array.isArray(capstone.deliverables) && capstone.deliverables.length
        ? `Deliverables: ${capstone.deliverables.join("; ")}`
        : "",
    ].filter(Boolean).join("\n\n");
    const pending = notify.generating(lang);
    try {
      const res = await fetch("/api/iscarb/r2c/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ requirement, studentId: selectedStudentId ?? undefined }),
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const json = (await res.json()) as R2COutputResult;
      setCodeResult(json);
      pending.dismiss();
      if (json.source !== "ai") notify.fallback(lang);
      else notify.ok(lang, { en: "Starter code generated", ar: "تم توليد الكود الابتدائي" });
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : "Generation failed");
      pending.dismiss();
      notify.fail(lang);
    } finally {
      setCodeGenerating(false);
    }
  }


  const GEN_STEPS = [
    { labelKey: "capstone.gen.step1", icon: TrendingUp },
    { labelKey: "capstone.gen.step2", icon: Cpu },
    { labelKey: "capstone.gen.step3", icon: Target },
    { labelKey: "capstone.gen.step4", icon: Layers },
  ];

  async function handleGenerate() {
    if (!selectedStudentId) return;
    setGenerating(true);
    setGenError(null);
    setCapstone(null);
    setEvaluation(null);
    setCodeResult(null);
    setCodeError(null);
    setGenStep(0);

    // Step animation — independent of the network call.
    const stepTimer = setInterval(() => {
      setGenStep((s) => Math.min(GEN_STEPS.length - 1, s + 1));
    }, 1400);

    const pending = notify.generating(lang);
    try {
      const res = await fetch("/api/iscarb/capstone/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const json = (await res.json()) as CapstoneResponse;
      setCapstone(json);
      setGenStep(GEN_STEPS.length - 1);
      pending.dismiss();
      if (json.source && json.source !== "ai") {
        notify.fallback(lang);
      } else {
        notify.ok(
          lang,
          { en: "Capstone ready", ar: "مشروع التخرّج جاهز" },
          { en: "Your capstone has been generated.", ar: "تم توليد مشروع تخرّجك." },
        );
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
      pending.dismiss();
      notify.fail(lang);
    } finally {
      clearInterval(stepTimer);
      setGenerating(false);
    }
  }

  async function handleEvaluate() {
    if (!capstone) return;
    setEvaluating(true);
    setEvalError(null);
    setEvaluation(null);
    const pending = notify.generating(lang);
    try {
      const res = await fetch("/api/iscarb/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: capstone.title,
          description: capstone.problem ?? "",
          skills: capstone.skills ?? [],
        }),
      });
      if (!res.ok) throw new Error(`Evaluation failed (${res.status})`);
      const json = (await res.json()) as EvaluateResponse;
      setEvaluation(json);
      pending.dismiss();
      if (json.source && json.source !== "ai") {
        notify.fallback(lang);
      } else {
        notify.ok(
          lang,
          { en: "Evaluation complete", ar: "اكتمل التقييم" },
          { en: "Your capstone was scored zero-shot.", ar: "تم تقييم مشروعك دون أمثلةٍ مرجعية." },
        );
      }
    } catch (e) {
      setEvalError(e instanceof Error ? e.message : "Evaluation failed");
      pending.dismiss();
      notify.fail(lang);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      {/* ── Student selector ─────────────────────────────────────────────── */}
      <Card className="mb-6 border-iscarb-green/15">
        <CardContent className="grid gap-4 pt-0 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border-2 border-iscarb-green/20">
              <AvatarFallback className="bg-iscarb-green-soft font-display text-sm font-bold text-iscarb-green">
                {selectedStudent?.name
                  ?.split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("") ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("readiness.selector.label")}
              </label>
              <Select
                value={selectedStudentId ?? undefined}
                onValueChange={setSelectedStudent}
                disabled={studentsLoading}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue
                    placeholder={studentsLoading ? t("readiness.selector.loading") : t("readiness.selector.placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-semibold">{s.name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        · {s.program} · {s.readinessScore}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedStudent && (
              <>
                <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan">
                  <GraduationCap className="size-3" /> {selectedStudent.program}
                </Badge>
                <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">
                  {t("capstone.readiness", { n: selectedStudent.readinessScore })}
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {studentsError && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          {t("capstone.err.students")}
        </div>
      )}

      {/* ── Generate panel ───────────────────────────────────────────────── */}
      <Card className="mb-6 overflow-hidden border-iscarb-green/20 shadow-brand">
        <div className="relative">
          <div className="bg-brand-mesh">
            <div className="grid-dots pointer-events-none absolute inset-0 opacity-20" />
            <CardContent className="relative grid gap-5 py-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
                  <Sparkles className="size-3.5" />
                  {t("capstone.panel.eyebrow")}
                </div>
                <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-iscarb-ink dark:text-white">
                  {t("capstone.panel.title")}
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                  {t("capstone.panel.bodyLead")}{" "}
                  <span className="font-semibold text-iscarb-ink dark:text-white">
                    {t("capstone.panel.bodyHighlight")}
                  </span>
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Flame className="size-3.5 text-iscarb-gold-dark" />
                  <span>
                    {ar ? "نهاية كل الأعذار —" : "The end of all excuses —"}{" "}
                    <span
                      className={cn("text-iscarb-gold-dark", ar ? "" : "font-arabic")}
                      dir={ar ? "ltr" : "rtl"}
                    >
                      {ar ? "The end of all excuses" : "نهاية كل الأعذار"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-2 md:items-end">
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={generating || !selectedStudentId}
                  className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
                >
                  {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                  {generating ? t("capstone.panel.generating") : t("capstone.panel.generate")}
                </Button>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {selectedStudent ? t("capstone.panel.forStudent", { name: selectedStudent.name }) : t("capstone.panel.selectFirst")}
                </span>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      {/* ── Generating state: animated engine steps ─────────────────────── */}
      <AnimatePresence mode="wait">
        {generating && (
          <motion.div
            key="gen"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="mb-6 overflow-hidden border-iscarb-cyan/30">
              <CardContent className="py-6">
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <div
                    className="h-1.5 w-full rounded-full animate-pulse-soft"
                    style={{
                      background:
                        "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {GEN_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const active = i <= genStep;
                    const current = i === genStep;
                    return (
                      <div
                        key={step.labelKey}
                        className={cn(
                          "rounded-lg border p-3 transition-all",
                          active
                            ? "border-iscarb-green/40 bg-iscarb-green-soft/60"
                            : "border-border/60 bg-card opacity-60",
                          current && "shadow-brand",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-md",
                              active
                                ? "bg-iscarb-green text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {current ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Icon className="size-3.5" />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("capstone.gen.step", { n: i + 1 })}
                          </span>
                        </div>
                        <div className="mt-1.5 text-sm font-semibold text-iscarb-ink dark:text-white">
                          {t(step.labelKey)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-center text-[11px] text-muted-foreground">
                  {t("capstone.gen.reading", { name: selectedStudent?.name ?? t("capstone.gen.theStudent") })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Errors ───────────────────────────────────────────────────────── */}
      {genError && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          <div className="font-semibold">{t("capstone.err.gen")}</div>
          <div className="text-destructive/80">{genError}</div>
        </div>
      )}

      {/* ── Result card ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {capstone && !generating && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <CapstoneResultCard capstone={capstone} />

            {/* Market signal callout */}
            {capstone.marketSignal && (
              <div className="alert-discipline flex flex-col items-start justify-between gap-3 rounded-xl p-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 size-5 text-iscarb-gold-dark" />
                  <div>
                    <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                      {t("capstone.market.real")}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-iscarb-ink dark:text-white">
                        {capstone.marketSignal.employer}
                      </span>{" "}
                      {t("capstone.market.reporting")}{" "}
                      <span className="font-bold text-iscarb-green">
                        {capstone.marketSignal.demandIndex}%
                      </span>{" "}
                      {t("capstone.market.demandFor")}{" "}
                      <span className="font-semibold text-iscarb-cyan">
                        {capstone.marketSignal.skill}
                      </span>{" "}
                      {t("capstone.market.tail")}
                    </div>
                  </div>
                </div>
                <Badge
                  className="shrink-0 bg-iscarb-gold text-white"
                  title={t("capstone.market.liveDemand")}
                >
                  {t("capstone.market.demandBadge", { n: capstone.marketSignal.demandIndex })}
                </Badge>
              </div>
            )}

            {/* Zero-shot evaluate */}
            <Card className="overflow-hidden border-iscarb-cyan/20 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-iscarb-cyan" />
                    {t("capstone.eval.title")}
                  </span>
                  <Badge
                    variant="secondary"
                    className={
                      capstone.source === "ai"
                        ? "bg-iscarb-green-soft text-iscarb-green"
                        : "bg-iscarb-gold-soft text-iscarb-gold-dark"
                    }
                  >
                    {t("capstone.eval.badge", { source: capstone.source ?? "fallback" })}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground">
                  {t("capstone.eval.intro")}
                </p>
                {!evaluation && !evaluating && (
                  <Button
                    onClick={handleEvaluate}
                    className="bg-iscarb-cyan text-white hover:bg-iscarb-cyan-dark"
                  >
                    <Rocket className="size-4" />
                    {t("capstone.eval.run")}
                  </Button>
                )}
                {evaluating && (
                  <div className="flex items-center gap-3 rounded-lg border border-iscarb-cyan/30 bg-iscarb-cyan-soft/40 p-3 text-sm text-iscarb-cyan-dark">
                    <Loader2 className="size-4 animate-spin" />
                    {t("capstone.eval.scoring")}
                  </div>
                )}
                {evalError && (
                  <div className="alert-iron rounded-lg p-3 text-xs text-destructive">
                    <div className="font-semibold">{t("capstone.err.eval")}</div>
                    <div className="text-destructive/80">{evalError}</div>
                  </div>
                )}
                {evaluation && (
                  <EvaluationResult evaluation={evaluation} />
                )}

                {/* Step 2: turn this brief into runnable starter code — inline. */}
                <div className="mt-2 rounded-lg border border-iscarb-green/20 bg-iscarb-green-soft/20 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-iscarb-green text-[10px] font-bold text-white">2</span>
                      <p className="text-xs font-semibold text-iscarb-green-dark">
                        {ar ? "حوّل هذا المتطلب إلى كود ابتدائي قابل للتشغيل" : "Turn this brief into runnable starter code"}
                      </p>
                    </div>
                    {!codeResult && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateCode}
                        disabled={codeGenerating}
                        className="border-iscarb-green/40 text-iscarb-green-dark hover:bg-iscarb-green-soft"
                      >
                        {codeGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                        {ar ? "ولّد الكود" : "Generate code"}
                      </Button>
                    )}
                  </div>
                  {codeError && (
                    <div className="alert-iron rounded-lg p-3 text-xs text-destructive">{codeError}</div>
                  )}
                  {codeResult && (
                    <div className="rounded-lg border border-border/60 bg-card p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-iscarb-ink dark:text-white">
                          {ar ? codeResult.titleAr : codeResult.titleEn}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{codeResult.stack}</Badge>
                          {codeResult.source !== "ai" && (
                            <Badge variant="secondary" className="bg-iscarb-gold-soft text-iscarb-gold-dark text-xs">
                              {ar ? "بديل غير مباشر" : "fallback"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <R2COutputPanel result={codeResult} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!capstone && !generating && !genError && (
        <EmptyState onGenerate={handleGenerate} disabled={!selectedStudentId} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function Header() {
  const { t, ar } = useI18n();
  return (
    <div className="mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
        {t("capstone.header.eyebrow")}
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
        {t("capstone.header.titleLead")}{" "}
        <span className="text-gradient-brand">{t("capstone.header.titleHighlight")}</span>
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {t("capstone.header.subtitle")}
      </p>
      <div
        className={cn("mt-2 text-sm text-muted-foreground", ar ? "" : "font-arabic")}
        dir={ar ? "ltr" : "rtl"}
      >
        {ar ? t("capstone.header.gloss") : "مولّد مشاريع التخرج بالذكاء الاصطناعي — مشاريع حقيقية، لا نظرية."}
      </div>
    </div>
  );
}

function CapstoneResultCard({ capstone }: { capstone: CapstoneResponse }) {
  const { t } = useI18n();
  const skills = capstone.skills ?? [];
  const deliverables = capstone.deliverables ?? [];
  return (
    <Card className="relative overflow-hidden border-iscarb-green/25 shadow-brand">
      <div className="bg-brand-mesh">
        <CardContent className="relative py-6">
          <div className="grid-dots pointer-events-none absolute inset-0 opacity-15" />
          <div className="relative flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-iscarb-green/40 bg-iscarb-green-soft text-iscarb-green"
            >
              <Building2 className="size-3" />
              {capstone.employer ?? t("capstone.card.liveEmployer")}
            </Badge>
            {capstone.source === "ai" ? (
              <Badge className="bg-iscarb-cyan text-white">{t("capstone.card.aiGen")}</Badge>
            ) : (
              <Badge className="bg-iscarb-gold-soft text-iscarb-gold-dark">{t("capstone.card.fallback")}</Badge>
            )}
            {capstone.model && capstone.model !== "fallback" && (
              <Badge variant="outline" className="border-border/60 text-muted-foreground">
                <Cpu className="size-3" />
                {capstone.model}
              </Badge>
            )}
            {typeof capstone.latencyMs === "number" && capstone.latencyMs > 0 && (
              <Badge variant="outline" className="border-border/60 text-muted-foreground">
                <Clock className="size-3" />
                {capstone.latencyMs} ms
              </Badge>
            )}
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-3xl">
            <span className="text-gradient-brand">{capstone.title}</span>
          </h2>

          {capstone.problem && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-iscarb-cyan">
                {t("capstone.card.problem")}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-iscarb-ink/80 dark:text-white/80">
                {capstone.problem}
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Deliverables */}
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Layers className="size-3.5 text-iscarb-green" />
                {t("capstone.card.deliverables")}
              </div>
              <ul className="space-y-1.5">
                {deliverables.map((d, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-start gap-2 text-xs text-iscarb-ink/80 dark:text-white/80"
                  >
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-iscarb-green" />
                    <span>{d}</span>
                  </motion.li>
                ))}
                {deliverables.length === 0 && (
                  <li className="text-xs text-muted-foreground">{t("capstone.card.noDeliverables")}</li>
                )}
              </ul>
            </div>

            {/* Timeline + success metric */}
            <div className="space-y-3">
              {capstone.timeline && (
                <div className="rounded-lg border border-iscarb-cyan/30 bg-iscarb-cyan-soft/40 p-3">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-iscarb-cyan-dark">
                    <Clock className="size-3.5" />
                    {t("capstone.card.timeline")}
                  </div>
                  <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                    {capstone.timeline}
                  </div>
                </div>
              )}
              {capstone.successMetric && (
                <div className="rounded-lg border border-iscarb-gold/40 bg-iscarb-gold-soft/60 p-3">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-iscarb-gold-dark">
                    <Trophy className="size-3.5" />
                    {t("capstone.card.successMetric")}
                  </div>
                  <div className="text-xs text-iscarb-ink/80 dark:text-white/80">
                    {capstone.successMetric}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Cpu className="size-3.5 text-iscarb-cyan" />
                {t("capstone.card.skills")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => {
                  const palette = [
                    "bg-iscarb-green-soft text-iscarb-green border-iscarb-green/30",
                    "bg-iscarb-cyan-soft text-iscarb-cyan-dark border-iscarb-cyan/30",
                    "bg-iscarb-gold-soft text-iscarb-gold-dark border-iscarb-gold/40",
                    "bg-iscarb-green-soft text-iscarb-green-dark border-iscarb-teal/30",
                  ];
                  return (
                    <Badge
                      key={s + i}
                      variant="outline"
                      className={cn("border text-xs", palette[i % palette.length])}
                    >
                      {s}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

function EvaluationResult({ evaluation }: { evaluation: EvaluateResponse }) {
  const { t, ar } = useI18n();
  const score = Math.max(0, Math.min(100, evaluation.score ?? 0));
  const rubric = evaluation.rubric ?? [];
  const belowStandard = score < 70;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
        <div className="flex flex-col items-center rounded-lg border border-border/60 bg-card p-4">
          <ReadinessRing score={score} size={180} label={t("capstone.evalRes.scoreLabel")} />
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <Badge
              variant="outline"
              className={
                evaluation.source === "ai"
                  ? "border-iscarb-green/30 text-iscarb-green"
                  : "border-iscarb-gold/40 text-iscarb-gold-dark"
              }
            >
              {evaluation.source ?? "fallback"}
            </Badge>
            {evaluation.model && (
              <Badge variant="outline" className="border-border/60 text-muted-foreground">
                {evaluation.model}
              </Badge>
            )}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("capstone.evalRes.feedback")}
          </div>
          <p className="mt-1 text-sm text-iscarb-ink/80 dark:text-white/80">
            {evaluation.feedback ?? t("capstone.evalRes.noFeedback")}
          </p>
          {typeof evaluation.confidence === "number" && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {t("capstone.evalRes.confidence")}{" "}
              <span className="font-semibold text-iscarb-ink dark:text-white">
                {Math.round(evaluation.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {rubric.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Gauge className="size-3.5 text-iscarb-cyan" />
            {t("capstone.evalRes.rubric")}
          </div>
          <div className="space-y-2.5">
            {rubric.map((r, i) => {
              const s = Math.max(0, Math.min(100, r.score ?? 0));
              return (
                <motion.div
                  key={r.name + i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="rounded-lg border border-border/60 bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                      {r.name}
                    </div>
                    <span className="font-display text-lg font-bold tabular-nums text-iscarb-ink dark:text-white">
                      {s}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)" }}
                    />
                  </div>
                  {(r.evidence || r.gap) && (
                    <div className="mt-2 grid gap-1 text-[11px] sm:grid-cols-2">
                      {r.evidence && (
                        <div className="flex items-start gap-1.5 text-iscarb-ink/70 dark:text-white/70">
                          <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-iscarb-green" />
                          <span>{r.evidence}</span>
                        </div>
                      )}
                      {r.gap && (
                        <div className="flex items-start gap-1.5 text-iscarb-gold-dark">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                          <span>{r.gap}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Firm remediation note when below standard */}
      {belowStandard && (
        <div className="rounded-xl border border-iscarb-gold/40 bg-iscarb-gold-soft/60 p-4">
          <div className="flex items-start gap-3">
            <Flame className="mt-0.5 size-5 text-iscarb-gold-dark" />
            <div>
              <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                {t("capstone.evalRes.belowTitle")}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t("capstone.evalRes.belowBodyLead")}{" "}
                <span className="font-semibold text-iscarb-ink dark:text-white">≥ 75</span>.
              </div>
              <div
                className={cn("mt-2 text-xs font-bold text-iscarb-gold-dark", ar ? "font-arabic" : "")}
                dir={ar ? "rtl" : "ltr"}
              >
                {ar ? "نهاية كل الأعذار — سلّم الليلة" : "The end of all excuses — submit tonight"}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({
  onGenerate,
  disabled,
}: {
  onGenerate: () => void;
  disabled: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-dashed border-border/70">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="relative">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-iscarb-green-soft text-iscarb-green shadow-brand">
            <Wand2 className="size-7" />
          </div>
          <Sparkles className="absolute -right-2 -top-2 size-5 text-iscarb-gold" />
        </div>
        <div>
          <div className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
            {t("capstone.empty.title")}
          </div>
          <div className="mt-1 max-w-md text-sm text-muted-foreground">
            {t("capstone.empty.body")}
          </div>
        </div>
        <Button
          onClick={onGenerate}
          disabled={disabled}
          className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
        >
          <Wand2 className="size-4" />
          {t("capstone.panel.generate")}
          <ArrowRight className="size-4" />
        </Button>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-iscarb-cyan" />
          {t("capstone.empty.aligned")}
        </div>
      </CardContent>
    </Card>
  );
}

export default CapstoneView;
