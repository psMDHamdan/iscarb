"use client";

/**
 * Jaheziah National Alignment Page — BRD SVC-06, FR-016.
 * ===========================================================================
 * Real-time alignment matrix dashboard that:
 *   - Polls eligibility, matrix, and national standards every 10s
 *   - Auto-refreshes after mutations
 *   - Shows live approval status
 */

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignmentMatrixTable, type AlignmentMatrixRow, officialJaheziahHeading, boundOfficialOutcomeCount } from "@/components/lecture/AlignmentMatrixTable";
import { NationalAlignmentBanner } from "@/components/lecture/NationalAlignmentBanner";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Layers,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EligibilityResponse {
  mode: string;
  candidateSpecialtyKey?: string | null;
  confidence?: number | null;
  rationale?: string | null;
  requiredAction?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
}

interface MatrixResponse {
  mode: string;
  rows: AlignmentMatrixRow[];
}

interface NationalStandardsResponse {
  synced: boolean;
  specialties: { key: string; snapshotId: string; syncedAt: string }[];
}

// ---------------------------------------------------------------------------
// Polling config
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 10_000;

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function JaheziahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();

  // ── Real-time polling ──────────────────────────────────────────────────
  const eligibility = useApiQuery<EligibilityResponse>(
    ["lecture", "eligibility", id],
    `/api/iscarb/lecture/projects/${id}/jaheziah-eligibility`,
    { staleTime: 0, refetchInterval: POLL_INTERVAL },
  );

  const nationalStandards = useApiQuery<NationalStandardsResponse>(
    ["lecture", "national-standards"],
    `/api/iscarb/lecture/national-standards`,
    { staleTime: 0, refetchInterval: POLL_INTERVAL * 3 }, // Standards change less often
  );

  const specialtyOptions = nationalStandards.data?.specialties.map((s) => s.key) ?? [];

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    eligibility.data?.candidateSpecialtyKey || ""
  );

  const matrix = useApiQuery<MatrixResponse>(
    ["lecture", "matrix", id],
    `/api/iscarb/lecture/projects/${id}/alignment-matrix`,
    {
      enabled: eligibility.data?.mode === "OFFICIAL_JAHEZIAH",
      staleTime: 0,
      refetchInterval: eligibility.data?.mode === "OFFICIAL_JAHEZIAH" ? POLL_INTERVAL : false,
    },
  );

  // ── Mutations ──────────────────────────────────────────────────────────
  const linkJaheziah = useApiMutation<{ success: boolean; mode: string }, { mode: string; specialtyKey: string }>(
    `/api/iscarb/lecture/projects/${id}/jaheziah-eligibility`,
    {
      invalidateKeys: () => [
        ["lecture", "eligibility", id],
        ["lecture", "matrix", id],
      ],
      onSuccess: () => {
        setTimeout(() => {
          eligibility.refetch();
          matrix.refetch();
        }, 300);
      },
    },
  );

  // ── Error handling ─────────────────────────────────────────────────────
  if (!eligibility.isLoading && eligibility.error && !eligibility.data) {
    if (eligibility.error.message.includes("404")) notFound();
  }

  const loading = eligibility.isLoading || (matrix.isLoading && eligibility.data?.mode === "OFFICIAL_JAHEZIAH");
  const rows = matrix.data?.rows ?? [];
  const conf = eligibility.data?.confidence;
  const confPct = conf != null ? Math.round(conf * 100) : 0;

  // ── Time since update ──────────────────────────────────────────────────
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("");
  useEffect(() => {
    const lastUpdate = eligibility.dataUpdatedAt || matrix.dataUpdatedAt;
    if (!lastUpdate) return;
    const tick = () => {
      const secs = Math.round((Date.now() - lastUpdate) / 1000);
      if (secs < 5) setTimeSinceUpdate(ar ? "الآن" : "Just now");
      else if (secs < 60) setTimeSinceUpdate(ar ? `منذ ${secs}ث` : `${secs}s ago`);
      else setTimeSinceUpdate(ar ? `منذ ${Math.floor(secs / 60)}د` : `${Math.floor(secs / 60)}m ago`);
    };
    tick();
    const timer = setInterval(tick, 5_000);
    return () => clearInterval(timer);
  }, [eligibility.dataUpdatedAt, matrix.dataUpdatedAt, ar]);

  return (
    <div className="space-y-8 pb-32">
      <PageHeader
        title={ar ? "مواءمة جاهزية" : "Jaheziah Alignment"}
        description={
          ar
            ? `المصفوفة الوطنية — آخر تحديث: ${timeSinceUpdate}`
            : `National alignment matrix — updated: ${timeSinceUpdate}`
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "جاهزية" : "Jaheziah" },
        ]}
        actions={
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {timeSinceUpdate}
          </div>
        }
      />

      {eligibility.data && <NationalAlignmentBanner mode={eligibility.data.mode} />}

      {loading && !eligibility.data && (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {/* ── Confidence Score Ring ─────────────────────────────────────── */}
      {eligibility.data && conf != null && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-muted/20 to-card shadow-sm">
          <svg className="h-20 w-20 shrink-0 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="currentColor" className="text-muted/30" />
            <circle
              cx="18" cy="18" r="14" fill="none" strokeWidth="3"
              stroke={conf >= 0.8 ? "#10B981" : conf >= 0.5 ? "#F59E0B" : "#EF4444"}
              strokeDasharray={`${conf * 87.96} 87.96`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <text x="18" y="20" textAnchor="middle" className="fill-current text-[7.5px] font-extrabold" transform="rotate(90 18 18)">
              {confPct}%
            </text>
            <text x="18" y="26" textAnchor="middle" className="fill-muted-foreground text-[4.5px] uppercase font-bold tracking-wider" transform="rotate(90 18 18)">
              {ar ? "مطابقة" : "match"}
            </text>
          </svg>
          <div className="space-y-1.5 flex-1">
            <p className="font-display font-bold text-base text-foreground">
              {ar ? "نسبة الثقة" : "Alignment Confidence"}
            </p>
            <p className={`text-sm font-semibold ${conf >= 0.8 ? "text-emerald-600" : conf >= 0.5 ? "text-amber-600" : "text-red-600"}`}>
              {conf >= 0.8
                ? ar ? "ثقة عالية" : "High confidence"
                : conf >= 0.5
                ? ar ? "مراجعة مطلوبة" : "Review required"
                : ar ? "ثقة منخفضة" : "Low confidence"}
            </p>
            {eligibility.data.rationale && (
              <p className="text-xs text-muted-foreground font-mono bg-muted/40 rounded-lg px-3 py-2 mt-2 border border-border/50">
                {eligibility.data.rationale}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIRM_REQUIRED Mode ──────────────────────────────────────── */}
      {eligibility.data && eligibility.data.mode === "CONFIRM_REQUIRED" && (
        <Card className="border-amber-500/40 bg-amber-500/10 shadow-md rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-xl">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-base">{ar ? "تأكيد المعيار الوطني" : "Confirm National Standard"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ar ? "اختر المعيار الوطني المناسب لهذا المقرر." : "Select the applicable national standard for this course."}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-full sm:w-96 h-11 rounded-xl font-semibold text-sm">
                  <SelectValue placeholder={ar ? "اختر التخصص..." : "Select specialty..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {specialtyOptions.map((spec) => (
                    <SelectItem key={spec} value={spec} className="text-sm font-medium">{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => linkJaheziah.mutate({ mode: "OFFICIAL_JAHEZIAH", specialtyKey: selectedSpecialty })}
                disabled={!selectedSpecialty || linkJaheziah.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-5 h-11"
              >
                {linkJaheziah.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                {ar ? "تأكيد وتفعيل" : "Confirm & Activate"}
              </Button>
              <Button
                variant="outline"
                onClick={() => linkJaheziah.mutate({ mode: "COURSE_READINESS", specialtyKey: "" })}
                disabled={linkJaheziah.isPending}
                className="rounded-xl text-xs h-11"
              >
                {ar ? "إطار المقرر" : "Course Framework"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── COURSE_READINESS Mode ──────────────────────────────────────── */}
      {eligibility.data && eligibility.data.mode === "COURSE_READINESS" && (
        <Card className="border border-slate-200/60 shadow-xl rounded-2xl bg-white">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-b border-slate-200/60 p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-display font-black">
                  {ar ? "إطار الجاهزية" : "Course Readiness Framework"}
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {ar ? "اختر المعيار الوطني لتفعيل المصفوفة." : "Select a national standard to activate the matrix."}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl">Active</Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                {ar ? "التميز الوطني:" : "National Specialty:"}
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Select value={selectedSpecialty || specialtyOptions[0] || ""} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="w-full sm:w-96 h-11 rounded-xl border-slate-300 text-sm font-extrabold shadow-sm">
                    <SelectValue placeholder={ar ? "اختر..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {specialtyOptions.map((spec) => (
                      <SelectItem key={spec} value={spec} className="text-sm font-bold">{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => linkJaheziah.mutate({ mode: "OFFICIAL_JAHEZIAH", specialtyKey: selectedSpecialty || specialtyOptions[0] || "" })}
                  disabled={linkJaheziah.isPending}
                  className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl font-extrabold text-xs h-11 px-6 shadow-lg shadow-[#0E6C3C]/20"
                >
                  {linkJaheziah.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {linkJaheziah.isPending ? (ar ? "جاري..." : "Activating...") : (ar ? "تفعيل المصفوفة" : "Activate Matrix")}
                </Button>
              </div>
              {linkJaheziah.isError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
                  {linkJaheziah.error?.message || "No matching standard found."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && eligibility.data && <Skeleton className="h-96 rounded-2xl" />}

      {/* ── OFFICIAL_JAHEZIAH Matrix ───────────────────────────────────── */}
      {matrix.data && matrix.data.mode === "OFFICIAL_JAHEZIAH" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-slate-800">{rows.length}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">{ar ? "CLOs" : "CLOs"}</p>
                </div>
                <BookOpen className="h-8 w-8 text-slate-300" />
              </CardContent>
            </Card>
            <Card className="border-emerald-200/60 bg-emerald-50/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-emerald-600">{rows.filter((r) => r.sourceLocator).length}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70 mt-0.5">{ar ? "مصادر" : "Locators"}</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-500/30" />
              </CardContent>
            </Card>
            <Card className="border-purple-200/60 bg-purple-50/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-purple-600">{rows.filter((r) => r.assessmentSlide != null).length}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-600/70 mt-0.5">{ar ? "تقييمات" : "Assessments"}</p>
                </div>
                <Layers className="h-8 w-8 text-purple-500/30" />
              </CardContent>
            </Card>
            <Card className="border-cyan-200/60 bg-gradient-to-br from-cyan-50/80 to-cyan-100/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-[#0F7B8A]">{boundOfficialOutcomeCount(rows)}/{rows.length}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0F7B8A]/70 mt-0.5">{ar ? "نواتج رسمية" : "Official Outcomes"}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-[#0F7B8A]/30" />
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              {officialJaheziahHeading(rows, ar)}
            </h3>
            <Button
              onClick={() => router.push(`/faculty/lecture/${id}/ncaaa`)}
              className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-md text-xs rounded-xl font-bold"
            >
              {ar ? "NCAAA" : "NCAAA Evidence"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          <AlignmentMatrixTable rows={rows} />
        </div>
      )}
    </div>
  );
}
