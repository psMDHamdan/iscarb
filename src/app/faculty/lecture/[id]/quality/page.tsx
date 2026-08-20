"use client";

/**
 * Quality Gates Dashboard — BRD SVC-07, FR-012/013.
 * ===========================================================================
 * Real-time quality gate dashboard that:
 *   - Reads persisted gate results from DB (GET /gates)
 *   - Polls every 10s for live updates
 *   - Allows re-running gates via POST /validate
 *   - Shows live status when gates are being re-run
 *   - Supports waiving warning gates
 *
 * The page auto-refreshes when:
 *   - Gates are re-run
 *   - A gate is waived
 *   - The project status changes (e.g., after generation completes)
 */

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GateStatusRow } from "@/components/lecture/GateStatusRow";
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
  Zap,
} from "lucide-react";
import { GATE_KEYS, type GateResult } from "@/lib/lecture/quality/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GatesResponse {
  projectId: string;
  passCount: number;
  failCount: number;
  warnCount: number;
  blockers: GateResult[];
  warnings: GateResult[];
  passed: GateResult[];
  lastCheckedAt: string | null;
}

interface ValidateResponse {
  projectId: string;
  passCount: number;
  failCount: number;
  warnCount: number;
  blockers: GateResult[];
  warnings: GateResult[];
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Polling config
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 10_000; // 10s for gate results

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function QualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";

  // ── Read persisted gate results (real-time polling) ───────────────────
  const { data: gatesData, isLoading: gatesLoading, refetch: refetchGates, dataUpdatedAt } = useApiQuery<GatesResponse>(
    ["lecture", "gates", id],
    `/api/iscarb/lecture/projects/${id}/gates`,
    {
      staleTime: 0,
      refetchInterval: POLL_INTERVAL,
    },
  );

  // ── Re-run all gates ──────────────────────────────────────────────────
  const run = useApiMutation<ValidateResponse, { gates?: string[] }>(
    `/api/iscarb/lecture/projects/${id}/validate`,
    {
      invalidateKeys: () => [["lecture", "gates", id]],
      onSuccess: () => {
        // Force immediate refetch after re-running gates
        setTimeout(() => refetchGates(), 300);
      },
    },
  );

  // ── Waive a warning gate ──────────────────────────────────────────────
  const waive = useApiMutation<
    { gateKey: string; status: string },
    { gateKey: string; reason: string }
  >(
    (vars) => `/api/iscarb/lecture/projects/${id}/gates/${vars.gateKey}/waive`,
    {
      invalidateKeys: () => [["lecture", "gates", id]],
      onSuccess: () => {
        setTimeout(() => refetchGates(), 200);
      },
    },
  );

  // ── Derived data ──────────────────────────────────────────────────────
  // Merge: run.data (from POST /validate) takes precedence, fallback to gatesData (from GET /gates)
  const data = run.data
    ? { ...run.data, lastCheckedAt: run.data.checkedAt, passed: [] as GateResult[] }
    : gatesData;
  const running = run.isPending;
  const hasGates = data && data.blockers !== undefined;
  const passCount = data?.passCount ?? 0;
  const failCount = data?.failCount ?? 0;
  const warnCount = data?.warnCount ?? 0;
  const totalGates = GATE_KEYS.length;
  const allPassed = failCount === 0 && hasGates;
  const progressPct = hasGates ? Math.round((passCount / totalGates) * 100) : 0;

  // ── Time since last check ─────────────────────────────────────────────
  const [timeSinceCheck, setTimeSinceCheck] = useState("");
  useEffect(() => {
    const lastChecked = data?.lastCheckedAt ? new Date(data.lastCheckedAt).getTime() : dataUpdatedAt;
    if (!lastChecked) return;
    const tick = () => {
      const secs = Math.round((Date.now() - lastChecked) / 1000);
      if (secs < 5) setTimeSinceCheck(ar ? "الآن" : "Just now");
      else if (secs < 60) setTimeSinceCheck(ar ? `منذ ${secs}ث` : `${secs}s ago`);
      else if (secs < 3600) setTimeSinceCheck(ar ? `منذ ${Math.floor(secs / 60)}د` : `${Math.floor(secs / 60)}m ago`);
      else setTimeSinceCheck(ar ? `منذ ${Math.floor(secs / 3600)}س` : `${Math.floor(secs / 3600)}h ago`);
    };
    tick();
    const timer = setInterval(tick, 5_000);
    return () => clearInterval(timer);
  }, [data?.lastCheckedAt, dataUpdatedAt, ar]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleRerunGates = () => {
    run.mutate({});
  };

  return (
    <div className="space-y-8 pb-32">
      <PageHeader
        title={ar ? "بوابات الجودة" : "Quality Gates"}
        description={
          running
            ? ar
              ? "جاري إعادة تشغيل جميع البوابات..."
              : "Re-running all quality gates..."
            : ar
              ? `${totalGates} بوابة تحقق حتمية — آخر فحص: ${timeSinceCheck}`
              : `${totalGates} deterministic gates — last check: ${timeSinceCheck}`
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "بوابات الجودة" : "Quality Gates" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            {hasGates && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {timeSinceCheck}
              </div>
            )}
            <Button
              onClick={handleRerunGates}
              disabled={running}
              className="bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] hover:opacity-90 text-white shadow-lg shadow-[#0E6C3C]/20"
            >
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {ar ? "إعادة الفحص" : running ? "Running..." : `Re-run All ${totalGates} Gates`}
            </Button>
          </div>
        }
      />

      {/* ── Loading State ─────────────────────────────────────────────── */}
      {gatesLoading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {/* ── Error State ───────────────────────────────────────────────── */}
      {run.isError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-sm text-red-500" role="alert">
            {run.error.message}
          </CardContent>
        </Card>
      )}

      {/* ── Running Overlay ───────────────────────────────────────────── */}
      {running && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {ar ? "جاري تشغيل بوابات الجودة الـ 16..." : `Running all ${totalGates} quality gates...`}
            </span>
            <span className="text-xs text-emerald-600/70 ml-auto">
              {ar ? "قد يستغرق هذا بضع ثوانٍ" : "This may take a few seconds"}
            </span>
          </CardContent>
        </Card>
      )}

      {/* ── Summary Metric Cards ──────────────────────────────────────── */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Progress Ring */}
            <Card className={`border shadow-md rounded-2xl ${allPassed ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10" : "border-border/50"}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-800" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke="currentColor" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(progressPct / 100) * 175.9} 175.9`}
                      className={allPassed ? "text-emerald-500" : progressPct > 50 ? "text-amber-500" : "text-red-500"}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
                    {progressPct}%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    {ar ? "التقدم" : "Progress"}
                  </p>
                  <p className="text-lg font-display font-black text-foreground">
                    {passCount} / {totalGates}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pass Count */}
            <Card className="border border-emerald-500/30 shadow-md rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                    {passCount}
                  </p>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {ar ? "ناجحة" : "Passed"}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
              </CardContent>
            </Card>

            {/* Fail Count */}
            <Card className={`border shadow-md rounded-2xl ${failCount > 0 ? "border-red-500/30 bg-red-500/5" : "border-border/50"}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-black tabular-nums text-red-600 dark:text-red-400">
                    {failCount}
                  </p>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 mt-0.5">
                    {ar ? "معطلة" : "Blockers"}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500/30" />
              </CardContent>
            </Card>

            {/* Warn Count */}
            <Card className={`border shadow-md rounded-2xl ${warnCount > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-border/50"}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-black tabular-nums text-amber-600 dark:text-amber-400">
                    {warnCount}
                  </p>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-0.5">
                    {ar ? "تحذيرات" : "Warnings"}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500/30" />
              </CardContent>
            </Card>
          </div>

          {/* ── ALL PASSED CELEBRATION ──────────────────────────────────── */}
          {allPassed && (
            <Card className="border border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 via-emerald-50/50 dark:via-slate-900 to-teal-500/10 shadow-xl rounded-2xl p-8 overflow-hidden">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 p-0">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                        {ar ? `${totalGates}/${totalGates} بوابات ناجحة` : `${totalGates}/${totalGates} Quality Gates Passed!`}
                      </h3>
                      <Badge className="bg-[#0E6C3C] text-white text-xs font-bold px-3 py-1">iSCARB Verified</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                      {ar
                        ? "المحاضرة متوافقة مع جميع معايير الجودة الحتمية. جاهزة للنشر."
                        : "Lecture satisfies all deterministic quality rules. Ready to publish."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/faculty/lecture/${id}/inbox`}>
                    <Button variant="outline" className="text-slate-700 dark:text-slate-300 font-extrabold text-sm h-12 rounded-xl border-slate-300">
                      {ar ? "صندوق القرارات" : "Decision Inbox"}
                    </Button>
                  </Link>
                  <Link href={`/faculty/lecture/${id}/publish`}>
                    <Button className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-xl shadow-[#0E6C3C]/20 px-7 py-6 rounded-xl font-black text-sm">
                      {ar ? "النشر والتصدير" : "Publish & Export"} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── BLOCKER GATES ──────────────────────────────────────────── */}
          {data.blockers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-display font-black flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                {ar ? "بوابات حرجة معطلة" : "Critical Blockers"} ({data.blockers.length})
              </h2>
              {data.blockers.map((g) => (
                <GateStatusRow
                  key={g.gateKey}
                  gate={g}
                  fixHref={`/faculty/lecture/${id}/inbox`}
                  onWaive={(reason) => void waive.mutate({ gateKey: g.gateKey, reason })}
                />
              ))}
            </div>
          )}

          {/* ── WARNINGS ───────────────────────────────────────────────── */}
          {data.warnings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-display font-black flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                {ar ? "تحذيرات" : "Warnings"} ({data.warnings.length})
              </h2>
              {data.warnings.map((g) => (
                <GateStatusRow
                  key={g.gateKey}
                  gate={g}
                  fixHref={`/faculty/lecture/${id}/inbox`}
                  onWaive={(reason) => void waive.mutate({ gateKey: g.gateKey, reason })}
                />
              ))}
            </div>
          )}

          {/* ── PASSED GATES (collapsed) ──────────────────────────────── */}
          {data.passed.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-bold text-emerald-600 flex items-center gap-2 hover:text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {ar ? `بوابات ناجحة (${data.passed.length})` : `Passed Gates (${data.passed.length})`}
                <span className="text-xs text-muted-foreground group-open:hidden ml-2">{ar ? "اضغط للعرض" : "Click to expand"}</span>
              </summary>
              <div className="space-y-2 mt-3 opacity-80">
                {data.passed.map((g: any) => (
                  <GateStatusRow
                    key={g.gateKey}
                    gate={g}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
