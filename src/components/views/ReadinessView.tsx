"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Flame,
  Gauge,
  GraduationCap,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
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
interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  hint?: string;
}
interface GapItem {
  dimension: string;
  gap: number;
  action: string;
}
interface ReadinessDetailResponse {
  student: StudentBrief & {
    program?: string;
    generatedTitle?: string;
    titleAr?: string;
    cluster?: string;
    matchScore?: number;
  };
  score: number;
  percentile: number; // 0..100 — % of cohort below
  topDecile: number; // threshold
  cohortAverage: number;
  dimensions: DimensionScore[];
  gaps: GapItem[];
  signals?: { skill: string; demandIndex: number; employer: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  ReadinessView
// ─────────────────────────────────────────────────────────────────────────────
function CohortRow({
  s,
  i,
  total,
  topDecile,
  selectedStudentId,
  setSelectedStudent,
}: {
  s: StudentBrief;
  i: number;
  total: number;
  topDecile: number;
  selectedStudentId: string | null;
  setSelectedStudent: (id: string) => void;
}) {
  const isSel = s.id === selectedStudentId;
  const pct = total ? Math.round(((total - i) / total) * 100) : 0;
  const isTop = s.readinessScore >= topDecile;
  return (
    <button
      onClick={() => setSelectedStudent(s.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
        isSel
          ? "border-iscarb-green/40 bg-iscarb-green-soft/50 shadow-brand"
          : "border-border/60 bg-card hover:border-iscarb-green/30 hover:bg-iscarb-green-soft/20",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isTop ? "bg-iscarb-gold text-white" : i === 0 ? "bg-iscarb-green text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {i + 1}
      </span>
      <Avatar className="size-7">
        <AvatarFallback className="bg-iscarb-cyan-soft text-[10px] font-bold text-iscarb-cyan">
          {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-iscarb-ink dark:text-white">{s.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">{s.program} · P{pct}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
          <div className="h-full rounded-full" style={{ width: `${s.readinessScore}%`, background: "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)" }} />
        </div>
        <span className={cn("font-display text-lg font-bold tabular-nums", isTop ? "text-iscarb-gold-dark" : "text-iscarb-ink dark:text-white")}>
          {s.readinessScore}
        </span>
        {isTop && <Trophy className="size-4 text-iscarb-gold" />}
        {isSel && <CheckCircle2 className="size-4 text-iscarb-green" />}
      </div>
    </button>
  );
}

export function ReadinessView() {
  const { selectedStudentId, setSelectedStudent } = useApp();
  const { t, ar } = useI18n();
  const [showAllCohort, setShowAllCohort] = useState(false);

  const { data: studentsData, isLoading: studentsLoading, error: studentsError } =
    useApiQuery<StudentsResponse>(["students"], "/api/iscarb/students");
  const students = studentsData?.students ?? [];

  // auto-pick first student
  useEffect(() => {
    if (students.length && !selectedStudentId) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudentId, setSelectedStudent]);

  // Per-student detail — fetched only after a student is selected. React Query
  // dedupes + caches this under ["iscarb","readiness",studentId], so re-selecting
  // a previously-viewed student renders instantly from the cache.
  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useApiQuery<ReadinessDetailResponse>(
    ["readiness", selectedStudentId ?? ""],
    selectedStudentId
      ? `/api/iscarb/readiness?studentId=${encodeURIComponent(selectedStudentId)}`
      : "/api/iscarb/readiness",
    { enabled: !!selectedStudentId },
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const score = detail?.score ?? selectedStudent?.readinessScore ?? 0;
  const percentile = detail?.percentile ?? 65;
  // Honest fallbacks: until the cohort detail loads, fall back to the student's
  // own score (gap/above become 0) rather than inventing 88 / 71.
  const topDecile = detail?.topDecile ?? score;
  const cohortAverage = detail?.cohortAverage ?? score;
  const gapToTop = Math.max(0, topDecile - score);
  const aboveCohort = score - cohortAverage;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      {/* ── student selector + banner ─────────────────────────────────────── */}
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
                    placeholder={
                      studentsLoading
                        ? t("readiness.selector.loading")
                        : t("readiness.selector.placeholder")
                    }
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
                  {selectedStudent.cohort}
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Motivational banner */}
      <div className="relative mb-6 overflow-hidden rounded-xl bg-iscarb-ink text-white shadow-brand">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-10" />
        <div className="relative flex flex-col items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Flame className="size-5 text-iscarb-gold" />
            <div>
              <div
                className={cn("text-lg font-bold", ar ? "font-arabic" : "")}
                dir={ar ? "rtl" : "ltr"}
              >
                {ar ? "أنا أستطيع، أنا سأفعل" : "I can, I will."}
              </div>
              <div
                className={cn("text-[11px] uppercase tracking-[0.18em] text-white/60", ar ? "" : "font-arabic")}
                dir={ar ? "ltr" : "rtl"}
              >
                {ar ? "I can, I will." : "أنا أستطيع، أنا سأفعل"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-iscarb-gold">
              {t("readiness.banner.topThreshold")}
            </div>
            <div className="font-display text-2xl font-bold">{topDecile}</div>
          </div>
        </div>
      </div>

      {studentsError && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          {t("readiness.err.students")}
        </div>
      )}

      {detailError && !detail && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          <div className="font-semibold">{t("readiness.err.detail")}</div>
          <div className="text-destructive/80">{detailError?.message ?? t("readiness.err.failed")}</div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* ── LEFT: the ring + cohort context ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-iscarb-green/15 shadow-brand">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Gauge className="size-4 text-iscarb-green" />
                  {t("readiness.ring.title")}
                </span>
                <Badge className="bg-iscarb-gold-soft text-iscarb-gold-dark" variant="secondary">
                  0–100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center py-4">
                {detailLoading ? (
                  <Skeleton className="h-56 w-56 rounded-full" />
                ) : (
                  <ReadinessRing score={score} size={220} label={t("readiness.ring.label")} />
                )}
                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                  <CohortStat
                    label={t("readiness.stat.you")}
                    value={score}
                    tone={score >= topDecile ? "top" : score >= cohortAverage ? "mid" : "low"}
                  />
                  <CohortStat label={t("readiness.stat.cohortAvg")} value={cohortAverage} tone="neutral" />
                  <CohortStat label={t("readiness.stat.topDecile")} value={topDecile} tone="top" />
                </div>
                <div
                  className={cn(
                    "mt-4 w-full rounded-lg border p-3 text-xs",
                    gapToTop === 0
                      ? "border-iscarb-green/40 bg-iscarb-green-soft"
                      : gapToTop <= 8
                        ? "border-iscarb-gold/40 bg-iscarb-gold-soft"
                        : "border-destructive/30 bg-red-50 dark:bg-red-950/20",
                  )}
                >
                  {gapToTop === 0 ? (
                    <div className="flex items-center gap-2 text-iscarb-green">
                      <Trophy className="size-4" />
                      <span className="font-semibold">{t("readiness.gap.reached")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="size-4 text-iscarb-gold-dark" />
                      <span className="font-semibold text-iscarb-ink dark:text-white">
                        {t("readiness.gap.points", { n: gapToTop })}
                      </span>
                      <span className="text-muted-foreground">
                        {t("readiness.gap.vsCohort", {
                          x: `${aboveCohort >= 0 ? "+" : ""}${aboveCohort}`,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-2" />

              {/* Percentile bar */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{t("readiness.pct.label")}</span>
                  <span className="text-iscarb-ink dark:text-white">
                    P{Math.round(percentile)}
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, Math.min(100, percentile))}%`,
                      background: "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)",
                    }}
                  />
                  {/* top decile marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-iscarb-ink dark:bg-white"
                    style={{ left: "90%" }}
                    title="Top decile"
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{t("readiness.pct.bottom")}</span>
                  <span className="text-iscarb-gold-dark">{t("readiness.pct.topCut")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── RIGHT: dimensions + gaps ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Dimensions */}
          <Card className="border-iscarb-cyan/15 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-iscarb-cyan" />
                {t("readiness.dims.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {t("readiness.dims.intro")}
              </p>
              {detailLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : detail?.dimensions?.length ? (
                <div className="space-y-2.5">
                  {detail.dimensions.map((d, i) => (
                    <DimensionRow key={d.name} dim={d} index={i} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center">
                  <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                    {t("readiness.dims.emptyTitle")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("readiness.dims.emptyBody")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gaps to top decile */}
          <Card className="border-iscarb-gold/30 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-iscarb-gold-dark" />
                  {t("readiness.gaps.title")}
                </span>
                <Badge variant="secondary" className="bg-iscarb-gold-soft text-iscarb-gold-dark">
                  {t("readiness.gaps.count", { n: detail?.gaps?.length ?? 0 })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {detailLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : detail?.gaps?.length ? (
                detail.gaps.map((g, i) => <GapRow key={i} gap={g} index={i} />)
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center">
                  <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
                    {t("readiness.gaps.emptyTitle")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("readiness.gaps.emptyBody")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career projection + market signals */}
          {detail?.student?.generatedTitle && (
            <Card className="border-iscarb-green/15 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-iscarb-green" />
                  {t("readiness.career.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="rounded-lg border border-iscarb-green/20 bg-iscarb-green-soft/40 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-iscarb-green">
                    {t("readiness.career.aiTitle")}
                  </div>
                  <div className="mt-1 font-display text-lg font-bold text-iscarb-ink dark:text-white">
                    {detail.student.generatedTitle}
                  </div>
                  {detail.student.titleAr && (
                    <div className="font-arabic text-sm text-muted-foreground" dir="rtl">
                      {detail.student.titleAr}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan">
                      {detail.student.cluster ?? "Financial Services"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {t("readiness.career.match")}{" "}
                      <span className="font-bold text-iscarb-ink dark:text-white">
                        {Math.round((detail.student.matchScore ?? 0.8) * 100)}%
                      </span>
                    </span>
                  </div>
                </div>
                {detail.signals && detail.signals.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="size-3" /> {t("readiness.career.demand")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detail.signals.map((s, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-iscarb-ink/5 text-iscarb-ink dark:bg-white/10 dark:text-white"
                        >
                          {s.skill} @ {s.employer}
                          <span className="ml-1 text-iscarb-green">{s.demandIndex}%</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── cohort table ───────────────────────────────────────────────────── */}
      <Card className="mt-6 border-border/60">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-iscarb-green" />
            {t("readiness.cohort.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1.5">
            {(() => {
              const sorted = students.slice().sort((a, b) => b.readinessScore - a.readinessScore);
              const VISIBLE = 5;
              const visible = sorted.slice(0, VISIBLE);
              const rest = sorted.slice(VISIBLE);
              return (
                <Collapsible open={showAllCohort} onOpenChange={setShowAllCohort}>
                  {visible.map((s, i) => (
                    <CohortRow key={s.id} s={s} i={i} total={sorted.length} topDecile={topDecile} selectedStudentId={selectedStudentId} setSelectedStudent={setSelectedStudent} />
                  ))}
                  {rest.length > 0 && (
                    <>
                      <CollapsibleContent className="space-y-1.5">
                        {rest.map((s, i) => (
                          <CohortRow key={s.id} s={s} i={i + VISIBLE} total={sorted.length} topDecile={topDecile} selectedStudentId={selectedStudentId} setSelectedStudent={setSelectedStudent} />
                        ))}
                      </CollapsibleContent>
                      <CollapsibleTrigger className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground">
                        {showAllCohort ? t("readiness.cohort.showLess") : t("readiness.cohort.showMore", { n: rest.length })}
                        <ChevronDown className={`size-3.5 transition-transform ${showAllCohort ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                    </>
                  )}
                </Collapsible>
              );
            })()}
            {studentsLoading && (
              <div className="space-y-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer discipline memo */}
      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-iscarb-gold/30 bg-iscarb-gold-soft/40 p-4">
        <div className="flex items-start gap-3">
          <Flame className="mt-0.5 size-5 text-iscarb-gold-dark" />
          <div>
            <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
              {t("readiness.memo.title")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("readiness.memo.body")}
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <div
            className={cn("text-sm font-bold text-iscarb-gold-dark", ar ? "font-arabic" : "")}
            dir={ar ? "rtl" : "ltr"}
          >
            {ar ? "نهاية كل الأعذار" : "The end of all excuses"}
          </div>
          <div
            className={cn("text-[10px] uppercase tracking-wider text-muted-foreground", ar ? "" : "font-arabic")}
            dir={ar ? "ltr" : "rtl"}
          >
            {ar ? "The end of all excuses" : "نهاية كل الأعذار"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Header() {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
        {t("readiness.header.eyebrow")}
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
        {t("readiness.header.title")}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {t("readiness.header.subtitle")}
      </p>
    </div>
  );
}

function CohortStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "top" | "mid" | "low" | "neutral";
}) {
  const colorMap: Record<typeof tone, string> = {
    top: "text-iscarb-green",
    mid: "text-iscarb-cyan",
    low: "text-destructive",
    neutral: "text-iscarb-ink dark:text-white",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-0.5 font-display text-xl font-bold tabular-nums", colorMap[tone])}>
        {value}
      </div>
    </div>
  );
}

const DIMENSION_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  "Technical capability": { icon: Cpu, color: "#00B4D8" },
  "Regulatory alignment": { icon: ShieldCheck, color: "#1E8A5A" },
  "Decision quality": { icon: TrendingUp, color: "#FFB700" },
  "Market relevance": { icon: Target, color: "#0096C7" },
  // Dimensions emitted by /api/iscarb/readiness
  "Participation quality": { icon: Users, color: "#00B4D8" },
  "Prompt-craft": { icon: Cpu, color: "#0096C7" },
  "Project evaluation": { icon: CheckCircle2, color: "#1E8A5A" },
  Attendance: { icon: Building2, color: "#FFB700" },
  "Career alignment": { icon: Target, color: "#1E8A5A" },
};

function DimensionRow({ dim, index }: { dim: DimensionScore; index: number }) {
  const { t } = useI18n();
  const meta = DIMENSION_META[dim.name] ?? {
    icon: Gauge,
    color: ["#00B4D8", "#1E8A5A", "#FFB700", "#0096C7"][index % 4],
  };
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-lg border border-border/60 bg-card p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
          >
            <Icon className="size-3.5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
              {dim.name}
            </div>
            {dim.hint && (
              <div className="text-[11px] text-muted-foreground">{dim.hint}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {t("readiness.dims.wt", { n: Math.round(dim.weight * 100) })}
          </Badge>
          <span className="font-display text-xl font-bold tabular-nums text-iscarb-ink dark:text-white">
            {dim.score}
          </span>
        </div>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dim.score}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)" }}
        />
      </div>
    </motion.div>
  );
}

function GapRow({ gap, index }: { gap: GapItem; index: number }) {
  const { t } = useI18n();
  const intensity = Math.min(1, gap.gap / 15);
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-lg border border-iscarb-gold/30 bg-iscarb-gold-soft/40 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-iscarb-gold font-display text-xs font-bold text-white">
            {index + 1}
          </span>
          <div>
            <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
              {gap.dimension}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{gap.action}</div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-lg font-bold text-iscarb-gold-dark">
            −{gap.gap}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("readiness.gaps.pts")}
          </div>
          <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-iscarb-gold"
              style={{ width: `${Math.max(15, intensity * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ReadinessView;
