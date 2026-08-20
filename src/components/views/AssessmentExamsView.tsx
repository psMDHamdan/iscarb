"use client";

import { useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Brain,
  Shield,
  Play,
  RotateCcw,
  Eye,
  FileText,
  Calendar,
  AlertTriangle,
  Lock,
  Unlock,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  BookOpen,
  ArrowRight,
  Timer,
  ListChecks,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExamItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: number;
  status: "upcoming" | "in_progress" | "completed" | "missed" | "review";
  scheduledDate: string;
  submittedAt?: string;
  progress: number;
  score?: number;
  maxScore?: number;
  autosaveEnabled: boolean;
  proctoringEnabled: boolean;
  passed: boolean | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  upcoming: { icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
  in_progress: { icon: Timer, color: "text-amber-600", bgColor: "bg-amber-100" },
  completed: { icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  missed: { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
  review: { icon: Eye, color: "text-purple-600", bgColor: "bg-purple-100" },
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

export function AssessmentExamsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "exams"],
    "/api/v1/student/assessment/exams",
  );
  const exams = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.exams || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;
  const [activeTab, setActiveTab] = useState("all");

  const stats = useMemo(() => ({
    total: exams.length,
    inProgress: exams.filter((e) => e.status === "in_progress").length,
    completed: exams.filter((e) => e.status === "completed").length,
    upcoming: exams.filter((e) => e.status === "upcoming").length,
  }), [exams]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return exams;
    return exams.filter((e) => e.status === activeTab);
  }, [exams, activeTab]);

  return (
    <StudentPageTemplate title={ar ? "الامتحانات" : "Exams"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: ar ? "الإجمالي" : "Total", value: stats.total, color: "text-violet-500" },
            { label: ar ? "قيد التنفيذ" : "In Progress", value: stats.inProgress, color: "text-amber-500" },
            { label: ar ? "مكتمل" : "Completed", value: stats.completed, color: "text-emerald-500" },
            { label: ar ? "قادم" : "Upcoming", value: stats.upcoming, color: "text-blue-500" },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardContent className="p-4 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl bg-muted/50 p-1">
            {["all", "upcoming", "in_progress", "completed", "missed", "review"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                {tab === "all" ? (ar ? "الكل" : "All")
                  : tab === "in_progress" ? (ar ? "قيد التنفيذ" : "In Progress")
                  : ar ? tab : tab.charAt(0).toUpperCase() + tab.slice(1).replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading && <LoadingSkeleton ar={ar} />}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="mb-4 h-10 w-10 text-red-400" />
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
                </Button>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{ar ? "لا توجد امتحانات" : "No exams"}</p>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-3">
                {filtered.map((exam, i) => {
                  const cfg = STATUS_CONFIG[exam.status] ?? { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100" };
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className={`rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800 ${
                        exam.status === "in_progress" ? "ring-amber-300/50" : exam.status === "missed" ? "ring-red-300/50" : ""
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.bgColor}`}>
                              <Icon className={`h-6 w-6 ${cfg.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <h4 className="text-sm font-semibold">{exam.title}</h4>
                                  <p className="text-xs text-muted-foreground">{exam.description}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration} min</span>
                                <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{exam.questions} {ar ? "سؤال" : "questions"}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(exam.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              {exam.status === "in_progress" && (
                                <div className="mt-2">
                                  <Progress value={exam.progress} className="h-1.5 bg-amber-100 [&>div]:bg-amber-500" />
                                  <p className="mt-1 text-[10px] text-amber-600">{exam.progress}% {ar ? "مكتمل" : "completed"}</p>
                                </div>
                              )}
                              {exam.score !== null && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-lg font-bold">{exam.score}/{exam.maxScore}</span>
                                  {exam.passed !== null && (
                                    <Badge className={`rounded-lg text-xs ${exam.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                      {exam.passed ? (ar ? "ناجح" : "Passed") : (ar ? "راسب" : "Failed")}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="mt-3 flex items-center gap-2">
                                {(exam.autosaveEnabled || exam.proctoringEnabled) && (
                                  <div className="flex gap-2">
                                    {exam.autosaveEnabled && <Badge variant="outline" className="rounded-md text-[10px] text-blue-600"><Save className="mr-1 h-2.5 w-2.5" />{ar ? "حفظ تلقائي" : "Autosave"}</Badge>}
                                    {exam.proctoringEnabled && <Badge variant="outline" className="rounded-md text-[10px] text-purple-600"><Shield className="mr-1 h-2.5 w-2.5" />{ar ? "مراقبة" : "Proctored"}</Badge>}
                                  </div>
                                )}
                                <Button size="sm" className="ml-auto rounded-lg bg-iscarb-green text-xs text-white hover:bg-iscarb-green-dark">
                                  {exam.status === "in_progress" ? <>
                                    <Play className="mr-1 h-3 w-3" />{ar ? "متابعة" : "Resume"}
                                  </> : exam.status === "completed" || exam.status === "review" ? <>
                                    <Eye className="mr-1 h-3 w-3" />{ar ? "مراجعة" : "Review"}
                                  </> : exam.status === "missed" ? <>
                                    <RotateCcw className="mr-1 h-3 w-3" />{ar ? "إعادة" : "Retake"}
                                  </> : <>
                                    <Play className="mr-1 h-3 w-3" />{ar ? "بدء" : "Start"}
                                  </>}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentPageTemplate>
  );
}
