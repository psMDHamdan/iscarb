"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock, Flame, BookOpen, TrendingUp, Brain, Target, Zap, Award,
  Calendar, CheckCircle2, Loader2, AlertCircle, Sparkles, Bot,
  BarChart3, Star, Activity, ArrowRight, Lightbulb,
} from "lucide-react";

interface LearningOverviewData {
  healthScore: number;
  totalStudyHours: number;
  currentStreak: number;
  sessionsThisWeek: number;
  completionPercentage: number;
  weeklyGoal: number;
  dailyGoal: number;
  courses: { id: string; name: string; code: string; progress: number }[];
  recommendedPaths: { id: string; title: string; description: string; matchScore: number }[];
  recentActivity: { date: string; hours: number; topic: string }[];
  aiBrief: { summary: string; tip: string; focus: string };
}

export function LearningOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "learning", "overview"],
    "/api/v1/student/learning/overview",
  );
  const data = rawRes?.data ?? rawRes as LearningOverviewData | null;
  const error = queryError?.message ?? null;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);

  const askAI = async () => {
    setAiLoading(true);
    try {
      const r = await fetch("/api/v1/student/learning/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Generate daily learning brief with focus areas" }),
      });
      const d = await r.json();
      setAiBrief(d.brief || (d.data?.brief) || (ar ? "ركز على مراجعة المفاهيم الأساسية اليوم" : "Focus on reviewing core concepts today"));
    } catch { setAiBrief(ar ? "ركز على مراجعة المفاهيم الأساسية اليوم" : "Focus on reviewing core concepts today"); }
    finally { setAiLoading(false); }
  };

  if (loading) {
    return (
      <StudentPageTemplate title={ar ? "نظرة عامة على التعلم" : "Learning Overview"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "نظرة عامة" : "Overview" }]}>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </StudentPageTemplate>
    );
  }

  if (error) {
    return (
      <StudentPageTemplate title={ar ? "نظرة عامة على التعلم" : "Learning Overview"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "نظرة عامة" : "Overview" }]}>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ في التحميل" : "Error Loading"}</h4>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button>
            </div>
          </CardContent>
        </Card>
      </StudentPageTemplate>
    );
  }

  const d = data as any;
  if (!d) {
    return (
      <StudentPageTemplate title={ar ? "نظرة عامة على التعلم" : "Learning Overview"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "نظرة عامة" : "Overview" }]}>
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "لا توجد بيانات" : "No data available"}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </StudentPageTemplate>
    );
  }
  const student = d.student ?? d;
  const healthScore = d.healthScore ?? Math.min(100, Math.round(((student.completionPercentage ?? 0) + (student.sessionsThisWeek ?? 0) * 5 + (student.currentStreak ?? 0) * 3)));
  const totalStudyHours = d.totalStudyHours ?? student.totalStudyHours ?? 0;
  const currentStreak = d.currentStreak ?? student.currentStreak ?? 0;
  const sessionsThisWeek = d.sessionsThisWeek ?? student.sessionsThisWeek ?? 0;
  const completionPercentage = d.completionPercentage ?? student.completionPercentage ?? 0;
  const weeklyGoal = d.weeklyGoal ?? 10;
  const dailyGoal = d.dailyGoal ?? 3;
  const courses = d.courses ?? [];
  const recommendedPaths = (d.recommendedPaths ?? []).map((p: any) => ({ id: p.id, title: p.title ?? p.name ?? "", description: p.description ?? "", matchScore: p.matchScore ?? 80 }));
  const recentActivity = (d.recentActivity ?? d.recentSessions ?? []).map((a: any) => ({ date: a.date ?? a.createdAt ?? "", hours: a.hours ?? (a.durationMinutes ? Math.round(a.durationMinutes / 60 * 10) / 10 : 1), topic: a.topic ?? "" }));
  const computedAiBrief = d.aiBrief ?? { summary: "", tip: "", focus: "" };
  const healthColor = healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-red-600";
  const healthBg = healthScore >= 80 ? "bg-emerald-50" : healthScore >= 50 ? "bg-amber-50" : "bg-red-50";

  return (
    <StudentPageTemplate title={ar ? "نظرة عامة على التعلم" : "Learning Overview"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "نظرة عامة" : "Overview" }]}>
      <div className="space-y-6 pb-12">
        {/* AI Daily Brief */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-iscarb-cyan/5 via-purple-50/30 to-transparent border-iscarb-cyan/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5 text-iscarb-cyan" />
                  {ar ? "الموجز اليومي للتعلم" : "Daily Learning Brief"}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={askAI} disabled={aiLoading} className="h-8 gap-1.5 text-xs border-iscarb-cyan/30 text-iscarb-cyan-dark">
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {aiLoading ? (ar ? "جاري التوليد..." : "Generating...") : (ar ? "توليد الموجز" : "Generate Brief")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">{typeof aiBrief === "string" ? aiBrief : (computedAiBrief?.summary || computedAiBrief?.tip || (ar ? "مرحباً! استعد لجلسة تعلم مثمرة اليوم." : "Welcome! Get ready for a productive learning session today."))}</p>
              {computedAiBrief?.tip && !aiBrief && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><Lightbulb className="h-3 w-3 text-amber-500" />{ar ? "نصيحة: " : "Tip: "}{computedAiBrief.tip}</p>}
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={`${healthBg} dark:${healthBg.replace('bg-', 'dark:bg-').replace('50', '950/20')} border-0`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "درجة صحة التعلم" : "Learning Health Score"}</p>
                <p className={`text-3xl font-bold mt-1 ${healthColor}`}>{healthScore}%</p>
              </div>
              <div className="flex gap-3">
                <StatBadge icon={Flame} value={`${currentStreak}d`} label={ar ? "التتابع" : "Streak"} />
                <StatBadge icon={Activity} value={`${sessionsThisWeek}`} label={ar ? "جلسة" : "Sessions"} />
                <StatBadge icon={BarChart3} value={`${completionPercentage}%`} label={ar ? "الإكمال" : "Done"} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: ar ? "ساعات الدراسة" : "Study Hours", value: `${totalStudyHours}h`, sub: ar ? "هذا الشهر" : "this month", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Flame, label: ar ? "التتابع الحالي" : "Current Streak", value: `${currentStreak}`, sub: ar ? "يوم" : "days", color: "text-orange-600", bg: "bg-orange-50" },
            { icon: BookOpen, label: ar ? "الجلسات" : "Sessions", value: `${sessionsThisWeek}`, sub: ar ? "هذا الأسبوع" : "this week", color: "text-purple-600", bg: "bg-purple-50" },
            { icon: TrendingUp, label: ar ? "الإنجاز" : "Completion", value: `${completionPercentage}%`, sub: ar ? "إجمالي" : "total", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.bg} dark:${s.bg.replace('bg-', 'dark:bg-').replace('50', '950/20')}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    <p className="text-[9px] text-muted-foreground/60">{s.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Goals */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-iscarb-cyan" />{ar ? "أهداف التعلم" : "Learning Goals"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <GoalRow label={ar ? "الهدف الأسبوعي" : "Weekly Goal"} current={sessionsThisWeek} total={weeklyGoal} />
              <GoalRow label={ar ? "الهدف اليومي" : "Daily Goal"} current={sessionsThisWeek > 0 ? 1 : 0} total={dailyGoal} />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-iscarb-cyan" />{ar ? "النشاط الأخير" : "Recent Activity"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentActivity?.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.slice(0, 3).map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/50">
                      <span className="font-medium">{a.topic}</span>
                      <span className="text-muted-foreground">{a.hours}h • {new Date(a.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">{ar ? "لا يوجد نشاط حديث" : "No recent activity"}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5 text-iscarb-cyan" />{ar ? "المساقات المسجلة" : "Enrolled Courses"}</CardTitle>
            <Badge variant="secondary" className="text-xs">{courses?.length || 0}</Badge>
          </CardHeader>
          <CardContent>
            {courses?.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map((c: any, i: number) => (
                  <div key={c.id || i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{c.progress || 0}%</span>
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div className="bg-iscarb-cyan h-1.5 rounded-full" style={{ width: `${c.progress || 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">{ar ? "لم تسجل في أي مساق بعد" : "No courses enrolled yet"}</p>
            )}
          </CardContent>
        </Card>

        {/* Recommended Paths */}
        {recommendedPaths?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Award className="h-5 w-5 text-iscarb-cyan" />{ar ? "مسارات التعلم الموصى بها" : "Recommended Learning Paths"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {recommendedPaths.map((p: any, i: number) => (
                <div key={p.id || i} className="p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2">{p.matchScore}%</Badge>
                  </div>
                  <Button size="sm" variant="link" className="mt-2 h-7 text-xs px-0 text-iscarb-cyan">
                    {ar ? "عرض المسار" : "View Path"} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </StudentPageTemplate>
  );
}

function StatBadge({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground" />
      <p className="text-sm font-bold mt-0.5">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function GoalRow({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = Math.min(Math.round((current / Math.max(total, 1)) * 100), 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{current}/{total}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-iscarb-cyan"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
