"use client";

import { use, useState, useCallback } from "react";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Send,
  CheckCircle2,
  Download,
  FileText,
  Presentation,
  Globe,
  BookOpen,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Clock,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */

interface PublishReadinessResponse {
  projectId: string;
  projectStatus: string;
  canPublish: boolean;
  blockers: string[];
  counts: {
    failedErrorGates: number;
    unapprovedSlides: number;
    unapprovedReadinessItems: number;
    currentSlideCount?: number;
    requiredSlideCount?: number;
  };
  gateSummary: {
    total: number;
    pass: number;
    fail: number;
    warn: number;
    waive: number;
  };
  artifactSummary: {
    total: number;
    approved: number;
    pending: number;
  };
  readinessSummary: {
    total: number;
    approved: number;
    pending: number;
  };
  versions: {
    id: string;
    version: number;
    status: string;
    manifestHash: string;
    approvedAt: string | null;
    approvedBy: string;
  }[];
}

interface PublishResponse {
  versionId: string;
  manifestHash: string;
  approvedAt: string;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const [showHistory, setShowHistory] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [lastPublishedId, setLastPublishedId] = useState<string>("");

  const { data, isLoading, refetch } = useApiQuery<PublishReadinessResponse>(
    ["lecture", "publish-readiness", id],
    `/api/iscarb/lecture/projects/${id}/publish-readiness`,
    { refetchInterval: 10000 },
  );

  const publish = useApiMutation<PublishResponse, Record<string, unknown>>(
    `/api/iscarb/lecture/projects/${id}/publish`,
    {
      onSuccess: (r) => {
        if (r?.versionId) setLastPublishedId(r.versionId);
        setTimeout(() => refetch(), 500);
      },
    },
  );

  const handleDownload = useCallback(
    async (formatId: string, versionId?: string) => {
      let vid = versionId || lastPublishedId;
      if (!vid) {
        try {
          const result = await publish.mutateAsync({});
          vid = result?.versionId;
        } catch {
          // If version exists, proceed to download
        }
      }
      if (vid) {
        window.open(
          `/api/iscarb/lecture/packages/${vid}/download/${formatId}`,
          "_blank"
        );
      }
    },
    [lastPublishedId]
  );

  const r = data;
  const latestVersion = r?.versions?.[0];

  return (
    <div className="space-y-6 pb-32">
      <PageHeader
        title={ar ? "نشر وتصدير" : "Publish & Export"}
        description={
          ar
            ? "تحقق من الجاهزية واعتمد الحزمة وحمّل الصيغ."
            : "Verify readiness, approve the package, and download exports."
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "نشر" : "Publish" },
        ]}
        actions={
          r ? (
            <Badge
              className={cn(
                "font-semibold text-xs px-3 py-1 flex items-center gap-1.5 shadow-sm",
                r.canPublish || r.projectStatus === "approved"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/40"
              )}
            >
              {r.canPublish || r.projectStatus === "approved" ? (
                <>
                  <PackageCheck className="h-4 w-4" />{" "}
                  {ar ? "جاهز للنشر" : "Ready to Publish"}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />{" "}
                  {ar ? "غير جاهز" : "Not Ready"}
                </>
              )}
            </Badge>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      )}

      {r && (
        <>
          {/* ── Hero Banner ── */}
          <Card
            className={cn(
              "border shadow-xl rounded-3xl overflow-hidden backdrop-blur-md",
              r.canPublish || r.projectStatus === "approved"
                ? "border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white/60"
                : "border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white/60"
            )}
          >
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "p-5 rounded-2xl shadow-sm",
                    r.canPublish || r.projectStatus === "approved"
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-100 text-amber-600"
                  )}
                >
                  {r.canPublish || r.projectStatus === "approved" ? (
                    <CheckCircle2 className="h-8 w-8" />
                  ) : (
                    <AlertCircle className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-slate-900">
                    {r.projectStatus === "approved"
                      ? ar
                        ? "تم النشر بنجاح"
                        : "Published"
                      : r.canPublish
                      ? ar
                        ? "جاهز للنشر — جميع المعايير مستوفاة"
                        : "Ready to Publish — All Checks Passed"
                      : ar
                      ? "يوجد عوائق قبل النشر"
                      : "Blockers Found — Fix Before Publishing"}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 mt-1.5 leading-relaxed max-w-xl">
                    {r.projectStatus === "approved"
                      ? ar
                        ? "تم اعتماد ونشر الحزمة. يمكنك تحميل الصيغ أدناه."
                        : "Package is approved and published. Download formats below."
                      : r.canPublish
                      ? ar
                        ? "جميع بوابات الجودة ممرّة والشرائح معتمدة. اضغط «نشر» للاعتماد."
                        : "All quality gates pass and slides are approved. Click Publish to finalize."
                      : ar
                      ? "يجب حل جميع العوائق قبل إمكانية النشر."
                      : "Resolve all blockers before publication is possible."}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  onClick={() => publish.mutate({})}
                  disabled={
                    publish.isPending || r.artifactSummary.total === 0
                  }
                  className={cn(
                    "shadow-lg text-sm rounded-2xl h-12 px-6 font-bold",
                    r.canPublish || r.projectStatus === "approved"
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {publish.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {publish.isPending
                    ? ar
                      ? "جاري النشر..."
                      : "Publishing..."
                    : ar
                    ? "نشر رسمي"
                    : "Official Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Blockers ── */}
          {r.blockers.length > 0 && (
            <Card className="border-red-200/60 bg-red-50/80 rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {ar
                    ? `${r.blockers.length} عائق(ات) قبل النشر`
                    : `${r.blockers.length} Blocker(s) Before Publishing`}
                </div>
                <ul className="space-y-1.5">
                  {r.blockers.map((b, i) => (
                    <li
                      key={i}
                      className="text-xs font-medium text-red-700/80 flex items-start gap-2"
                    >
                      <span className="text-red-400 mt-0.5">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ── Publish Success ── */}
          {publish.isSuccess && (
            <Card className="border-emerald-200/60 bg-emerald-50/80 rounded-2xl shadow-sm">
              <CardContent className="p-4 flex items-center gap-3 text-sm text-emerald-800 font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    {ar ? "تم النشر! " : "Published! "}
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-emerald-100 text-xs">
                    {publish.data.versionId}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Readiness Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quality Gates */}
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {ar ? "بوابات الجودة" : "Quality Gates"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      r.gateSummary.fail > 0
                        ? "bg-red-50 text-red-600 border-red-200"
                        : r.gateSummary.warn > 0
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    )}
                  >
                    {r.gateSummary.pass}/{r.gateSummary.total}
                  </Badge>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                  {r.gateSummary.pass > 0 && (
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{
                        width: `${(r.gateSummary.pass / r.gateSummary.total) * 100}%`,
                      }}
                    />
                  )}
                  {r.gateSummary.warn > 0 && (
                    <div
                      className="bg-amber-400 transition-all"
                      style={{
                        width: `${(r.gateSummary.warn / r.gateSummary.total) * 100}%`,
                      }}
                    />
                  )}
                  {r.gateSummary.fail > 0 && (
                    <div
                      className="bg-red-500 transition-all"
                      style={{
                        width: `${(r.gateSummary.fail / r.gateSummary.total) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <div className="flex gap-2 mt-1.5 text-[10px] text-slate-500">
                  <span className="text-emerald-600">
                    {r.gateSummary.pass} pass
                  </span>
                  {r.gateSummary.warn > 0 && (
                    <span className="text-amber-600">
                      {r.gateSummary.warn} warn
                    </span>
                  )}
                  {r.gateSummary.fail > 0 && (
                    <span className="text-red-600">
                      {r.gateSummary.fail} fail
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Slide Artifacts */}
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {ar ? "شرائح" : "Slide Artifacts"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      r.artifactSummary.pending > 0
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    )}
                  >
                    {r.artifactSummary.approved}/{r.artifactSummary.total}
                  </Badge>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{
                      width: `${r.artifactSummary.total > 0 ? (r.artifactSummary.approved / r.artifactSummary.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {r.artifactSummary.pending > 0
                    ? `${r.artifactSummary.pending} pending approval`
                    : "All approved ✓"}
                </p>
              </CardContent>
            </Card>

            {/* Readiness Items */}
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {ar ? "بنود الجاهزية" : "Readiness Checks"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      r.readinessSummary.pending > 0
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    )}
                  >
                    {r.readinessSummary.approved}/{r.readinessSummary.total}
                  </Badge>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{
                      width: `${
                        r.readinessSummary.total > 0
                          ? (r.readinessSummary.approved /
                              r.readinessSummary.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {r.readinessSummary.pending > 0
                    ? `${r.readinessSummary.pending} pending approval`
                    : "All approved ✓"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Downloads ── */}
          <Card className="border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white/60 backdrop-blur-md shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-emerald-100/30 border-b border-emerald-100/50 p-6">
              <CardTitle className="text-base font-display font-black text-emerald-900 flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-600" />
                {ar ? "تحميل" : "Downloads"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm font-medium text-slate-600 mb-4">
                {ar
                  ? "حمّل أي من الصيغ المعتمدة مباشرة:"
                  : "Download any accredited format directly:"}
              </p>

              {[
                {
                  id: "pptx",
                  label: "Student Deck",
                  ext: ".PPTX",
                  icon: Presentation,
                  primary: false,
                },
                {
                  id: "pdf",
                  label: "Executive PDF",
                  ext: ".PDF",
                  icon: FileText,
                  primary: false,
                },
                {
                  id: "html",
                  label: "Interactive HTML",
                  ext: ".HTML",
                  icon: Globe,
                  primary: true,
                },
                {
                  id: "instructor_guide",
                  label: "Instructor Guide",
                  ext: ".DOCX",
                  icon: BookOpen,
                  primary: false,
                },
                {
                  id: "evidence_pack",
                  label: "NCAAA Evidence Pack",
                  ext: ".PDF",
                  icon: ShieldCheck,
                  primary: false,
                },
              ].map((fmt) => (
                <Button
                  key={fmt.id}
                  onClick={() =>
                    handleDownload(fmt.id, latestVersion?.id)
                  }
                  className={cn(
                    "w-full justify-start font-mono text-xs h-11 rounded-xl shadow-sm",
                    fmt.primary
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600/50"
                      : "bg-slate-800 hover:bg-slate-900 text-white border border-slate-700/50"
                  )}
                >
                  <fmt.icon className="h-4 w-4 mr-2" />
                  {fmt.label} ({fmt.ext})
                  {publish.isPending && (
                    <Loader2 className="h-3 w-3 ml-auto animate-spin" />
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* ── Version History ── */}
          {r.versions.length > 0 && (
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <button
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                onClick={() => setShowHistory(!showHistory)}
              >
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-slate-500" />
                  <span className="text-sm font-display font-bold text-slate-700">
                    {ar ? "سجل النشر" : "Publish History"}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-slate-50 text-slate-500"
                  >
                    {r.versions.length}
                  </Badge>
                </div>
                {showHistory ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {showHistory && (
                <div className="border-t border-slate-100">
                  {r.versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-slate-50"
                        >
                          v{v.version}
                        </Badge>
                        <span className="text-xs text-slate-500 font-mono">
                          {v.manifestHash}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {v.approvedAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(v.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-semibold"
                          onClick={() =>
                            window.open(
                              `/api/iscarb/lecture/packages/${v.id}/download/pptx`,
                              "_blank"
                            )
                          }
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PPTX
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* ── Publish Confirmation Dialog ── */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPublishConfirm(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Send className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {ar ? "تأكيد النشر" : "Confirm Publication"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {ar
                  ? "سيتم نشر المحاضرة وجعلها متاحة للطلاب. هل أنت متأكد؟"
                  : "This will publish the lecture and make it available to students. Continue?"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  setShowPublishConfirm(false);
                  publish.mutate({ approveAll: true, force: true });
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-lg transition-all"
              >
                {ar ? "نشر" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


