"use client";

import { use, useState, useRef, useCallback } from "react";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  BookOpen,
  Target,
  Globe,
  RefreshCw,
  FileType,
  Image as ImageIcon,
  Table,
  FileCode,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */

interface SourceBlock {
  id: string;
  locator: string;
  type: string;
  text: string;
  criticality: string;
  status: string;
}

interface SourceDocument {
  id: string;
  originalName: string;
  type: string;
  parseStatus: string;
  version: number;
  blocks: {
    total: number;
    critical: number;
    normal: number;
    low: number;
    mapped: number;
    unresolved: number;
    omitted: number;
    byType: Record<string, number>;
  };
  blockList: SourceBlock[];
}

interface SourceMapResponse {
  projectId: string;
  parseStatus: string;
  project: {
    id: string;
    title: string;
    status: string;
    courseProfile: {
      courseCode: string;
      title: string;
      cloCount: number;
    };
  };
  documents: SourceDocument[];
  summary: {
    total: number;
    critical: number;
    mapped: number;
    omitted: number;
    unresolved: number;
  };
}

/* ── Helpers ───────────────────────────────────────────────────────── */

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  pptx: FileType,
  docx: FileText,
  html: FileCode,
  htm: FileCode,
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
};

function parseStatusLabel(status: string, ar: boolean) {
  switch (status) {
    case "done":
      return {
        label: ar ? "مكتمل" : "Parsed",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
        icon: CheckCircle2,
      };
    case "parsing":
    case "pending":
      return {
        label: ar ? "جاري المعالجة..." : "Processing...",
        cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
        icon: Loader2,
      };
    case "failed":
      return {
        label: ar ? "فشل" : "Failed",
        cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
        icon: AlertCircle,
      };
    default:
      return {
        label: status,
        cls: "bg-slate-100 text-slate-500 border-slate-200",
        icon: Clock,
      };
  }
}

function criticalityColor(c: string) {
  switch (c) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400";
    case "normal":
      return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400";
    case "low":
      return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function blockTypeIcon(type: string) {
  switch (type) {
    case "heading":
      return "H";
    case "text":
      return "T";
    case "image":
      return "I";
    case "table":
      return "║";
    case "note":
      return "N";
    default:
      return "·";
  }
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function SourceDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [showBlockText, setShowBlockText] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useApiQuery<SourceMapResponse>(
    ["lecture", "source-map", id],
    `/api/iscarb/lecture/projects/${id}/source-map`,
    { refetchInterval: 8000 },
  );

  const uploadMutation = useApiMutation<
    { documentId: string; status: string },
    FormData
  >(
    (_vars: FormData) => `/api/iscarb/lecture/projects/${id}/sources`,
    {
      onSuccess: () => {
        setTimeout(() => refetch(), 500);
      },
    },
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      uploadMutation.mutate(fd as any);
      e.target.value = "";
    },
    [uploadMutation, refetch],
  );

  const toggleBlockText = (blockId: string) => {
    setShowBlockText((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const docs = data?.documents ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={ar ? "المصادر والملفات" : "Sources & Files"}
        description={
          ar
            ? "الملفات المرفوعة للمشروع ومحتواها المستخرج وال狀態."
            : "Uploaded source files, extracted content blocks, and parse status."
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "المصادر" : "Sources" },
        ]}
        actions={
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="rounded-xl text-xs font-semibold h-9 bg-[#0F7B8A] hover:bg-[#0d6a76] text-white"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            {ar ? "رفع ملف" : "Upload File"}
          </Button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.docx,.html,.htm,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Card className="border-red-500/50">
          <CardContent className="p-4 text-sm text-red-500 font-semibold">
            {error.message}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-display font-bold tabular-nums text-slate-800">
                  {docs.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                  {ar ? "ملفات" : "Files"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-200/60 bg-blue-50/50 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-display font-bold tabular-nums text-blue-600">
                  {summary?.total ?? 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 mt-1">
                  {ar ? "كتل مستخرجة" : "Blocks"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200/60 bg-emerald-50/50 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-display font-bold tabular-nums text-emerald-600">
                  {summary?.mapped ?? 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 mt-1">
                  {ar ? "مربوطة" : "Mapped"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200/60 bg-red-50/50 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-display font-bold tabular-nums text-red-600">
                  {summary?.critical ?? 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600/70 mt-1">
                  {ar ? "حرجة" : "Critical"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Parse Status Banner */}
          {data.parseStatus !== "done" && (
            <Card className="border-blue-200/60 bg-blue-50/50 rounded-2xl shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
                <p className="text-sm font-semibold text-blue-700">
                  {ar
                    ? "جاري معالجة بعض الملفات..."
                    : "Some files are still being processed..."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {docs.length === 0 && (
            <Card className="border-dashed border-2 border-slate-200 rounded-2xl">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-600 mb-1">
                  {ar ? "لا توجد ملفات مرفوعة" : "No source files uploaded"}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  {ar
                    ? "ارفع ملفات PDF أو PPTX أو DOCX لبدء بناء المحتوى."
                    : "Upload PDF, PPTX, DOCX, or HTML files to start building content."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-xs font-semibold h-9"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {ar ? "ارفع أول ملف" : "Upload First File"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Document Cards */}
          {docs.map((doc) => {
            const FileIcon = FILE_ICONS[doc.type] ?? FileText;
            const status = parseStatusLabel(doc.parseStatus, ar);
            const StatusIcon = status.icon;
            const isExpanded = expandedDocId === doc.id;

            return (
              <Card
                key={doc.id}
                className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden"
              >
                {/* Document Header */}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <FileIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-display font-bold text-slate-800 truncate">
                          {doc.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-semibold", status.cls)}
                          >
                            <StatusIcon
                              className={cn(
                                "h-3 w-3 mr-1",
                                doc.parseStatus === "parsing" && "animate-spin"
                              )}
                            />
                            {status.label}
                          </Badge>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {doc.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5",
                          doc.blocks.total > 0
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        )}
                      >
                        {doc.blocks.total} {ar ? "كتل" : "blocks"}
                      </Badge>
                      {doc.parseStatus === "done" && doc.blocks.total > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-xl"
                          onClick={() =>
                            setExpandedDocId(isExpanded ? null : doc.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Block Stats Bar */}
                  {doc.blocks.total > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {/* Visual progress bar */}
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {doc.blocks.mapped > 0 && (
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{
                              width: `${(doc.blocks.mapped / doc.blocks.total) * 100}%`,
                            }}
                          />
                        )}
                        {doc.blocks.unresolved > 0 && (
                          <div
                            className="bg-blue-400 transition-all"
                            style={{
                              width: `${(doc.blocks.unresolved / doc.blocks.total) * 100}%`,
                            }}
                          />
                        )}
                        {doc.blocks.omitted > 0 && (
                          <div
                            className="bg-slate-300 transition-all"
                            style={{
                              width: `${(doc.blocks.omitted / doc.blocks.total) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                        {doc.blocks.critical > 0 && (
                          <span className="text-red-600 font-semibold">
                            ● {doc.blocks.critical}{" "}
                            {ar ? "حرج" : "critical"}
                          </span>
                        )}
                        <span className="text-blue-600">
                          ● {doc.blocks.unresolved}{" "}
                          {ar ? "غير مربوطة" : "unresolved"}
                        </span>
                        <span className="text-emerald-600">
                          ● {doc.blocks.mapped} {ar ? "مربوطة" : "mapped"}
                        </span>
                        {doc.blocks.omitted > 0 && (
                          <span className="text-slate-400">
                            ● {doc.blocks.omitted} {ar ? "محذوفة" : "omitted"}
                          </span>
                        )}
                      </div>

                      {/* Block type breakdown */}
                      {Object.keys(doc.blocks.byType).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(doc.blocks.byType).map(([type, count]) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-500 border-slate-200"
                            >
                              {blockTypeIcon(type)} {type} ({count})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Expanded Block List */}
                {isExpanded && doc.blockList.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 max-h-96 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {doc.blockList.slice(0, 50).map((block) => {
                        const isVisible = showBlockText.has(block.id);
                        return (
                          <div
                            key={block.id}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-100 dark:border-slate-800"
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-mono px-1.5 py-0 shrink-0 mt-0.5",
                                criticalityColor(block.criticality)
                              )}
                            >
                              {blockTypeIcon(block.type)}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400">
                                  {block.locator}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[8px] px-1 py-0",
                                    block.status === "mapped"
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                      : block.status === "omitted"
                                      ? "bg-slate-100 text-slate-400 border-slate-200"
                                      : "bg-blue-50 text-blue-500 border-blue-200"
                                  )}
                                >
                                  {block.status}
                                </Badge>
                              </div>
                              <p
                                className={cn(
                                  "text-xs text-slate-600 mt-0.5 leading-relaxed",
                                  !isVisible && "line-clamp-2"
                                )}
                              >
                                {block.text}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => toggleBlockText(block.id)}
                            >
                              {isVisible ? (
                                <EyeOff className="h-3 w-3 text-slate-400" />
                              ) : (
                                <Eye className="h-3 w-3 text-slate-400" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      {doc.blockList.length > 50 && (
                        <p className="text-[10px] text-slate-400 text-center py-2">
                          {ar
                            ? `+${doc.blockList.length - 50} كتل إضافية`
                            : `+${doc.blockList.length - 50} more blocks`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Footer Note */}
          <Card className="border-border/40 bg-muted/20 rounded-2xl">
            <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-[#0F7B8A]" />
                {ar ? "ملاحظة:" : "Note:"}
              </p>
              <p>
                {ar
                  ? "الملفات تُحلّل تلقائياً إلى كتل مصدرية. الكتل الحرجة (critical) ضرورية للمحتوى ولا يمكن حذفها بدون سبب. استخدم خريطة المصادر (Source Map) لربط الكتل بمخرجات التعلّم."
                  : "Files are automatically parsed into source blocks. Critical blocks are essential for content and cannot be omitted without justification. Use the Source Map to map blocks to CLOs."}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
