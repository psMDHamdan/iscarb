"use client";

import { useEffect, useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Target,
  Brain,
  BookOpen,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Hourglass,
  AlertTriangle,
  Layers,
  TrendingUp,
  Plus,
  List,
  Grid3X3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface MyAssessment {
  id: string;
  title: string;
  type: string;
  status: "active" | "scheduled" | "completed" | "missed" | "draft";
  progress: number;
  score?: number;
  maxScore?: number;
  dueDate?: string;
  startedAt?: string;
  submittedAt?: string;
  priority: "high" | "medium" | "low";
  competency: string;
  category: string;
  timeRemaining?: number;
  attempts: number;
  maxAttempts: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  missed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: Clock,
  scheduled: Calendar,
  completed: CheckCircle2,
  missed: XCircle,
  draft: AlertTriangle,
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AssessmentMyView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const myAssessParams = new URLSearchParams();
  if (debouncedSearch) myAssessParams.set("search", debouncedSearch);
  if (activeTab !== "all") myAssessParams.set("status", activeTab);
  if (typeFilter !== "all") myAssessParams.set("type", typeFilter);

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "my-assessments", activeTab, debouncedSearch],
    `/api/v1/student/assessment/my-assessments?${myAssessParams}`,
  );
  const assessments = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.assessments || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;

  // Stats
  const stats = useMemo(() => {
    return {
      active: assessments.filter((a) => a.status === "active").length,
      scheduled: assessments.filter((a) => a.status === "scheduled").length,
      completed: assessments.filter((a) => a.status === "completed").length,
      missed: assessments.filter((a) => a.status === "missed").length,
      draft: assessments.filter((a) => a.status === "draft").length,
      total: assessments.length,
    };
  }, [assessments]);

  // Priority sort
  const sorted = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...assessments].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });
  }, [assessments]);

  return (
    <StudentPageTemplate title={ar ? "تقييماتي" : "My Assessments"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Mini Stats */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-blue-500">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "نشط" : "Active"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-purple-500">{stats.scheduled}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مجدول" : "Scheduled"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-emerald-500">{stats.completed}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مكتمل" : "Done"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-red-500">{stats.missed}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "فات" : "Missed"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-gray-500">{stats.draft}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مسودة" : "Draft"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={ar ? "ابحث..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border-gray-200 pl-10 dark:border-gray-700"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-40 rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-gray-700"
            >
              <option value="all">{ar ? "جميع الأنواع" : "All Types"}</option>
              <option value="quiz">{ar ? "اختبار قصير" : "Quiz"}</option>
              <option value="exam">{ar ? "امتحان" : "Exam"}</option>
              <option value="assignment">{ar ? "تكليف" : "Assignment"}</option>
              <option value="coding">{ar ? "برمجة" : "Coding"}</option>
              <option value="viva">{ar ? "شفهي" : "Viva"}</option>
              <option value="employability">{ar ? "قابلية التوظيف" : "Employability"}</option>
            </select>
          </div>
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-l-xl rounded-r-none" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-r-xl rounded-l-none" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-xl bg-muted/50 p-1 overflow-x-auto">
            {["all", "active", "scheduled", "completed", "missed", "draft"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                {tab === "all" ? (ar ? "الكل" : "All") : ar ? tab : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3 mt-4">
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
            {!loading && !error && sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{ar ? "لا توجد تقييمات" : "No assessments"}</p>
              </div>
            )}

            {/* List */}
            {!loading && !error && sorted.length > 0 && (
              <div className={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}>
                {sorted.map((a, i) => {
                  const StatusIcon = STATUS_ICONS[a.status] || Clock;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Card className={`group rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800 ${
                        a.priority === "high" && a.status !== "completed" ? "ring-red-300/50" : ""
                      } ${viewMode === "list" ? "flex items-center gap-4 p-4" : ""}`}>
                        {viewMode === "grid" ? (
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={`rounded-lg text-[10px] ${STATUS_COLORS[a.status] || ""}`}>
                                <StatusIcon className="mr-1 h-2.5 w-2.5" />
                                {a.status}
                              </Badge>
                              {a.priority === "high" && a.status !== "completed" && (
                                <Badge className="rounded-lg bg-red-100 text-red-700 text-[10px]">{ar ? "عاجل" : "Urgent"}</Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold mb-1">{a.title}</h4>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                              <span>{a.type}</span>
                              {a.dueDate && <span>· {new Date(a.dueDate).toLocaleDateString()}</span>}
                            </div>
                            <Progress value={a.progress} className="h-1.5 mb-2" />
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>{a.progress}%</span>
                              <span>{a.attempts}/{a.maxAttempts} {ar ? "محاولات" : "attempts"}</span>
                            </div>
                          </CardContent>
                        ) : (
                          <>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              a.status === "completed" ? "bg-emerald-100" :
                              a.status === "active" ? "bg-blue-100" :
                              a.status === "missed" ? "bg-red-100" : "bg-gray-100"
                            }`}>
                              <StatusIcon className={`h-5 w-5 ${
                                a.status === "completed" ? "text-emerald-600" :
                                a.status === "active" ? "text-blue-600" :
                                a.status === "missed" ? "text-red-600" : "text-gray-600"
                              }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold truncate">{a.title}</h4>
                                <Badge className={`rounded-md text-[10px] ${STATUS_COLORS[a.status] || ""}`}>{a.status}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{a.type}</span>
                                <span>{a.progress}%</span>
                                {a.score !== null && <span className="font-semibold">{a.score}/{a.maxScore}</span>}
                              </div>
                            </div>
                            <Button size="sm" className="rounded-lg bg-iscarb-green text-xs text-white hover:bg-iscarb-green-dark shrink-0">
                              {a.status === "completed" ? (ar ? "عرض" : "View") : a.status === "active" ? (ar ? "متابعة" : "Continue") : (ar ? "بدء" : "Start")}
                            </Button>
                          </>
                        )}
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
