"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ChevronRight,
  CircleDot,
  Clock,
  Cpu,
  FlaskConical,
  Gauge,
  Layers,
  Loader2,
  Play,
  Sparkles,
  Terminal,
  Thermometer,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/use-fetch";

// ─────────────────────────────────────────────────────────────────────────────
//  Types — match API contracts for /api/iscarb/courses and /api/iscarb/pipeline/*
// ─────────────────────────────────────────────────────────────────────────────
interface UnitDTO {
  id: string;
  title: string;
  content: string;
  order: number;
}
interface CourseDTO {
  id: string;
  code: string;
  name: string;
  programType: string;
  nqfLevel: number;
  bloomTarget: string;
  domains: string;
  units: UnitDTO[];
}
interface AiPromptDTO {
  id: string;
  stage: string;
  modelTag: string;
  systemPrompt: string;
  userTemplate: string;
  temperature: number;
}
interface CoursesResponse {
  courses: CourseDTO[];
}
interface PromptResponse {
  prompt: AiPromptDTO | null;
  unit: UnitDTO;
}
interface RunResponse {
  stage: string;
  output: unknown;
  meta: { model: string; latencyMs: number; tokens?: number; confidence?: number };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Stage config
// ─────────────────────────────────────────────────────────────────────────────
const STAGES = [
  { key: "inform", title: "Inform", titleAr: "تعبئة", icon: Sparkles, color: "#00B4D8" },
  { key: "simulate", title: "Simulate", titleAr: "محاكاة", icon: Zap, color: "#1E8A5A" },
  { key: "comply", title: "Comply", titleAr: "امتثال", icon: FlaskConical, color: "#0096C7" },
  { key: "assess", title: "Assess", titleAr: "تقييم", icon: Gauge, color: "#FFB700" },
  { key: "brand", title: "Brand", titleAr: "تمكين", icon: Trophy, color: "#1E8A5A" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

// ─────────────────────────────────────────────────────────────────────────────
//  PipelineView
// ─────────────────────────────────────────────────────────────────────────────
export function PipelineView() {
  const { selectedCourseId, setSelectedCourse } = useApp();
  const { t, ar } = useI18n();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<StageKey>("inform");
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const { data: coursesData, loading: coursesLoading, error: coursesError } =
    useFetch<CoursesResponse>("/api/iscarb/courses");

  const courses = coursesData?.courses ?? [];

  // Derive the EFFECTIVE selection (defaulting to the first course, then to the
  // first unit of that course) WITHOUT writing to state in an effect. Explicit
  // user selection still updates the store / local state via the Select
  // onValueChange handlers below; the derived values simply provide the default.
  const effectiveCourseId = selectedCourseId ?? courses[0]?.id ?? null;
  const selectedCourse = courses.find((c) => c.id === effectiveCourseId) ?? null;
  const effectiveUnitId =
    selectedUnitId && selectedCourse?.units?.some((u) => u.id === selectedUnitId)
      ? selectedUnitId
      : selectedCourse?.units?.[0]?.id ?? null;

  // fetch prompt for unit + stage
  const promptUrl =
    effectiveUnitId && activeStage
      ? `/api/iscarb/pipeline/prompt?unitId=${encodeURIComponent(effectiveUnitId)}&stage=${activeStage}`
      : null;
  const { data: promptData, loading: promptLoading, error: promptError } =
    useFetch<PromptResponse>(promptUrl);

  // Reset run output DURING RENDER when stage or unit changes — the
  // React-recommended alternative to a setState-in-effect cascade.
  const runKey = `${activeStage}#${effectiveUnitId ?? "∅"}`;
  const [lastRunKey, setLastRunKey] = useState(runKey);
  if (runKey !== lastRunKey) {
    setLastRunKey(runKey);
    setRunResult(null);
    setRunError(null);
  }

  const handleRun = async () => {
    if (!effectiveUnitId) return;
    setRunning(true);
    setRunError(null);
    setRunResult(null);
    try {
      const res = await fetch(`/api/iscarb/pipeline/${activeStage}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: effectiveUnitId }),
      });
      if (!res.ok) throw new Error(`Run failed (${res.status})`);
      // The stage routes return a flat, domain-specific object (concepts /
      // decisionPoints / domains / score ...) plus meta fields at the top level.
      // Wrap it into the { stage, output, meta } envelope the renderer expects.
      const j = (await res.json()) as Record<string, unknown>;
      const usage = j.usage as { completionTokens?: number } | undefined;
      setRunResult({
        stage: activeStage,
        output: j,
        meta: {
          model: typeof j.model === "string" ? j.model : "—",
          latencyMs: typeof j.latencyMs === "number" ? j.latencyMs : 0,
          confidence: typeof j.confidence === "number" ? j.confidence : undefined,
          tokens:
            usage?.completionTokens ??
            (typeof j.tokens === "number" ? j.tokens : undefined),
        },
      });
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header
        title={t("pipeline.header.title")}
        subtitle={t("pipeline.header.subtitle")}
      />

      {/* ── selectors ─────────────────────────────────────────────────────── */}
      <Card className="mb-6 border-iscarb-green/15">
        <CardContent className="grid gap-3 pt-0 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("pipeline.course")}
            </label>
            <Select
              value={effectiveCourseId ?? undefined}
              onValueChange={(v) => {
                setSelectedCourse(v);
                const c = courses.find((x) => x.id === v);
                setSelectedUnitId(c?.units[0]?.id ?? null);
              }}
              disabled={coursesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={coursesLoading ? t("pipeline.loadingCourses") : t("pipeline.selectCourse")}
                />
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
              {t("pipeline.unit")}
            </label>
            <Select
              value={effectiveUnitId ?? undefined}
              onValueChange={(v) => setSelectedUnitId(v)}
              disabled={!selectedCourse?.units?.length}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("pipeline.selectUnit")} />
              </SelectTrigger>
              <SelectContent>
                {selectedCourse?.units?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            {selectedCourse && (
              <Badge variant="outline" className="border-iscarb-green/30 text-iscarb-green">
                NQF {selectedCourse.nqfLevel}
              </Badge>
            )}
            {selectedCourse && (
              <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan">
                {selectedCourse.bloomTarget}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {coursesError && <ErrorCard message={t("pipeline.err.courses")} />}

      {/* ── domain strip ───────────────────────────────────────────────────── */}
      {selectedCourse?.domains && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Layers className="size-3.5" />
          <span className="font-medium">{t("pipeline.domains")}</span>
          {selectedCourse.domains.split(",").map((d) => (
            <Badge key={d} variant="secondary" className="bg-iscarb-ink/5 text-iscarb-ink dark:bg-white/10 dark:text-white">
              {d.trim()}
            </Badge>
          ))}
        </div>
      )}

      {/* ── horizontal stepper ─────────────────────────────────────────────── */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-1">
          {STAGES.map((s, i) => {
            const isActive = activeStage === s.key;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => setActiveStage(s.key)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all",
                    isActive
                      ? "border-transparent text-white shadow-brand"
                      : "border-border bg-card hover:border-iscarb-green/30 hover:bg-iscarb-green-soft",
                  )}
                  style={isActive ? { backgroundColor: s.color } : undefined}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      isActive ? "bg-white/20" : "bg-iscarb-green-soft",
                    )}
                  >
                    <Icon className={cn("size-3.5", isActive ? "text-white" : "text-iscarb-green")} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      0{i + 1}
                    </span>
                    <span className="font-display text-sm font-bold">{t(`home.step.${s.key}`)}</span>
                  </div>
                  <span
                    className={cn("text-[10px] opacity-60", ar ? "" : "font-arabic")}
                    dir={ar ? "ltr" : "rtl"}
                  >
                    {ar
                      ? { inform: "Inform", simulate: "Simulate", comply: "Comply", assess: "Assess", brand: "Brand" }[s.key]
                      : s.titleAr}
                  </span>
                </button>
                {i < STAGES.length - 1 && (
                  <ChevronRight className="mx-1 size-4 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── prompt + run ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: prompt card */}
        <Card className="border-iscarb-green/15 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="size-4 text-iscarb-green" />
                AiPrompt · <span className="font-mono text-iscarb-cyan">{activeStage}</span>
              </CardTitle>
              {promptData?.prompt && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan">
                    <Cpu className="size-3" /> {promptData.prompt.modelTag}
                  </Badge>
                  <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">
                    <Thermometer className="size-3" /> {promptData.prompt.temperature.toFixed(2)}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {promptLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : promptError ? (
              <ErrorCard message={t("pipeline.err.prompt")} />
            ) : promptData?.prompt ? (
              <>
                <PromptBlock
                  label="systemPrompt"
                  text={promptData.prompt.systemPrompt}
                  color="#1E8A5A"
                />
                <PromptBlock
                  label="userTemplate"
                  text={promptData.prompt.userTemplate}
                  color="#00B4D8"
                />
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t("pipeline.promptEmpty")}
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {t("pipeline.promptLocked")}
              </div>
              <Button
                onClick={handleRun}
                disabled={running || !effectiveUnitId}
                className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
              >
                {running ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("pipeline.running")}
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    {t("pipeline.run")} {activeStage}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: run output */}
        <Card className="border-iscarb-cyan/15 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDot className="size-4 text-iscarb-cyan animate-pulse-soft" />
              {t("pipeline.stageOutputTitle")}
              {runResult && (
                <Badge variant="secondary" className="ml-1 bg-iscarb-green/10 text-iscarb-green">
                  {t("common.live")}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AnimatePresence mode="wait">
              {running ? (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-3 py-12 text-center"
                >
                  <Loader2 className="size-8 animate-spin text-iscarb-green" />
                  <div className="text-sm text-muted-foreground">
                    {t("pipeline.calling")} <span className="font-mono text-iscarb-cyan">{activeStage}</span>{" "}
                    {effectiveUnitId ? t("pipeline.thisUnit") : "—"}…
                  </div>
                </motion.div>
              ) : runError ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ErrorCard message={runError} />
                </motion.div>
              ) : runResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <RunMeta meta={runResult.meta} />
                  <RunOutput stage={runResult.stage} output={runResult.output} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-3 py-12 text-center"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-iscarb-green-soft">
                    <Play className="size-5 text-iscarb-green" />
                  </div>
                  <div className="max-w-xs text-sm text-muted-foreground">
                    {t("pipeline.empty")}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* ── unit content reference ────────────────────────────────────────── */}
      {selectedCourse?.units && (
        <Card className="mt-6 border-border/60">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">{t("pipeline.sourceUnit")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-44 w-full rounded-lg border border-border/60 bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                {selectedCourse.units.find((u) => u.id === effectiveUnitId)?.content ??
                  t("pipeline.noUnit")}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
        {t("pipeline.header.eyebrow")}
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function PromptBlock({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-iscarb-ink/[0.03] p-3 font-mono text-xs leading-relaxed text-iscarb-ink dark:bg-white/5 dark:text-white/90 scrollbar-iscarb">
        {text}
      </pre>
    </div>
  );
}

function RunMeta({ meta }: { meta: RunResponse["meta"] }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <MetricChip icon={Cpu} label={t("pipeline.meta.model")} value={meta.model} color="#1E8A5A" />
      <MetricChip
        icon={Clock}
        label={t("pipeline.meta.latency")}
        value={`${meta.latencyMs}ms`}
        color="#00B4D8"
      />
      {typeof meta.tokens === "number" && (
        <MetricChip icon={Activity} label={t("pipeline.meta.tokens")} value={`${meta.tokens}`} color="#0096C7" />
      )}
      {typeof meta.confidence === "number" && (
        <MetricChip
          icon={Gauge}
          label={t("pipeline.meta.confidence")}
          value={`${Math.round(meta.confidence * 100)}%`}
          color="#FFB700"
        />
      )}
    </div>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3" style={{ color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-iscarb-ink dark:text-white">
        {value}
      </div>
    </div>
  );
}

function RunOutput({ stage, output }: { stage: string; output: unknown }) {
  const { t } = useI18n();
  // Render different shapes per stage
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("pipeline.stageOutput", { stage })}
      </div>
      <StageRenderer stage={stage} output={output} />
    </div>
  );
}

function StageRenderer({ stage, output }: { stage: string; output: unknown }) {
  const { t } = useI18n();
  // The API may return either a structured payload or a {raw: "..."} fallback.
  const obj = (output ?? {}) as Record<string, unknown>;
  const hasStructured = Object.keys(obj).length > 0;

  if (!hasStructured) {
    return (
      <pre className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
        {t("pipeline.emptyOutput")}
      </pre>
    );
  }

  // Inform: concepts, misconceptions, clos
  if (stage === "inform") {
    return (
      <div className="space-y-3">
        <InformSection
          title={t("pipeline.inform.concepts")}
          color="#1E8A5A"
          items={asArray(obj.concepts).map((c) => ({
            title: String((c as Record<string, unknown>)?.name ?? "—"),
            body: String((c as Record<string, unknown>)?.explain ?? ""),
            why: String((c as Record<string, unknown>)?.why ?? ""),
          }))}
        />
        <InformSection
          title={t("pipeline.inform.misconceptions")}
          color="#FB5B45"
          items={asArray(obj.misconceptions).map((c) => ({
            title: String((c as Record<string, unknown>)?.wrong ?? "—"),
            body: String((c as Record<string, unknown>)?.why ?? ""),
            why: String(
              (c as Record<string, unknown>)?.correct ??
                (c as Record<string, unknown>)?.example ??
                "",
            ),
          }))}
          whyLabel={t("pipeline.why.correct")}
        />
        <InformSection
          title={t("pipeline.inform.clos")}
          color="#00B4D8"
          items={asArray(obj.clos).map((c) => ({
            title: String((c as Record<string, unknown>)?.id ?? "CLO"),
            body: String((c as Record<string, unknown>)?.statement ?? ""),
            why: String((c as Record<string, unknown>)?.bloom ?? ""),
          }))}
          whyLabel={t("pipeline.why.bloom")}
        />
      </div>
    );
  }

  // Simulate: high-level preview
  if (stage === "simulate") {
    return (
      <div className="space-y-2">
        <KV k={t("pipeline.kv.title")} v={obj.title} />
        <KV k={t("pipeline.kv.company")} v={obj.company} />
        <KV k={t("pipeline.kv.role")} v={obj.role} />
        <KV k={t("pipeline.kv.success")} v={obj.successCriteria} />
        <KV
          k={t("pipeline.kv.decisions")}
          v={t("pipeline.kv.branches", { n: asArray(obj.decisionPoints).length })}
        />
        <KV k={t("pipeline.kv.rubricDims")} v={t("pipeline.kv.axes", { n: asArray(obj.rubric).length })} />
      </div>
    );
  }

  // Comply: domains
  if (stage === "comply") {
    const domains = asArray(obj.domains);
    return (
      <div className="space-y-2">
        {domains.map((d, i) => {
          const dd = d as Record<string, unknown>;
          return (
            <div key={i} className="rounded-lg border border-iscarb-cyan/20 bg-iscarb-cyan-soft/40 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-iscarb-cyan/40 text-iscarb-cyan">
                  {String(dd.code ?? "—")}
                </Badge>
                <span className="text-sm font-semibold text-iscarb-ink dark:text-white">
                  {String(dd.authority ?? "")}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {t("pipeline.comply.clauses", { n: asArray(dd.clauses).length })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Assess: rubric scores
  if (stage === "assess") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="font-display text-4xl font-bold text-iscarb-ink dark:text-white">
            {typeof obj.score === "number" ? obj.score : "—"}
          </div>
          <div className="text-xs text-muted-foreground">{t("pipeline.assess.zeroShot")}</div>
        </div>
        <div className="space-y-1.5">
          {asArray(obj.rubric).map((r, i) => {
            const rr = r as Record<string, unknown>;
            const score = typeof rr.score === "number" ? rr.score : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-iscarb-ink dark:text-white">
                    {String(rr.name ?? "—")}
                  </span>
                  <span className="font-mono text-muted-foreground">{score}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score}%`,
                      background: "linear-gradient(90deg,#00B4D8,#FFB700)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Brand / default: raw JSON
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-iscarb-ink/[0.03] p-3 font-mono text-xs leading-relaxed text-iscarb-ink dark:bg-white/5 dark:text-white/90 scrollbar-iscarb">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

function InformSection({
  title,
  color,
  items,
  whyLabel,
}: {
  title: string;
  color: string;
  items: { title: string; body: string; why: string }[];
  whyLabel?: string;
}) {
  const { t } = useI18n();
  const resolvedWhy = whyLabel ?? t("pipeline.why.default");
  if (!items.length)
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        {t("pipeline.sectionEmpty")}
      </div>
    );
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-card p-2.5 text-sm"
          >
            <div className="font-semibold text-iscarb-ink dark:text-white">{it.title}</div>
            {it.body && <div className="mt-0.5 text-xs text-muted-foreground">{it.body}</div>}
            {it.why && (
              <div className="mt-1 text-xs">
                <span className="font-semibold text-iscarb-gold-dark">{resolvedWhy}:</span>{" "}
                <span className="text-muted-foreground">{it.why}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: unknown }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {k}
      </span>
      <span className="text-iscarb-ink dark:text-white">{String(v)}</span>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="alert-iron rounded-lg border-l-4 p-3 text-xs text-destructive">
      <div className="font-semibold">Pipeline error</div>
      <div className="mt-0.5 text-destructive/80">{message}</div>
    </div>
  );
}

function asArray(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) return v as Record<string, unknown>[];
  return [];
}

export default PipelineView;
