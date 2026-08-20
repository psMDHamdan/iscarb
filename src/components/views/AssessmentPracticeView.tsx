"use client";

import { useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  BarChart3,
  Play,
  RotateCcw,
  BookOpen,
  Code,
  FileText,
  Monitor,
  MessageSquare,
  Search,
  Filter,
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

interface PracticeItem {
  id: string;
  title: string;
  description: string;
  type: "practice" | "mock_exam" | "coding" | "case_study" | "simulation";
  difficulty: "beginner" | "intermediate" | "advanced";
  questions: number;
  completed: number;
  timePerQuestion: number;
  topics: string[];
  bestScore: number | null;
  attempts: number;
  adaptive: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  practice: Brain,
  mock_exam: FileText,
  coding: Code,
  case_study: BookOpen,
  simulation: Monitor,
};

const TYPE_LABELS = {
  practice: { en: "Practice", ar: "تدريب" },
  mock_exam: { en: "Mock Exam", ar: "اختبار تجريبي" },
  coding: { en: "Coding", ar: "برمجة" },
  case_study: { en: "Case Study", ar: "دراسة حالة" },
  simulation: { en: "Simulation", ar: "محاكاة" },
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {[...Array(4)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

export function AssessmentPracticeView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [typeFilter, setTypeFilter] = useState("all");

  const practiceQueryUrl = `/api/v1/student/assessment/practice${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`;
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "practice", typeFilter],
    practiceQueryUrl,
  );
  const items = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.practice || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;

  const stats = useMemo(() => ({
    total: items.length,
    attempted: items.filter((i) => i.attempts > 0).length,
    avgScore: Math.round(items.filter((i) => i.bestScore !== null).reduce((s, i) => s + (i.bestScore ?? 0), 0) /
      Math.max(items.filter((i) => i.bestScore !== null).length, 1)),
    totalQuestions: items.reduce((s, i) => s + i.completed, 0),
  }), [items]);

  return (
    <StudentPageTemplate title={ar ? "التدريب" : "Practice"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: ar ? "المواضيع" : "Topics", value: stats.total, color: "text-violet-500" },
            { label: ar ? "تمت المحاولة" : "Attempted", value: stats.attempted, color: "text-amber-500" },
            { label: ar ? "متوسط النتيجة" : "Avg Score", value: `${stats.avgScore}%`, color: "text-emerald-500" },
            { label: ar ? "أسئلة محلولة" : "Solved", value: stats.totalQuestions, color: "text-blue-500" },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardContent className="p-4 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          {[{ value: "all", label: { en: "All", ar: "الكل" } },
            { value: "practice", label: { en: "Practice", ar: "تدريب" } },
            { value: "mock_exam", label: { en: "Mock Exam", ar: "اختبار تجريبي" } },
            { value: "coding", label: { en: "Coding", ar: "برمجة" } },
            { value: "case_study", label: { en: "Case Study", ar: "دراسة حالة" } },
            { value: "simulation", label: { en: "Simulation", ar: "محاكاة" } },
          ].map((t) => (
            <Badge key={t.value} variant={typeFilter === t.value ? "default" : "outline"}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium"
              onClick={() => setTypeFilter(t.value)}>
              {ar ? t.label.ar : t.label.en}
            </Badge>
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
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{ar ? "لا توجد تدريبات" : "No practice available"}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => {
              const Icon = TYPE_ICONS[item.type] || Brain;
              const label = TYPE_LABELS[item.type] ?? { en: item.type, ar: item.type };
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="group rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-iscarb-green/20 dark:bg-gray-900 dark:ring-gray-800">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-2.5">
                          <Icon className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold">{item.title}</h4>
                            {item.adaptive && <Badge className="rounded-lg bg-purple-100 text-purple-700 text-[10px]">{ar ? "تكيفي" : "Adaptive"}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="rounded-lg text-[10px]">{ar ? label.ar : label.en}</Badge>
                        <Badge variant="outline" className="rounded-lg text-[10px]"><Clock className="mr-1 h-2.5 w-2.5" />{item.timePerQuestion}s/q</Badge>
                        <Badge variant="outline" className="rounded-lg text-[10px]">{item.questions} {ar ? "سؤال" : "questions"}</Badge>
                      </div>
                      {item.attempts > 0 && (
                        <Progress value={item.bestScore ?? 0} className="h-1.5 mb-3" />
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.topics?.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="rounded-md text-[10px] font-normal">{t}</Badge>
                        ))}
                      </div>
                      <Button className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-medium text-white hover:from-cyan-600 hover:to-blue-600">
                        <Play className="mr-1 h-3 w-3" />{ar ? "بدء التدريب" : "Start Practice"}
                      </Button>
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
