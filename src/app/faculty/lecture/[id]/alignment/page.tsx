"use client";

/**
 * Readiness & Alignment Page — BRD SVC-06, FR-016/017/018.
 * ===========================================================================
 * Real-time alignment dashboard that:
 *   - Polls readiness items and Vision 2030 contexts every 10s
 *   - Auto-refreshes after any mutation
 *   - Shows live approval status
 *   - Dynamic Vision 2030 data (not hardcoded pillars)
 */

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NationalAlignmentBanner } from "@/components/lecture/NationalAlignmentBanner";
import { ReadinessItemCard } from "@/components/lecture/ReadinessItemCard";
import { VisionContextCard, type VisionContextItem } from "@/components/lecture/VisionContextCard";
import {
  RefreshCw,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Target,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlignmentResponse {
  mode: string;
  items: (ReadinessItemJson & { approved: boolean; id: string })[];
}

interface VisionContextsResponse {
  contexts: VisionContextItem[];
  synced?: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Polling config
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 10_000;

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AlignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "vision" | "items">("all");

  // ── Real-time polling ──────────────────────────────────────────────────
  const { data, isLoading, error, refetch: refetchAlignment, dataUpdatedAt } = useApiQuery<AlignmentResponse>(
    ["lecture", "alignment", id],
    `/api/iscarb/lecture/projects/${id}/readiness`,
    { staleTime: 0, refetchInterval: POLL_INTERVAL },
  );

  const vision = useApiQuery<VisionContextsResponse>(
    ["lecture", "vision-contexts", id],
    `/api/iscarb/lecture/projects/${id}/vision-contexts`,
    { staleTime: 0, refetchInterval: POLL_INTERVAL },
  );

  // ── Mutations ──────────────────────────────────────────────────────────
  const generateItems = useApiMutation<{ items: unknown[]; count: number }, Record<string, never>>(
    `/api/iscarb/lecture/projects/${id}/readiness`,
    {
      method: "POST",
      invalidateKeys: () => [["lecture", "alignment", id]],
      onSuccess: () => setTimeout(() => refetchAlignment(), 300),
    },
  );

  const mutateItem = useApiMutation<unknown, { itemId: string; body: Record<string, unknown> }>(
    ({ itemId }) => `/api/iscarb/lecture/readiness-items/${itemId}`,
    {
      method: "PATCH",
      invalidateKeys: () => [["lecture", "alignment", id]],
      onSuccess: () => setTimeout(() => refetchAlignment(), 200),
    },
  );

  const deleteItem = useApiMutation<unknown, { itemId: string }>(
    ({ itemId }) => `/api/iscarb/lecture/readiness-items/${itemId}`,
    {
      method: "DELETE",
      invalidateKeys: () => [["lecture", "alignment", id]],
      onSuccess: () => setTimeout(() => refetchAlignment(), 200),
    },
  );

  const refreshVision = useApiMutation<VisionContextsResponse, Record<string, never>>(
    `/api/iscarb/lecture/projects/${id}/vision-contexts`,
    {
      method: "POST",
      invalidateKeys: () => [["lecture", "vision-contexts", id]],
      onSuccess: () => setTimeout(() => vision.refetch(), 300),
    },
  );

  const patchVision = useApiMutation<unknown, { contextId: string; approved: boolean }>(
    ({ contextId }) => `/api/iscarb/lecture/vision-contexts/${contextId}`,
    {
      method: "PATCH",
      invalidateKeys: () => [["lecture", "vision-contexts", id]],
      onSuccess: () => setTimeout(() => vision.refetch(), 200),
    },
  );

  // ── Error handling ─────────────────────────────────────────────────────
  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const items = data?.items ?? [];
  const contexts = vision.data?.contexts ?? [];
  const approvedItemsCount = items.filter((i) => i.approved).length;
  const approvedVisionCount = contexts.filter((c) => c.approved).length;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleApproveAll = () => {
    items
      .filter((i) => !i.approved)
      .forEach((item) => {
        mutateItem.mutate({ itemId: item.id, body: { action: "approve" } });
      });
  };

  const handleApproveAllVision = () => {
    contexts
      .filter((c) => !c.approved)
      .forEach((c) => {
        patchVision.mutate({ contextId: c.id, approved: true });
      });
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
        title={ar ? "الجاهزية والمواءمة" : "Readiness & Alignment"}
        description={
          ar
            ? `مواءمة المحتوى مع رؤية المملكة 2030 وفحوصات الجاهزية — آخر تحديث: ${timeSinceUpdate}`
            : `Content alignment with Vision 2030 and readiness checks — updated: ${timeSinceUpdate}`
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "الجاهزية والمواءمة" : "Readiness & Alignment" },
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
            <Button
              onClick={() => {
                handleApproveAll();
                handleApproveAllVision();
              }}
              className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white font-extrabold shadow-lg shadow-[#0E6C3C]/20 rounded-xl px-6 py-5 text-sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {ar ? "اعتماد الكل" : "Approve All"}
            </Button>
          </div>
        }
      />

      {data && <NationalAlignmentBanner mode={data.mode} />}

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
          {/* ── Summary Metric Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-emerald-200/80 bg-white shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black tracking-tight tabular-nums text-emerald-800">{contexts.length}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-1">
                    {ar ? "مبادرات رؤية 2030" : "Vision 2030 Contexts"}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-300/60 flex items-center justify-center text-emerald-800">
                  <Building2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200/80 bg-white shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black tracking-tight tabular-nums text-emerald-800">{approvedItemsCount}</p>
                    <p className="text-xl font-bold text-slate-400">/{items.length}</p>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-1">
                    {ar ? "فحوصات معتمدة" : "Approved Checks"}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-300/60 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200/80 bg-white shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black tracking-tight tabular-nums text-[#0F7B8A]">{items.length}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">
                    {ar ? "فحوصات الجاهزية" : "Readiness Gates"}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#0F7B8A]/10 border border-[#0F7B8A]/30 flex items-center justify-center text-[#0F7B8A]">
                  <BookOpen className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-emerald-100 pb-3 gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: ar ? "الكل" : "All", icon: Sparkles },
                { id: "vision", label: ar ? `رؤية 2030 (${contexts.length})` : `Vision 2030 (${contexts.length})`, icon: Building2 },
                { id: "items", label: ar ? `الجاهزية (${items.length})` : `Readiness (${items.length})`, icon: BookOpen },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`rounded-xl text-xs font-bold ${activeTab === tab.id ? "bg-[#0E6C3C] text-white" : "border-emerald-200 text-slate-700"}`}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {contexts.length > 0 && approvedVisionCount < contexts.length && (
                <Button
                  size="sm"
                  onClick={handleApproveAllVision}
                  disabled={patchVision.isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {ar ? "اعتماد 2030" : "Approve Vision"}
                </Button>
              )}
              {items.length > 0 && approvedItemsCount < items.length && (
                <Button
                  size="sm"
                  onClick={handleApproveAll}
                  disabled={mutateItem.isPending}
                  className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs font-bold rounded-xl"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {ar ? "اعتماد الفحوصات" : "Approve Checks"}
                </Button>
              )}
              <Button
                onClick={() => router.push(`/faculty/lecture/${id}/ncaaa`)}
                className="bg-[#0F7B8A] hover:bg-[#0F7B8A]/90 text-white shadow-sm text-xs rounded-xl font-bold"
              >
                {ar ? "NCAAA" : "NCAAA Evidence"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* ── SECTION 1: Vision 2030 ─────────────────────────────────── */}
          {(activeTab === "all" || activeTab === "vision") && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇸🇦</span>
                      <h3 className="text-base font-extrabold text-emerald-950">
                        {ar ? "المواءمة مع رؤية 2030" : "Saudi Vision 2030 Alignment"}
                      </h3>
                      <Badge className="bg-[#0E6C3C] text-white text-[10px] font-bold">Aligned</Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
                      {ar
                        ? "ربط المحتوى الأكاديمي بالبرامج الاستراتيجية الوطنية."
                        : "Connecting academic content to national strategic programs."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refreshVision.mutate({})}
                    disabled={refreshVision.isPending}
                    className="text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-xl shrink-0"
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshVision.isPending ? "animate-spin" : ""}`} />
                    {ar ? "تحديث" : "Refresh"}
                  </Button>
                </div>

                {/* Dynamic Vision Pillars — from actual data */}
                {contexts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-100">
                    {contexts.slice(0, 3).map((ctx, idx) => {
                      const colors = [
                        { dot: "bg-emerald-600", text: "text-emerald-900", border: "border-emerald-100" },
                        { dot: "bg-[#0F7B8A]", text: "text-[#0F7B8A]", border: "border-[#0F7B8A]/10" },
                        { dot: "bg-slate-600", text: "text-slate-800", border: "border-slate-100" },
                      ];
                      const c = colors[idx % 3];
                      return (
                        <div key={ctx.id} className={`p-3 rounded-xl bg-white border ${c.border} shadow-xs space-y-1`}>
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${c.text}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            {ctx.title}
                            {ctx.approved && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1" />}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">
                            {(ctx.description ?? "").slice(0, 120) || (ar ? "سياق وطني" : "National context")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vision Context Cards */}
              {vision.isLoading ? (
                <Card className="border border-emerald-100 bg-white">
                  <CardContent className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0E6C3C]" />
                    {ar ? "جاري تحميل..." : "Loading..."}
                  </CardContent>
                </Card>
              ) : contexts.length === 0 ? (
                <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/20 rounded-2xl">
                  <CardContent className="p-8 text-center space-y-3">
                    <div className="mx-auto w-11 h-11 rounded-xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-700">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-slate-600">
                      {ar ? "لم يتم توليد سياقات رؤية 2030 بعد." : "No Vision 2030 contexts generated yet."}
                    </p>
                    <Button
                      onClick={() => refreshVision.mutate({})}
                      disabled={refreshVision.isPending}
                      className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white font-bold text-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      {ar ? "توليد السياقات" : "Generate Contexts"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contexts.map((ctxItem) => (
                    <VisionContextCard
                      key={ctxItem.id}
                      context={ctxItem}
                      onApprove={() => patchVision.mutate({ contextId: ctxItem.id, approved: true })}
                      onReject={() => patchVision.mutate({ contextId: ctxItem.id, approved: false })}
                      className="bg-white border-emerald-200/80 shadow-xs hover:border-emerald-400"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 2: Readiness Checks ───────────────────────────── */}
          {(activeTab === "all" || activeTab === "items") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#0E6C3C]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {ar ? `فحوصات الجاهزية (${items.length})` : `Readiness Checks (${items.length})`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {ar ? "مدمجة في الشرائح" : "Embedded in slides"}
                </p>
              </div>

              {items.length === 0 && !isLoading && (
                <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/20 rounded-2xl">
                  <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                    <div className="p-4 rounded-full bg-emerald-100 text-emerald-800">
                      <Target className="h-8 w-8" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h3 className="font-bold text-lg text-slate-900">
                        {ar ? "لا توجد فحوصات" : "No readiness items yet"}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ar
                          ? "توليد فحوصات جاهزية متوافقة مع مخرجات التعلّم."
                          : "Generate CLO-aligned readiness checks with progressive hints."}
                      </p>
                    </div>
                    <Button
                      onClick={() => generateItems.mutate({})}
                      disabled={generateItems.isPending}
                      className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl font-bold px-6 text-xs shadow-sm"
                    >
                      {generateItems.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {ar ? "توليد الفحوصات" : "Generate Checks"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {items.length > 0 && (
                <div className="grid gap-5 lg:grid-cols-2">
                  {items.map((item) => (
                    <ReadinessItemCard
                      key={item.id ?? item.slideNo}
                      item={item}
                      approved={item.approved}
                      onApprove={() => mutateItem.mutate({ itemId: item.id, body: { action: "approve" } })}
                      onReject={() => mutateItem.mutate({ itemId: item.id, body: { action: "reject" } })}
                      onDelete={() => deleteItem.mutate({ itemId: item.id })}
                      onSave={async (patch) => {
                        await mutateItem.mutateAsync({ itemId: item.id, body: patch as Record<string, unknown> });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
