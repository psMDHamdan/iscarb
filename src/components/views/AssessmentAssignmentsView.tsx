"use client";

import { useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  Upload,
  Download,
  Eye,
  Star,
  Target,
  MessageSquare,
  Paperclip,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  PenLine,
  FileCheck,
  X,
  Bot,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types & Helpers ────────────────────────────────────────────────────────

interface AssignmentSubmission {
  id: string;
  title: string;
  description: string;
  status: "pending" | "submitted" | "graded" | "late" | "resubmit";
  dueDate: string;
  submittedAt?: string;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  rubric: { criterion: string; weight: number; score: number | null; maxScore: number }[];
  files: { name: string; size: number; uploadedAt: string }[];
  maxFiles: number;
  allowedFormats: string[];
}

const STATUS_MAP: Record<string, { label: string; labelAr: string; color: string }> = {
  pending: { label: "Pending", labelAr: "معلق", color: "bg-amber-100 text-amber-700" },
  submitted: { label: "Submitted", labelAr: "تم التقديم", color: "bg-blue-100 text-blue-700" },
  graded: { label: "Graded", labelAr: "مصحح", color: "bg-emerald-100 text-emerald-700" },
  late: { label: "Late", labelAr: "متأخر", color: "bg-red-100 text-red-700" },
  resubmit: { label: "Resubmit", labelAr: "إعادة تقديم", color: "bg-purple-100 text-purple-700" },
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

export function AssessmentAssignmentsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const assignmentsQueryUrl = `/api/v1/student/assessment/assignments${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`;
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "assignments", statusFilter],
    assignmentsQueryUrl,
  );
  const assignments = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.assignments || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;

  const stats = useMemo(() => ({
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending" || a.status === "late").length,
    graded: assignments.filter((a) => a.status === "graded").length,
    avgScore: assignments.filter((a) => a.score !== null).reduce((s, a) => s + (a.score ?? 0), 0) /
      Math.max(assignments.filter((a) => a.score !== null).length, 1),
  }), [assignments]);

  return (
    <StudentPageTemplate title={ar ? "التكليفات" : "Assignments"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: ar ? "إجمالي" : "Total", value: stats.total, color: "text-blue-500" },
            { label: ar ? "معلق" : "Pending", value: stats.pending, color: "text-amber-500" },
            { label: ar ? "مصحح" : "Graded", value: stats.graded, color: "text-emerald-500" },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardContent className="p-4 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={ar ? "ابحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border-gray-200 pl-10 dark:border-gray-700" />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "submitted", "graded", "late", "resubmit"].map((st) => (
            <Badge key={st} variant={statusFilter === st ? "default" : "outline"}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              onClick={() => setStatusFilter(st)}>
              {st === "all" ? (ar ? "الكل" : "All") : ar ? STATUS_MAP[st]?.labelAr ?? st : STATUS_MAP[st]?.label ?? st}
            </Badge>
          ))}
        </div>

        {/* Loading */}
        {loading && <LoadingSkeleton ar={ar} />}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-red-400" />
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && assignments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{ar ? "لا توجد تكليفات" : "No assignments"}</p>
          </div>
        )}

        {/* List */}
        {!loading && !error && assignments.length > 0 && (
          <div className="space-y-3">
            {assignments.map((a, i) => {
              const st = STATUS_MAP[a.status] ?? { label: a.status, labelAr: a.status, color: "" };
              const isLate = a.status === "late";
              const isOverdue = a.status === "pending" && new Date(a.dueDate) < new Date();
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800 ${
                    isLate || isOverdue ? "ring-red-300/50" : ""
                  }`}
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-2.5">
                            <FileText className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{a.title}</h4>
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                          </div>
                        </div>
                        <Badge className={`rounded-lg text-xs ${st.color}`}>
                          {ar ? st.labelAr : st.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(a.dueDate).toLocaleDateString()}</span>
                        {a.submittedAt && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{ar ? "قدمت في" : "Submitted"}: {new Date(a.submittedAt).toLocaleDateString()}</span>}
                        {a.score !== null && <span className="font-semibold text-emerald-600">{a.score}/{a.maxScore}</span>}
                        <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{a.files?.length ?? 0}/{a.maxFiles}</span>
                      </div>

                      {/* Expand: Rubric + Feedback */}
                      {expandedId === a.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 space-y-3 border-t pt-3 dark:border-gray-800">
                          {a.rubric?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">{ar ? "سلم التقييم" : "Rubric"}</p>
                              {a.rubric.map((r, j) => (
                                <div key={j} className="flex items-center justify-between text-xs">
                                  <span>{r.criterion} ({r.weight}%)</span>
                                  <span className="font-semibold">{r.score !== null ? `${r.score}/${r.maxScore}` : "-"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {a.feedback && (
                            <div className="rounded-lg bg-blue-50/50 p-3 text-xs leading-relaxed dark:bg-blue-900/10">
                              <div className="flex items-center gap-1 mb-1 font-medium"><MessageSquare className="h-3 w-3" />{ar ? "ملاحظات" : "Feedback"}</div>
                              {a.feedback}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" className="rounded-lg bg-iscarb-green text-xs text-white hover:bg-iscarb-green-dark flex-1">
                              {a.status === "pending" ? <Upload className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                              {a.status === "pending" ? (ar ? "تقديم" : "Submit") : ar ? "عرض" : "View"}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg text-xs">
                              <Download className="mr-1 h-3 w-3" />{ar ? "تحميل" : "Download"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
