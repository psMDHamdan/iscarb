"use client";

/**
 * NCAAA Accreditation Evidence Page — BRD SVC-06A, FR-020.
 * ===========================================================================
 * Real-time accreditation evidence dashboard that:
 *   - Polls NCAAA requirements every 10s
 *   - Auto-refreshes after mutations
 *   - Shows live approval status
 */

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NCAAARequirementRow, type NCAAARequirementView } from "@/components/lecture/NCAAARequirementRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NCAAAEvidenceResponse {
  requirements: (NCAAARequirementView & { id: string; clause: string })[];
  gapCount: number;
  metCount: number;
  pendingCount: number;
  synced?: boolean;
  sourceUrl?: string | null;
}

interface DraftResponse {
  sectionId: string;
  status: string;
  narrative?: string;
}

// ---------------------------------------------------------------------------
// Polling config
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 10_000;

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NCAAAPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [narrativeText, setNarrativeText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Real-time polling ──────────────────────────────────────────────────
  const { data, isLoading, error, refetch, dataUpdatedAt } = useApiQuery<NCAAAEvidenceResponse>(
    ["lecture", "ncaaa", id],
    `/api/iscarb/lecture/projects/${id}/ncaaa-evidence`,
    { staleTime: 0, refetchInterval: POLL_INTERVAL },
  );

  // ── Mutations ──────────────────────────────────────────────────────────
  const draft = useApiMutation<DraftResponse, { requirementIds: string[] }>(
    `/api/iscarb/lecture/projects/${id}/ncaaa-report-sections`,
    {
      onMutate: () => {
        setNarrativeText(null);
        setDialogOpen(true);
      },
      onSuccess: (r) => {
        if (r.narrative) {
          setNarrativeText(r.narrative);
        } else {
          setNarrativeText("System-suggested narrative generated successfully.");
        }
      },
    }
  );

  // ── Error handling ─────────────────────────────────────────────────────
  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const requirements = data?.requirements ?? [];
  const metCount = data?.metCount ?? 0;
  const gapCount = data?.gapCount ?? 0;
  const pendingCount = data?.pendingCount ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (narrativeText) {
      navigator.clipboard.writeText(narrativeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (narrativeText) {
      const blob = new Blob([narrativeText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ncaaa-narrative-${id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDraftAll = () => {
    const allIds = requirements.map((r) => r.id);
    if (allIds.length > 0) {
      draft.mutate({ requirementIds: allIds });
    }
  };

  // ── Time since update ──────────────────────────────────────────────────
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("");
  useEffect(() => {
    if (!dataUpdatedAt) return;
    const tick = () => {
      const secs = Math.round((Date.now() - dataUpdatedAt) / 1000);
      if (secs < 5) setTimeSinceUpdate(ar ? "الآن" : "Just now");
      else if (secs < 60) setTimeSinceUpdate(ar ? `منذ ${secs}ث` : `${secs}s ago`);
      else setTimeSinceUpdate(ar ? `منذ ${Math.floor(secs / 60)}د` : `${Math.floor(secs / 60)}m ago`);
    };
    tick();
    const timer = setInterval(tick, 5_000);
    return () => clearInterval(timer);
  }, [dataUpdatedAt, ar]);

  return (
    <div className="space-y-8 pb-32">
      <PageHeader
        title={ar ? "أدلة الاعتماد (NCAAA)" : "NCAAA Evidence"}
        description={
          ar
            ? `ربط المحاضرة بمعايير الاعتماد — آخر تحديث: ${timeSinceUpdate}`
            : `Lecture accreditation evidence — updated: ${timeSinceUpdate}`
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "NCAAA" : "NCAAA Evidence" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {timeSinceUpdate}
            </div>
          </div>
        }
      />

      {isLoading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {data && (
        <>
          {/* ── Summary Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200/60 bg-emerald-50/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-emerald-600">
                    {metCount}/{requirements.length}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70 mt-0.5">
                    {ar ? "مستوفاة" : "Fully Met"}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
              </CardContent>
            </Card>

            <Card className="border-amber-200/60 bg-amber-50/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-amber-600">
                    {pendingCount}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/70 mt-0.5">
                    {ar ? "قيد المراجعة" : "Pending"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/30" />
              </CardContent>
            </Card>

            <Card className={`border shadow-sm backdrop-blur-md ${gapCount > 0 ? "border-red-200/60 bg-red-50/50" : "border-slate-200/60 bg-white/60"}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-display font-bold tabular-nums ${gapCount > 0 ? "text-red-600" : "text-slate-800"}`}>
                    {gapCount}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
                    {ar ? "فجوات" : "Gaps"}
                  </p>
                </div>
                {gapCount > 0 ? <AlertCircle className="h-8 w-8 text-red-500/30" /> : <ShieldCheck className="h-8 w-8 text-slate-300" />}
              </CardContent>
            </Card>

            <Card className="border-cyan-200/60 bg-gradient-to-br from-cyan-50/80 to-cyan-100/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-display font-bold tabular-nums text-[#0F7B8A]">
                    {requirements.length > 0 ? `${Math.round((metCount / requirements.length) * 100)}%` : "0%"}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0F7B8A]/70 mt-0.5">
                    {ar ? "نسبة الأدلة" : "Evidence Score"}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-[#0F7B8A]/30" />
              </CardContent>
            </Card>
          </div>

          {/* ── Actions Bar ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              {ar ? "معايير الاعتماد" : "Accreditation Standards"} ({requirements.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleDraftAll}
                disabled={draft.isPending || requirements.length === 0}
                className="bg-[#0F7B8A] hover:bg-[#0F7B8A]/90 text-white text-xs font-bold rounded-xl"
              >
                {draft.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                {ar ? "توليد السرد" : "Draft Narrative"}
              </Button>
              <Button
                onClick={() => router.push(`/faculty/lecture/${id}/publish`)}
                className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-md text-xs rounded-xl font-bold"
              >
                {ar ? "النشر" : "Publish"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* ── Requirements List ──────────────────────────────────────── */}
          {requirements.length === 0 ? (
            <Card className="p-8 text-center border-dashed rounded-2xl space-y-4">
              <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {ar
                  ? "لا توجد معايير NCAAA مُحمّلة بعد. تتم المزامنة من المصدر الرسمي."
                  : "No official NCAAA standards synced yet. Standards are fetched from the official source."}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/faculty/lecture/admin/sources")}
                className="rounded-xl text-xs font-semibold"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {ar ? "المصادر الرسمية" : "Official Sources"}
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {requirements.map((req) => (
                <NCAAARequirementRow
                  key={req.id}
                  requirement={req}
                  onDraft={(requirementId) => draft.mutate({ requirementIds: [requirementId] })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Narrative Preview Modal ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold">
              <FileText className="h-5 w-5 text-[#0F7B8A]" />
              {ar ? "مسودة السرد" : "Narrative Draft"}
            </DialogTitle>
          </DialogHeader>

          {draft.isPending && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-[#0F7B8A]" />
              <span className="text-sm font-semibold">{ar ? "جاري التوليد..." : "Generating..."}</span>
            </div>
          )}

          {!draft.isPending && narrativeText && (
            <div className="space-y-4 py-2 overflow-y-auto max-h-[55vh] pr-1">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {ar
                    ? "مسودة مقترحة — راجعها واعتمدها قبل الاستخدام."
                    : "System-suggested draft — review before use."}
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-border/80 bg-muted/20 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                {narrativeText}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t sm:justify-between">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs">
              {ar ? "إغلاق" : "Close"}
            </Button>
            {narrativeText && !draft.isPending && (
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="border-[#0F7B8A]/40 text-[#0F7B8A] rounded-xl text-xs font-semibold">
                  {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                  {copied ? (ar ? "تم" : "Copied!") : ar ? "نسخ" : "Copy"}
                </Button>
                <Button onClick={handleDownload} className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl text-xs font-bold shadow-sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {ar ? "تحميل" : "Download"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
