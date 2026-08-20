"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SourceBlockList, type SourceBlockView } from "@/components/lecture/SourceBlockList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, AlertCircle, Layers, HelpCircle, Info, Circle, AlertTriangle } from "lucide-react";

interface SourceMapResponse {
  projectId: string;
  parseStatus: string;
  documents: {
    id: string;
    originalName: string;
    type: string;
    parseStatus: string;
    version: number;
    blocks: { mapped: number; omitted: number; unresolved: number };
    blockList: SourceBlockView[];
  }[];
  summary: { total: number; critical: number; mapped: number; omitted: number; unresolved: number };
}

export default function SourceMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [omitModalOpen, setOmitModalOpen] = useState(false);
  const [omissionReason, setOmissionReason] = useState("");

  const [filterCrit, setFilterCrit] = useState<"all" | "critical" | "normal" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unresolved" | "mapped" | "omitted">("all");

  // staleTime: 0 — source-map content changes server-side (parse, mapping),
  // so every mount must refetch. The global 30s cache made client-side
  // navigation show stale data that only a hard refresh cleared.
  const { data, isLoading, error, refetch } = useApiQuery<SourceMapResponse>(
    ["lecture", "source-map", id],
    `/api/iscarb/lecture/projects/${id}/source-map`,
    { staleTime: 0 },
  );

  const updateBlocks = useApiMutation<void, { blockIds: string[]; status: string; omissionReason?: string }>(
    `/api/iscarb/lecture/projects/${id}/source-map`,
    {
      method: "PATCH",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "source-map", id] });
        void refetch();
        setSelectedIds(new Set());
        setOmitModalOpen(false);
        setOmissionReason("");
      },
    }
  );

  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const blocks = useMemo(() => data?.documents?.flatMap(d => d.blockList) ?? [], [data]);
  const summary = data?.summary;

  const total = summary?.total ?? 0;
  const covered = (summary?.mapped ?? 0) + (summary?.omitted ?? 0);
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const criticalUnresolved = useMemo(() => blocks.filter((b) => b.criticality === "critical" && b.status === "unresolved").length, [blocks]);

  const filterBlock = (b: SourceBlockView) =>
    (filterCrit === "all" || b.criticality === filterCrit) &&
    (filterStatus === "all" || b.status === filterStatus);

  const filteredBlocks = useMemo(() => blocks.filter(filterBlock), [blocks, filterCrit, filterStatus]);

  const handleToggleSelection = (blockId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredBlocks.length && filteredBlocks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBlocks.map((b) => b.id)));
    }
  };

  // Check if any selected block is critical
  const hasCriticalSelected = useMemo(() => {
    return Array.from(selectedIds).some(
      (blockId) => blocks.find((b) => b.id === blockId)?.criticality === "critical"
    );
  }, [selectedIds, blocks]);

  const handleApprove = () => {
    updateBlocks.mutate({
      blockIds: Array.from(selectedIds),
      status: "mapped",
    });
  };

  const handleOmit = () => {
    if (hasCriticalSelected) {
      setOmitModalOpen(true);
    } else {
      updateBlocks.mutate({
        blockIds: Array.from(selectedIds),
        status: "omitted",
      });
    }
  };

  const submitCriticalOmit = () => {
    updateBlocks.mutate({
      blockIds: Array.from(selectedIds),
      status: "omitted",
      omissionReason,
    });
  };

  return (
    <div className="space-y-8 pb-32">
      <PageHeader
        title={ar ? "خريطة المصادر" : "Source Map"}
        description={
          ar
            ? "كل كتلة من ملف المقرر مع موقعها الأصلي ودرجة أهميتها وحالة تغطيتها."
            : "Every block from your course file with its original locator, criticality, and coverage status."
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "خريطة المصادر" : "Source Map" },
        ]}
        actions={data && <Badge variant="outline" className="px-3 py-1 bg-muted/50">{data.parseStatus}</Badge>}
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {data && (
        <>
          {/* Coverage Donut Card - Premium Redesign (Scaled Down) */}
          <div className="relative overflow-hidden flex flex-col sm:flex-row items-center gap-7 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 shadow-md shadow-slate-200/50 dark:shadow-black/40 group">
            {/* Background ambient glow based on status */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-40 mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000 ${
              pct >= 98 ? "bg-emerald-400" : pct >= 80 ? "bg-amber-400" : "bg-red-500"
            }`} />
            
            <div className="relative flex items-center justify-center shrink-0">
              {/* Glow behind the SVG */}
              <div className={`absolute inset-0 blur-xl opacity-30 rounded-full ${
                pct >= 98 ? "bg-emerald-500" : pct >= 80 ? "bg-amber-500" : "bg-red-500"
              }`} />
              
              {/* SVG Donut */}
              <svg className="relative h-[72px] w-[72px] shrink-0 -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  strokeWidth="3.5"
                  stroke={pct >= 98 ? "#10B981" : pct >= 80 ? "#F59E0B" : "#EF4444"}
                  strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <text
                  x="18"
                  y="20.5"
                  textAnchor="middle"
                  className="fill-slate-800 dark:fill-white text-[8px] font-extrabold tracking-tighter"
                  transform="rotate(90 18 18)"
                >
                  {pct}%
                </text>
              </svg>
            </div>

            <div className="relative flex flex-col justify-center text-center sm:text-left z-10">
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="font-display font-extrabold text-4xl tracking-tight text-slate-900 dark:text-white leading-none">
                  {covered}
                </span>
                <span className="font-display font-bold text-2xl text-slate-400/80 dark:text-slate-500 leading-none">
                  /{total}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-400 mt-1.5 mb-2.5">
                {ar ? "كتل مغطاة" : "Blocks Covered"}
              </span>
              
              <div className="flex items-center justify-center sm:justify-start">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
                  pct >= 98 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400" 
                    : pct >= 80 
                    ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400" 
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-400"
                }`}
              >
                {pct >= 98 ? <CheckCircle2 className="h-4 w-4" /> : pct >= 80 ? <AlertTriangle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span>
                  {pct >= 98
                    ? ar
                      ? "تم استيفاء بوابة التغطية وفق المعايير BRD §7.2"
                      : "Source Requirements Met"
                    : pct >= 80
                    ? ar
                      ? "التغطية أقل من الهدف المحدد 98%"
                      : "Coverage below 98% target"
                    : ar
                    ? "عجز حرج في تغطية المصادر"
                    : "Critical coverage shortfall"}
                </span>
              </div>
              </div>
              
              {criticalUnresolved > 0 && (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-red-600 dark:text-red-400 animate-pulse">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {criticalUnresolved}{" "}
                    {ar
                      ? "كتل حرجة غير محسومة — تصدير معلق"
                      : `critical block${criticalUnresolved !== 1 ? "s" : ""} unresolved — export blocked`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 5-Card Summary Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: ar ? "الإجمالي" : "Total", value: summary?.total ?? 0, color: "text-foreground" },
              { label: ar ? "حرجة" : "Critical", value: summary?.critical ?? 0, color: "text-red-600 dark:text-red-400" },
              { label: ar ? "مرتبطة" : "Mapped", value: summary?.mapped ?? 0, color: "text-emerald-600 dark:text-emerald-400" },
              { label: ar ? "مستبعدة" : "Omitted", value: summary?.omitted ?? 0, color: "text-orange-600 dark:text-orange-400" },
              { label: ar ? "غير محسومة" : "Unresolved", value: summary?.unresolved ?? 0, color: "text-muted-foreground" },
            ].map((s) => (
              <Card key={s.label} className="border-border/50 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className={`text-3xl font-display font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 py-3 px-4 rounded-xl border border-border/60 bg-card shadow-sm">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
              {ar ? "تصفية:" : "Filter:"}
            </span>

            {/* Criticality Filters */}
            {[
              { val: "all", lbl: ar ? "الكل" : "All" },
              { val: "critical", lbl: ar ? "حرجة" : "Critical", icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" /> },
              { val: "normal", lbl: ar ? "عادية" : "Normal", icon: <Info className="h-3.5 w-3.5 text-blue-500" /> },
              { val: "low", lbl: ar ? "منخفضة" : "Low", icon: <Circle className="h-3.5 w-3.5 text-muted-foreground" /> },
            ].map(({ val, lbl, icon }) => (
              <Button
                key={val}
                size="sm"
                variant={filterCrit === val ? "default" : "outline"}
                onClick={() => setFilterCrit(val as any)}
                className={`rounded-full flex items-center gap-1.5 text-xs h-7 px-3 font-semibold ${
                  filterCrit === val ? "bg-[#0F7B8A] text-white hover:bg-[#0F7B8A]/90" : ""
                }`}
              >
                {icon && <span className={filterCrit === val ? "brightness-0 invert" : ""}>{icon}</span>}
                {lbl}
              </Button>
            ))}

            <div className="w-px h-5 bg-border/80 mx-1 hidden sm:block" />

            {/* Status Filters */}
            {[
              { val: "all", lbl: ar ? "جميع الحالات" : "All Status" },
              { val: "unresolved", lbl: ar ? "غير محسومة" : "Unresolved", icon: <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> },
              { val: "mapped", lbl: ar ? "مرتبطة" : "Mapped", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
              { val: "omitted", lbl: ar ? "مستبعدة" : "Omitted", icon: <XCircle className="h-3.5 w-3.5 text-orange-500" /> },
            ].map(({ val, lbl, icon }) => (
              <Button
                key={val}
                size="sm"
                variant={filterStatus === val ? "default" : "outline"}
                onClick={() => setFilterStatus(val as any)}
                className={`rounded-full flex items-center gap-1.5 text-xs h-7 px-3 font-semibold ${
                  filterStatus === val ? "bg-[#0E6C3C] text-white hover:bg-[#0E6C3C]/90" : ""
                }`}
              >
                {icon && <span className={filterStatus === val ? "brightness-0 invert" : ""}>{icon}</span>}
                {lbl}
              </Button>
            ))}

            <span className="ml-auto text-xs font-mono font-bold text-muted-foreground">
              {filteredBlocks.length} {ar ? "كتل معروضة" : "blocks"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-[#0F7B8A]" />
              {ar ? "كتل المحتوى" : "Content Blocks"}
            </h2>
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="rounded-xl text-xs font-semibold">
              {selectedIds.size === filteredBlocks.length && filteredBlocks.length > 0
                ? ar
                  ? "إلغاء تحديد الكل"
                  : "Deselect All"
                : ar
                ? "تحديد الكل"
                : "Select All"}
            </Button>
          </div>

          <div className="space-y-8">
            {data.documents.map((doc) => {
              const docFilteredBlocks = doc.blockList.filter(filterBlock);
              if (docFilteredBlocks.length === 0 && (filterCrit !== "all" || filterStatus !== "all")) {
                return null;
              }

              return (
                <div key={doc.id} className="space-y-4">
                  <div className="flex items-center justify-between bg-white border border-emerald-100 rounded-2xl px-5 py-3 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    <p className="text-sm font-bold text-slate-800">{doc.originalName}</p>
                    <Badge variant="secondary" className="capitalize text-xs font-mono bg-slate-100 text-slate-600 border-slate-200">
                      {doc.parseStatus} ({docFilteredBlocks.length})
                    </Badge>
                  </div>
                  <SourceBlockList
                    blocks={docFilteredBlocks}
                    selectedIds={selectedIds}
                    onToggleSelection={handleToggleSelection}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-background/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-full px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Badge className="bg-[#0F7B8A] text-white hover:bg-[#0F7B8A]">{selectedIds.size}</Badge>
              {ar ? "محددة" : "selected"}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleApprove} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-full text-xs font-bold px-4">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {ar ? "ربط بالشرائح" : "Map to Slides"}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleOmit} className="rounded-full text-xs font-bold px-4">
                <XCircle className="h-4 w-4 mr-1" />
                {ar ? "استبعاد" : "Omit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Omit Critical Confirmation Modal */}
      <AlertDialog open={omitModalOpen} onOpenChange={setOmitModalOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {ar ? "استبعاد كتلة حرجة" : "Omitting Critical Content"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              {ar
                ? "تحتوي المجموعات المحددة على كتل حرجة. يجب تقديم مبرر تربوي للاستبعاد لاستيفاء معايير الجودة."
                : "You are omitting one or more CRITICAL blocks. BRD §7.2 requires a mandatory pedagogical justification before omission."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              value={omissionReason}
              onChange={(e) => setOmissionReason(e.target.value)}
              placeholder={ar ? "اكتب مبرر الاستبعاد هنا..." : "Provide mandatory justification..."}
              className="text-xs font-mono bg-muted/30 border-border rounded-xl resize-none min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!omissionReason.trim()}
              onClick={submitCriticalOmit}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold"
            >
              {ar ? "تأكيد الاستبعاد" : "Confirm Omission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
