"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  GraduationCap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  listEmployabilityAttempts,
  type AttemptDimensionScore,
  type EmployabilityAttemptSnapshot,
} from "@/lib/assessment/attempt-report-store";
import {
  developmentSuggestionsForDimension,
  formatBandLabel,
} from "@/lib/assessment/dimension-report-sections";
import type { DimensionId } from "@/lib/assessment/framework";
import { ThomasGauge } from "@/components/iscarb/ScoreMeter";
import { cn } from "@/lib/utils";

interface ProfilePayload {
  studentId: string;
  name: string;
  email: string;
  specialty: string | null;
}

interface CategoryInsight {
  dimension: AttemptDimensionScore;
  tips: string[];
  attemptId: string;
  composite: number;
  computedAt: string;
}

function isDimensionId(id: string): id is DimensionId {
  return (
    id === "core_professionalism" ||
    id === "business_digital" ||
    id === "job_fit" ||
    id === "growth_potential"
  );
}

function pickHighestAttempt(
  attempts: EmployabilityAttemptSnapshot[],
): EmployabilityAttemptSnapshot | null {
  if (attempts.length === 0) return null;
  return [...attempts].sort((a, b) => {
    const scoreDiff = (b.profile?.composite ?? 0) - (a.profile?.composite ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime();
  })[0]!;
}

function buildInsights(attempt: EmployabilityAttemptSnapshot): {
  highest: CategoryInsight;
  lowest: CategoryInsight;
} | null {
  const dims = attempt.profile?.dimensions ?? [];
  if (dims.length === 0) return null;

  const sorted = [...dims].sort((a, b) => b.score - a.score);
  const highestDim = sorted[0]!;
  const lowestDim = sorted[sorted.length - 1]!;

  const chapters = attempt.dimensionChapters ?? [];

  const tipsFor = (
    dim: AttemptDimensionScore,
    kind: "maintain" | "improve",
  ): string[] => {
    const chap = chapters.find((c) => c.id === dim.dimension);
    if (kind === "maintain") {
      const fromChapter = (chap?.strengths ?? [])
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2);
      if (fromChapter.length > 0) {
        return [
          ...fromChapter,
          ...(isDimensionId(dim.dimension)
            ? developmentSuggestionsForDimension(dim.dimension, dim.band).slice(0, 1)
            : []),
        ].slice(0, 3);
      }
    } else {
      const fromChapter = (chap?.improvements ?? [])
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2);
      if (fromChapter.length > 0) {
        return [
          ...fromChapter,
          ...(isDimensionId(dim.dimension)
            ? developmentSuggestionsForDimension(dim.dimension, dim.band).slice(0, 1)
            : []),
        ].slice(0, 3);
      }
    }

    if (isDimensionId(dim.dimension)) {
      return developmentSuggestionsForDimension(dim.dimension, dim.band).slice(0, 3);
    }
    return kind === "maintain"
      ? ["Keep practicing the habits that earned this category lead — consistency protects the score."]
      : ["Focus deliberate practice on this category’s fundamentals and reassess after targeted drills."];
  };

  return {
    highest: {
      dimension: highestDim,
      tips: tipsFor(highestDim, "maintain"),
      attemptId: attempt.id,
      composite: attempt.profile.composite,
      computedAt: attempt.computedAt,
    },
    lowest: {
      dimension: lowestDim,
      tips: tipsFor(lowestDim, "improve"),
      attemptId: attempt.id,
      composite: attempt.profile.composite,
      computedAt: attempt.computedAt,
    },
  };
}

export default function ProfilePage() {
  const { lang } = useApp();
  const { studentId } = useSession();
  const ar = lang === "ar";

  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<EmployabilityAttemptSnapshot[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/iscarb/student/profile");
        const json = (await res.json()) as {
          success?: boolean;
          data?: ProfilePayload;
          error?: string;
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || "Failed to load profile");
        }
        if (!cancelled) setProfile(json.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load profile");
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!studentId) {
      setAttempts([]);
      return;
    }
    setAttempts(listEmployabilityAttempts(studentId));
  }, [studentId]);

  const insights = useMemo(() => {
    if (!attempts) return null;
    const best = pickHighestAttempt(attempts);
    if (!best) return null;
    return buildInsights(best);
  }, [attempts]);

  const initials = (profile?.name || "S")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <PageHeader
        title={ar ? "الملف الشخصي" : "Profile"}
        description={
          ar
            ? "حسابك وأبرز رؤى أدائك من أفضل محاولة تقييم"
            : "Your account and performance insights from your strongest assessment attempt"
        }
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/assessment/employability" },
          { label: ar ? "الملف الشخصي" : "Profile", href: "/student/profile" },
        ]}
      />

      <div
        className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8"
        dir={ar ? "rtl" : "ltr"}
      >
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : profile ? (
          <>
            {/* Account identity */}
            <section className="relative overflow-hidden rounded-2xl border border-iscarb-green/20 bg-gradient-to-br from-iscarb-green/10 via-card to-card shadow-sm">
              <div className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-iscarb-green/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -start-10 size-40 rounded-full bg-emerald-400/10 blur-2xl" />

              <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-iscarb-green text-xl font-bold text-white shadow-md shadow-iscarb-green/25 sm:size-20 sm:text-2xl">
                  {initials || <User className="size-8" />}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-iscarb-green">
                      {ar ? "حساب الطالب" : "Student account"}
                    </p>
                    <h2 className="mt-1 break-words font-display text-2xl font-semibold tracking-tight text-iscarb-ink dark:text-white sm:text-3xl">
                      {profile.name}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                    <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-iscarb-ink dark:text-white">
                      <Mail className="size-4 shrink-0 text-iscarb-green" />
                      <span className="truncate">{profile.email || "—"}</span>
                    </div>
                    <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-iscarb-ink dark:text-white">
                      <GraduationCap className="size-4 shrink-0 text-iscarb-green" />
                      <span className="truncate">
                        {profile.specialty || (ar ? "غير محدد" : "Specialty not set")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Performance insights */}
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-iscarb-green">
                    <Sparkles className="size-3.5" />
                    {ar ? "رؤى الأداء" : "Performance insights"}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-iscarb-ink dark:text-white">
                    {ar
                      ? "من أعلى محاولة تقييم"
                      : "From your highest-scoring attempt"}
                  </h3>
                </div>
                {insights ? (
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {new Date(insights.highest.computedAt).toLocaleDateString(
                      ar ? "ar-SA" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </p>
                ) : null}
              </div>

              {attempts === null ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-56 w-full rounded-2xl" />
                  <Skeleton className="h-56 w-full rounded-2xl" />
                </div>
              ) : !insights ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
                  <Target className="mx-auto mb-3 size-10 text-muted-foreground/45" />
                  <p className="font-display text-lg font-semibold text-iscarb-ink dark:text-white">
                    {ar
                      ? "أكمل تقييماً لعرض الرؤى"
                      : "Complete an assessment to see insights"}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    {ar
                      ? "بعد إنهاء امتحان القابلية للتوظيف، سنعرض هنا أعلى وأدنى فئة لديك مع نصائح للحفاظ والتحسين."
                      : "After you finish an employability exam, we’ll show your strongest and weakest categories here — with tips to maintain and improve."}
                  </p>
                  <Button
                    asChild
                    className="mt-6 h-11 cursor-pointer gap-2 rounded-xl bg-iscarb-green font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-iscarb-green-dark hover:shadow-md"
                  >
                    <Link href="/assessment/employability">
                      {ar ? "بدء التقييم" : "Start Assessment"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightCard
                    kind="highest"
                    ar={ar}
                    insight={insights.highest}
                  />
                  <InsightCard
                    kind="lowest"
                    ar={ar}
                    insight={insights.lowest}
                  />
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}

function InsightCard({
  kind,
  ar,
  insight,
}: {
  kind: "highest" | "lowest";
  ar: boolean;
  insight: CategoryInsight;
}) {
  const isHigh = kind === "highest";
  const dim = insight.dimension;
  const label = ar ? dim.labelAr || dim.label : dim.label;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
        isHigh
          ? "border-emerald-200/80 dark:border-emerald-900/40"
          : "border-amber-200/80 dark:border-amber-900/40",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-3 px-5 py-4 sm:px-6",
          isHigh
            ? "bg-gradient-to-r from-iscarb-green/15 to-transparent"
            : "bg-gradient-to-r from-amber-500/10 to-transparent",
        )}
      >
        <div className="min-w-0 flex-1 pt-0.5">
          <div
            className={cn(
              "mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
              isHigh
                ? "border-iscarb-green/30 bg-iscarb-green/10 text-iscarb-green"
                : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
            )}
          >
            {isHigh ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {isHigh
              ? ar
                ? "أعلى فئة"
                : "Highest category"
              : ar
                ? "أدنى فئة"
                : "Lowest category"}
          </div>
          <h4 className="font-display text-lg font-semibold leading-snug text-iscarb-ink dark:text-white">
            {label}
          </h4>
        </div>
        <div className="w-[108px] shrink-0">
          <ThomasGauge
            score={dim.score}
            label={formatBandLabel(dim.band)}
            size="sm"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isHigh
              ? ar
                ? "كيف تحافظ عليها"
                : "How to maintain it"
              : ar
                ? "كيف تحسّنها"
                : "How to improve it"}
          </p>
          <ul className="mt-2.5 space-y-2.5">
            {insight.tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm leading-relaxed text-iscarb-ink/90 dark:text-white/90"
              >
                <span
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    isHigh ? "bg-iscarb-green" : "bg-amber-600",
                  )}
                />
                <span className="min-w-0 break-words">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-1">
          <Button
            asChild
            variant="outline"
            className="h-10 w-full cursor-pointer gap-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm sm:w-auto"
          >
            <Link href={`/student/results/${insight.attemptId}`}>
              {ar ? "عرض التقرير" : "View report"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
