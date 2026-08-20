"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain, Target, TrendingUp, AlertTriangle, CheckCircle2, Loader2,
  Lightbulb, ArrowRight, Bot, Sparkles, BarChart3, BookOpen,
  Zap, Award, Star, Activity,
} from "lucide-react";

export function LearningCoachView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/student/learning/learning-coach")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d?.data || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton ar={ar} />;

  const weakTopics = data?.weakTopics || [];
  const strengths = data?.strengths || [];
  const mastery = data?.mastery || 0;
  const recommendations = data?.recommendations || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{ar ? "مدرب التعلم" : "Learning Coach"}</h1>
          <p className="text-xs text-muted-foreground">{ar ? "مدربك التكيفي للتعلّم" : "Your adaptive learning coach"}</p>
        </div>
      </div>

      <div className="space-y-6 pb-12">
        {/* Mastery Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200">
            <CardContent className="p-5 text-center">
              <Brain className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{mastery.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">{ar ? "الإتقان العام" : "Overall Mastery"}</p>
              <Progress value={mastery} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Award className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{strengths.length || 0}</p>
              <p className="text-xs text-muted-foreground">{ar ? "نقاط القوة" : "Strengths"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{weakTopics.length || 0}</p>
              <p className="text-xs text-muted-foreground">{ar ? "مواضيع تحتاج تحسين" : "Needs Improvement"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Weak Topics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />{ar ? "المهارات الضعيفة" : "Weak Areas"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakTopics.length > 0 ? weakTopics.map((t: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{t.topic || t}</p>
                    <Badge variant="secondary" className="text-[10px]">{t.score || 0}%</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{t.reason || ar ? "يحتاج ممارسة إضافية" : "Needs additional practice"}</p>
                  {t.resources?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.resources.slice(0, 2).map((r: string, ri: number) => (
                        <Badge key={ri} variant="outline" className="text-[9px] cursor-pointer hover:bg-accent">{r}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-6">{ar ? "لا توجد نقاط ضعف محددة. متابعة ممتازة!" : "No weak areas identified. Great progress!"}</p>
              )}
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-500" />{ar ? "نقاط القوة" : "Strengths"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {strengths.length > 0 ? strengths.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <p className="text-sm font-medium">{s.topic || s}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.comment || ar ? "أداء ممتاز في هذا المجال" : "Excellent performance in this area"}</p>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-6">{ar ? "لم يتم تحديد نقاط القوة بعد" : "No strengths identified yet"}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" />{ar ? "توصيات مخصصة" : "Personalized Recommendations"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((r: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-iscarb-cyan/5 to-transparent border">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.title || r}</p>
                    {r.reason && <p className="text-[10px] text-muted-foreground mt-0.5">{r.reason}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs"><ArrowRight className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Adaptive session */}
        <Card className="bg-gradient-to-br from-purple-50/30 to-blue-50/30 border-purple-200/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100"><Bot className="h-6 w-6 text-purple-600" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{ar ? "جلسة تعلم تكيفية" : "Adaptive Learning Session"}</h3>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "دعني أساعدك في فهم المفاهيم التي تواجه صعوبة فيها" : "Let me help you understand the concepts you're struggling with"}</p>
              <Button className="mt-2 gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs" size="sm">
                <Zap className="h-3.5 w-3.5" />{ar ? "ابدأ الجلسة" : "Start Session"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-10 w-48 mb-6" /><div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div></div>;
}
