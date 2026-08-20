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
  Download,
  Eye,
  Star,
  Target,
  MessageSquare,
  Paperclip,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
  FileCheck,
  Bot,
  Lightbulb,
  ArrowRight,
  X,
  Sparkles,
  BarChart3,
  BookOpen,
  Layers,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

interface SubmissionItem {
  id: string;
  assessmentId: string;
  title: string;
  type: string;
  status: "submitted" | "graded" | "pending_review" | "resubmit";
  submittedAt: string;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  aiEvaluation: string | null;
  files: { name: string; size: number; url?: string }[];
  version: number;
  rubricScore: { criterion: string; score: number; maxScore: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  graded: "bg-emerald-100 text-emerald-700",
  pending_review: "bg-amber-100 text-amber-700",
  resubmit: "bg-purple-100 text-purple-700",
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

export function AssessmentSubmissionsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "submissions"],
    "/api/v1/student/assessment/submissions",
  );
  const submissions = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.submissions || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: submissions.length,
    graded: submissions.filter((s) => s.status === "graded").length,
    pending: submissions.filter((s) => s.status === "pending_review" || s.status === "submitted").length,
    avgScore: Math.round(submissions.filter((s) => s.score !== null).reduce((acc, s) => acc + (s.score ?? 0), 0) /
      Math.max(submissions.filter((s) => s.score !== null).length, 1)),
  }), [submissions]);

  return (
    <StudentPageTemplate title={ar ? "التقديمات" : "Submissions"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: ar ? "الإجمالي" : "Total", value: stats.total, color: "text-violet-500" },
            { label: ar ? "مصحح" : "Graded", value: stats.graded, color: "text-emerald-500" },
            { label: ar ? "معلق" : "Pending", value: stats.pending, color: "text-amber-500" },
            { label: ar ? "متوسط النتيجة" : "Avg Score", value: `${stats.avgScore}%`, color: "text-blue-500" },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardContent className="p-4 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading/Error/Empty */}
        {loading && <LoadingSkeleton ar={ar} />}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-red-400" />
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}
        {!loading && !error && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{ar ? "لا توجد تقديمات" : "No submissions yet"}</p>
          </div>
        )}

        {/* List */}
        {!loading && !error && submissions.length > 0 && (
          <div className="space-y-3">
            {submissions.map((sub, i) => (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800"
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-2.5">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">{sub.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="rounded-md text-[10px]">{sub.type}</Badge>
                            <span>{ar ? "نسخة" : "v"}{sub.version}</span>
                            <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`rounded-lg text-xs ${STATUS_STYLES[sub.status] || ""}`}>
                        {ar ? sub.status.replace("_", " ") : sub.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {sub.score !== null && (
                        <span className="font-bold text-emerald-600">{sub.score}/{sub.maxScore}</span>
                      )}
                      <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{sub.files?.length ?? 0} {ar ? "ملف" : "files"}</span>
                      {sub.aiEvaluation && <span className="flex items-center gap-1 text-purple-600"><Bot className="h-3 w-3" />AI {ar ? "تقييم" : "Evaluation"}</span>}
                    </div>

                    {/* Expanded */}
                    {expandedId === sub.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 space-y-3 border-t pt-3 dark:border-gray-800">
                        {/* Rubric */}
                        {sub.rubricScore?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">{ar ? "سلم التقييم" : "Rubric"}</p>
                            {sub.rubricScore.map((r, j) => (
                              <div key={j} className="flex items-center justify-between text-xs">
                                <span>{r.criterion}</span>
                                <span className="font-semibold">{r.score}/{r.maxScore}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Feedback */}
                        {sub.feedback && (
                          <div className="rounded-lg bg-blue-50/50 p-3 text-xs leading-relaxed dark:bg-blue-900/10">
                            <div className="flex items-center gap-1 mb-1 font-medium"><MessageSquare className="h-3 w-3" />{ar ? "ملاحظات" : "Feedback"}</div>
                            {sub.feedback}
                          </div>
                        )}
                        {/* AI Evaluation */}
                        {sub.aiEvaluation && (
                          <div className="rounded-lg bg-purple-50/50 p-3 text-xs leading-relaxed dark:bg-purple-900/10">
                            <div className="flex items-center gap-1 mb-1 font-medium"><Bot className="h-3 w-3 text-purple-600" />AI {ar ? "تقييم" : "Evaluation"}</div>
                            {sub.aiEvaluation}
                          </div>
                        )}
                        {/* Files */}
                        {sub.files?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {sub.files.map((f, j) => (
                              <Badge key={j} variant="secondary" className="rounded-md text-[10px] cursor-pointer hover:bg-muted">
                                <FileText className="mr-1 h-2.5 w-2.5" />{f.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button size="sm" variant="outline" className="rounded-lg text-xs">
                          <Download className="mr-1 h-3 w-3" />{ar ? "تحميل" : "Download"}
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
