"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  Zap,
  Award,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Activity,
  Flame,
  GraduationCap,
  Star,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Trophy,
  Medal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface MasteryTopic {
  topic: string;
  confidence: number;
  trend: "up" | "down" | "stable";
  lastStudied: string;
  recommendedAction: string;
}

interface KnowledgeNode {
  concept: string;
  mastery: number;
  connections: string[];
  strength: "strong" | "medium" | "weak";
}

interface StudySession {
  date: string;
  duration: number;
  focus: number;
  topics: string[];
}

interface LearningIntelligence {
  analytics: {
    totalSessions: number;
    weeklySessions: number;
    averageDuration: number;
    focusScore: number;
    consistency: number;
    learningVelocity: number;
    masteryRate: number;
    retentionRate: number;
  };
  masteryPredictions: MasteryTopic[];
  knowledgeGraph: KnowledgeNode[];
  sessionHistory: StudySession[];
  weakTopics: string[];
  strengths: string[];
  insights: string[];
  weeklyProgress: { day: string; hours: number; sessions: number }[];
  performanceTrend: { month: string; score: number }[];
  predictedCompletion: { topic: string; estimatedDate: string; confidence: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-6 p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function EmptyState({
  title,
  description,
  ar,
}: {
  title: string;
  description: string;
  ar: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" dir={ar ? "rtl" : "ltr"}>
      <Brain className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h3 className="text-lg font-semibold text-iscarb-ink dark:text-white">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  ar,
}: {
  message: string;
  onRetry: () => void;
  ar: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" dir={ar ? "rtl" : "ltr"}>
      <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
      <h3 className="text-lg font-semibold text-iscarb-ink dark:text-white">
        {ar ? "خطأ في تحميل البيانات" : "Error loading data"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {ar ? "إعادة المحاولة" : "Try Again"}
      </Button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: "up" | "down" | "stable";
}) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md hover:ring-iscarb-green/20 dark:from-gray-900 dark:to-gray-800/50 dark:ring-gray-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-iscarb-ink dark:text-white">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend === "down" && <TrendingUp className="h-3 w-3 rotate-180 text-red-500" />}
            {trend === "stable" && <Minus className="h-3 w-3 text-amber-500" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Minus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningIntelligenceView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<LearningIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/student/learning/intelligence");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setData(d.data || d);
    } catch (e: any) {
      setError(e.message || "Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StudentPageTemplate title={ar ? "ذكاء التعلم" : "Learning Intelligence"}>
        <LoadingSkeleton ar={ar} />
      </StudentPageTemplate>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <StudentPageTemplate title={ar ? "ذكاء التعلم" : "Learning Intelligence"}>
        <ErrorState message={error} onRetry={fetchData} ar={ar} />
      </StudentPageTemplate>
    );
  }

  const intelligence = data;
  const a = intelligence?.analytics;

  // Chart data
  const radarData = intelligence?.knowledgeGraph
    ?.slice(0, 6)
    .map((n) => ({ topic: n.concept, mastery: n.mastery })) ?? [];

  const masteryChartData = intelligence?.masteryPredictions
    ?.slice(0, 5)
    .map((m) => ({ topic: m.topic, confidence: m.confidence })) ?? [];

  return (
    <StudentPageTemplate title={ar ? "ذكاء التعلم" : "Learning Intelligence"}>
      <div className="space-y-6 p-0 sm:p-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            icon={Brain}
            label={ar ? "درجة التركيز" : "Focus Score"}
            value={`${a?.focusScore ?? 0}%`}
            sub={ar ? "متوسط الجلسة" : "Per session avg"}
            color="bg-violet-500"
            trend={a?.focusScore && a.focusScore > 70 ? "up" : a?.focusScore && a.focusScore > 40 ? "stable" : "down"}
          />
          <StatCard
            icon={Zap}
            label={ar ? "سرعة التعلم" : "Learning Velocity"}
            value={`${a?.learningVelocity ?? 0}%`}
            sub={ar ? "مقارنة بالأسبوع الماضي" : "vs last week"}
            color="bg-amber-500"
            trend="up"
          />
          <StatCard
            icon={Award}
            label={ar ? "معدل الإتقان" : "Mastery Rate"}
            value={`${a?.masteryRate ?? 0}%`}
            sub={ar ? "المواضيع المتقنة" : "Topics mastered"}
            color="bg-emerald-500"
            trend={a?.masteryRate && a.masteryRate > 60 ? "up" : "stable"}
          />
          <StatCard
            icon={Activity}
            label={ar ? "الاستمرارية" : "Consistency"}
            value={`${a?.consistency ?? 0}%`}
            sub={ar ? "أيام متتالية" : "Days streak"}
            color="bg-sky-500"
            trend={a?.consistency && a.consistency > 50 ? "up" : "down"}
          />
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              {ar ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="mastery" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              {ar ? "الإتقان" : "Mastery"}
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              {ar ? "شجرة المعرفة" : "Knowledge Graph"}
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              {ar ? "التحليلات" : "Analytics"}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Performance Trend Chart */}
            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-iscarb-green" />
                  {ar ? "اتجاه الأداء" : "Performance Trend"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={intelligence?.performanceTrend ?? []}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        fill="url(#scoreGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="h-4 w-4 text-iscarb-green" />
                  {ar ? "النشاط الأسبوعي" : "Weekly Activity"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intelligence?.weeklyProgress ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip />
                      <Bar
                        dataKey="hours"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name={ar ? "ساعات" : "Hours"}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Weak Topics */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Trophy className="h-4 w-4 text-emerald-500" />
                    {ar ? "نقاط القوة" : "Strengths"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intelligence?.strengths?.length ? (
                    <ul className="space-y-2">
                      {intelligence.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {ar ? "لا توجد بيانات كافية" : "Not enough data yet"}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    {ar ? "مواضيع تحتاج تحسين" : "Needs Improvement"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intelligence?.weakTopics?.length ? (
                    <ul className="space-y-2">
                      {intelligence.weakTopics.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {ar ? "لا توجد مواضيع ضعيفة" : "No weak topics found"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Mastery */}
          <TabsContent value="mastery" className="space-y-6">
            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-iscarb-green" />
                  {ar ? "التوقعات والاتقان" : "Mastery Predictions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {intelligence?.masteryPredictions?.length ? (
                  intelligence.masteryPredictions.slice(0, 8).map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group rounded-xl bg-gradient-to-r from-gray-50 to-white p-4 transition-all hover:from-emerald-50/50 dark:from-gray-800/50 dark:to-gray-800 dark:hover:from-emerald-900/20"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-iscarb-ink dark:text-white">
                            {m.topic}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                m.trend === "up"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : m.trend === "down"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {m.trend === "up" && "↑"}
                              {m.trend === "down" && "↓"}
                              {m.trend === "stable" && "→"}
                              {m.trend === "up"
                                ? ar ? "في تحسن" : "Improving"
                                : m.trend === "down"
                                ? ar ? "بحاجة لمراجعة" : "Needs review"
                                : ar ? "مستقر" : "Stable"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {ar ? "آخر دراسة" : "Last studied"}: {m.lastStudied}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-iscarb-ink dark:text-white">
                            {m.confidence}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={m.confidence}
                        className={`h-2 ${
                          m.confidence >= 80
                            ? "bg-emerald-100 [&>div]:bg-emerald-500"
                            : m.confidence >= 50
                            ? "bg-amber-100 [&>div]:bg-amber-500"
                            : "bg-red-100 [&>div]:bg-red-500"
                        }`}
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        💡 {m.recommendedAction}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {ar ? "لا توجد توقعات كافية" : "Not enough predictions yet"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Predicted Completion */}
            {intelligence?.predictedCompletion?.length ? (
              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4 text-iscarb-green" />
                    {ar ? "التواريخ المتوقعة للإكمال" : "Predicted Completion Dates"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {intelligence.predictedCompletion.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {ar ? "بحلول" : "By"}: {p.estimatedDate}
                        </p>
                      </div>
                      <Badge
                        className={`rounded-lg ${
                          p.confidence >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : p.confidence >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.confidence}% {ar ? "ثقة" : "confidence"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Tab: Knowledge Graph */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Brain className="h-4 w-4 text-iscarb-green" />
                  {ar ? "شجرة المعرفة" : "Knowledge Graph"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {radarData.length > 0 ? (
                  <>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis
                            dataKey="topic"
                            tick={{ fontSize: 11 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                          />
                          <Radar
                            name={ar ? "الإتقان" : "Mastery"}
                            dataKey="mastery"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {intelligence?.knowledgeGraph?.map((node, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border p-3 ${
                            node.strength === "strong"
                              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                              : node.strength === "medium"
                              ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
                              : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{node.concept}</p>
                            {node.strength === "strong" && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                            {node.strength === "medium" && (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            {node.strength === "weak" && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {node.connections?.slice(0, 3).map((conn, j) => (
                              <Badge
                                key={j}
                                variant="outline"
                                className="rounded-md text-[10px]"
                              >
                                {conn}
                              </Badge>
                            ))}
                            {node.connections?.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{node.connections.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {ar
                      ? "لم يتم بناء شجرة المعرفة بعد. استمر في التعلم لبناءها."
                      : "Knowledge graph not built yet. Keep learning to build it."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Insights */}
          <TabsContent value="insights" className="space-y-6">
            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  {ar ? "رؤى وتوصيات" : "Insights & Recommendations"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intelligence?.insights?.length ? (
                  intelligence.insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 dark:from-blue-900/10 dark:to-indigo-900/10"
                    >
                      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {ar
                      ? "لا توجد رؤى كافية بعد. واصل التعلم."
                      : "Not enough insights yet. Keep learning."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Session History */}
            {intelligence?.sessionHistory?.length ? (
              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-iscarb-green" />
                    {ar ? "جلسات الدراسة الأخيرة" : "Recent Study Sessions"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {intelligence.sessionHistory.slice(0, 5).map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iscarb-green/10">
                          <BookOpen className="h-5 w-5 text-iscarb-green" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {session.duration} min
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.date} · {session.topics?.slice(0, 2).join(", ")}
                            {session.topics?.length > 2 && ` +${session.topics.length - 2}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`rounded-lg ${
                          session.focus >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : session.focus >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {session.focus}% {ar ? "تركيز" : "focus"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </StudentPageTemplate>
  );
}
