"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/iscarb/PageHeader";
import {
  BookOpen, GraduationCap, CheckCircle2, PlayCircle, Clock,
  Loader2, AlertCircle, Map, Target, Star, Trophy, ArrowRight,
  Sparkles, Bot, TrendingUp,
} from "lucide-react";

interface PathData {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  matchScore: number;
  progress: number;
  milestones: { title: string; done: boolean }[];
  courses: number;
  duration: string;
}

export function LearningPathsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "learning", "paths"],
    "/api/v1/student/learning/learning-paths",
  );
  const paths = rawRes?.data || rawRes?.paths || [];
  const error = queryError?.message ?? null;
  const [generating, setGenerating] = useState(false);

  const generatePaths = async () => {
    setGenerating(true);
    try {
      const r = await fetch("/api/v1/student/learning/learning-paths", { method: "POST" });
      const d = await r.json();
      setPaths(d.data || d.paths || []);
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <PageHeader title={ar ? "مسارات التعلم" : "Learning Paths"} description={ar ? "مسارات مخصصة لتطوير مهاراتك" : "Personalized paths to develop your skills"} />
        <div className="space-y-4"><Skeleton className="h-12 w-full rounded-xl" /><div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <PageHeader title={ar ? "مسارات التعلم" : "Learning Paths"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ في التحميل" : "Error Loading"}</h4><p className="text-sm text-muted-foreground mt-1">{error}</p></div>
        </CardContent></Card>
      </div>
    );
  }

  const pct = paths.length > 0 ? Math.round(paths.reduce((s, p) => s + (p.progress || 0), 0) / paths.length) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title={ar ? "مسارات التعلم" : "Learning Paths"} description={ar ? "مسارات مخصصة لتطوير مهاراتك" : "Personalized paths to develop your skills"} />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-4">
          {[
            { icon: Map, label: ar ? "المسارات" : "Paths", value: paths.length, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: TrendingUp, label: ar ? "متوسط التقدم" : "Avg Progress", value: `${pct}%`, color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Trophy, label: ar ? "مكتملة" : "Completed", value: paths.filter(p => p.progress >= 100).length, color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Target, label: ar ? "نسبة المطابقة" : "Match", value: paths.length > 0 ? `${Math.round(paths.reduce((s, p) => s + (p.matchScore || 0), 0) / paths.length)}%` : "-", color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-all"><CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent></Card>
          ))}
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={generatePaths} disabled={generating} className="gap-2 bg-iscarb-cyan hover:bg-iscarb-cyan/90">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? (ar ? "جاري التوليد..." : "Generating...") : (ar ? "توليد مسارات مخصصة" : "Generate Personalized Paths")}
          </Button>
          <Button variant="outline" className="gap-2">
            <Bot className="h-4 w-4" />
            {ar ? "اسأل الذكاء الاصطناعي" : "Ask AI"}
          </Button>
        </div>

        {/* Paths Grid */}
        {paths.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {paths.map((p, i) => {
              const milestonesDone = p.milestones?.filter(m => m.done).length || 0;
              const milestonesTotal = p.milestones?.length || 0;
              return (
                <motion.div key={p.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="text-[10px]">{p.difficulty || (ar ? "مبتدئ" : "Beginner")}</Badge>
                        <Badge variant="secondary" className="text-[10px] gap-1"><Star className="h-3 w-3" />{p.matchScore || 0}% {ar ? "مطابقة" : "match"}</Badge>
                      </div>
                      <CardTitle className="text-base mt-2">{p.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Skills */}
                      {p.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.skills.slice(0, 3).map((s, si) => <Badge key={si} variant="secondary" className="text-[9px]">{s}</Badge>)}
                          {p.skills.length > 3 && <Badge variant="outline" className="text-[9px]">+{p.skills.length - 3}</Badge>}
                        </div>
                      )}
                      {/* Milestones */}
                      {milestonesTotal > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground">{ar ? "المعالم" : "Milestones"} ({milestonesDone}/{milestonesTotal})</p>
                          {p.milestones.slice(0, 3).map((m, mi) => (
                            <div key={mi} className="flex items-center gap-2 text-xs">
                              {m.done ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                              <span className={m.done ? "text-muted-foreground line-through" : ""}>{m.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{ar ? "التقدم" : "Progress"}</span>
                          <span>{p.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${(p.progress || 0) >= 100 ? "bg-emerald-500" : "bg-iscarb-cyan"}`} style={{ width: `${p.progress || 0}%` }} />
                        </div>
                      </div>
                      {/* CTA */}
                      <Button size="sm" className="w-full gap-2 mt-2">
                        {(p.progress || 0) > 0 ? (ar ? "متابعة" : "Continue") : (ar ? "ابدأ الآن" : "Start Now")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="p-12 flex flex-col items-center text-center">
            <Map className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{ar ? "لا توجد مسارات تعلم متاحة" : "No learning paths available"}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{ar ? "اضغط على زر التوليد لإنشاء مسارات مخصصة" : "Click generate to create personalized paths"}</p>
            <Button onClick={generatePaths} disabled={generating} className="mt-4 gap-2">
              <Sparkles className="h-4 w-4" />{ar ? "توليد المسارات" : "Generate Paths"}
            </Button>
          </CardContent></Card>
        )}

        {/* AI Section */}
        {paths.length > 0 && (
          <Card className="bg-gradient-to-br from-iscarb-cyan/5 to-transparent border-iscarb-cyan/20">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-iscarb-cyan/10"><Bot className="h-5 w-5 text-iscarb-cyan" /></div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{ar ? "توصيات الذكاء الاصطناعي" : "AI Recommendations"}</h4>
                <p className="text-xs text-muted-foreground mt-1">{ar ? "بناءً على مهاراتك الحالية وأهدافك المهنية، نوصي بالتركيز على المسار الأول لتحقيق أقصى تقدم." : "Based on your current skills and career goals, we recommend focusing on the first path for maximum progress."}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
