"use client";

import { useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Brain,
  Trophy,
  BarChart3,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Play,
  RotateCcw,
  Users,
  Medal,
  Lightbulb,
  Search,
  Filter,
  TrendingUp,
  ListChecks,
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

interface QuizItem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  questions: number;
  timeLimit: number;
  attempts: number;
  maxAttempts: number;
  bestScore: number | null;
  avgScore: number;
  category: string;
  adaptive: boolean;
  completed: boolean;
  lastAttempt?: string;
  topics: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {[...Array(3)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

export function AssessmentQuizzesView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "quizzes"],
    "/api/v1/student/assessment/quizzes",
  );
  const quizzes = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.quizzes || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const stats = useMemo(() => ({
    total: quizzes.length,
    completed: quizzes.filter((q) => q.completed).length,
    avgBest: Math.round(quizzes.filter((q) => q.bestScore !== null).reduce((s, q) => s + (q.bestScore ?? 0), 0) /
      Math.max(quizzes.filter((q) => q.bestScore !== null).length, 1)),
    attempts: quizzes.reduce((s, q) => s + q.attempts, 0),
  }), [quizzes]);

  const filtered = useMemo(() => {
    let list = quizzes;
    if (activeTab === "completed") list = list.filter((q) => q.completed);
    else if (activeTab === "pending") list = list.filter((q) => !q.completed);
    else if (activeTab === "adaptive") list = list.filter((q) => q.adaptive);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(q) || l.topics?.some((t) => t.toLowerCase().includes(q)));
    }
    return list;
  }, [quizzes, activeTab, search]);

  return (
    <StudentPageTemplate title={ar ? "الاختبارات" : "Quizzes"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: ar ? "الإجمالي" : "Total", value: stats.total, color: "text-violet-500" },
            { label: ar ? "مكتمل" : "Done", value: stats.completed, color: "text-emerald-500" },
            { label: ar ? "أفضل معدل" : "Best Avg", value: `${stats.avgBest}%`, color: "text-amber-500" },
            { label: ar ? "محاولات" : "Attempts", value: stats.attempts, color: "text-blue-500" },
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
          <div className="flex items-center justify-between mb-3">
            <TabsList className="rounded-xl bg-muted/50 p-1">
              {["all", "pending", "completed", "adaptive"].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                  {tab === "all" ? (ar ? "الكل" : "All")
                    : tab === "adaptive" ? (ar ? "تكيفي" : "Adaptive")
                    : ar ? tab : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button size="sm" className="rounded-xl bg-iscarb-green text-xs text-white hover:bg-iscarb-green-dark">
              <Sparkles className="mr-1 h-3.5 w-3.5" />{ar ? "اختبار ذكي" : "AI Quiz"}
            </Button>
          </div>

          <TabsContent value={activeTab}>
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
                <Zap className="mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{ar ? "لا توجد اختبارات" : "No quizzes"}</p>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="group rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 p-2">
                              <Zap className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold">{q.title}</h4>
                              <p className="text-xs text-muted-foreground">{q.description}</p>
                            </div>
                          </div>
                          {q.adaptive && <Badge className="rounded-lg bg-purple-100 text-purple-700 text-[10px]">{ar ? "تكيفي" : "Adaptive"}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={`rounded-lg text-[10px] ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</Badge>
                          <Badge variant="outline" className="rounded-lg text-[10px]"><Clock className="mr-1 h-2.5 w-2.5" />{q.timeLimit}m</Badge>
                          <Badge variant="outline" className="rounded-lg text-[10px]"><ListChecks className="mr-1 h-2.5 w-2.5" />{q.questions}q</Badge>
                        </div>
                        {q.attempts > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>{ar ? "أفضل نتيجة" : "Best"}: {q.bestScore}%</span>
                              <span>{q.attempts}/{q.maxAttempts} {ar ? "محاولات" : "attempts"}</span>
                            </div>
                            <Progress value={q.bestScore ?? 0} className="h-1.5" />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {q.topics?.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="rounded-md text-[10px] font-normal">{t}</Badge>
                          ))}
                        </div>
                        <Button className="w-full rounded-lg bg-iscarb-green text-xs text-white hover:bg-iscarb-green-dark">
                          {q.completed ? <RotateCcw className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
                          {q.completed ? (ar ? "إعادة" : "Retake") : ar ? "بدء" : "Start"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentPageTemplate>
  );
}
