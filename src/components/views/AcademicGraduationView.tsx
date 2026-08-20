"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, AlertTriangle, Brain, Calendar, CheckCircle2, Circle, Clock, FileCheck, GraduationCap, Sparkles, Target, TrendingUp } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function AcademicGraduationView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [showAiReadiness, setShowAiReadiness] = useState(false);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "graduation"],
    "/api/v1/student/academic/graduation"
  );

  if (loading) {
    return (
      <><PageHeader title={ar ? "التخرج" : "Graduation"} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "التخرج" : "Graduation"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const d = data.data;
  const requirements = d.requirements || [];
  const eligible = d.eligibleToGraduate || false;
  const estGraduation = d.estimatedGraduation ? new Date(d.estimatedGraduation) : null;
  const deadline = d.applicationDeadline ? new Date(d.applicationDeadline) : null;

  const completed = requirements.filter((r: any) => r.completed).length;
  const total = requirements.length;
  const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = new Date();
  const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const daysUntilGraduation = estGraduation ? Math.ceil((estGraduation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <>
      <PageHeader title={ar ? "التخرج" : "Graduation"}
        description={ar ? `${completed}/${total} متطلب مكتمل` : `${completed}/${total} requirements met`} />

      <div className="space-y-6 pb-12">
        {/* Main Eligibility Card */}
        <Card className={`${eligible ? "bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200/50" : "bg-gradient-to-br from-amber-50 to-transparent border-amber-200/50"} hover:shadow-md transition-shadow`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${eligible ? "bg-emerald-100" : "bg-amber-100"}`}>
                  <GraduationCap className={`h-6 w-6 ${eligible ? "text-emerald-600" : "text-amber-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {eligible
                      ? (ar ? "مؤهل للتخرج" : "Eligible to Graduate")
                      : (ar ? "غير مؤهل بعد" : "Not Yet Eligible")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    {estGraduation && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {ar ? "التخرج المتوقع" : "Est. Graduation"}: {estGraduation.toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "long", year: "numeric" })}
                      </span>
                    )}
                    {daysUntilGraduation && daysUntilGraduation > 0 && (
                      <Badge variant="outline" className="text-[9px]">
                        {daysUntilGraduation} {ar ? "يوم متبقي" : "days left"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Circular progress indicator */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6"
                    className={eligible ? "text-emerald-100" : "text-amber-100"} />
                  <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
                    stroke={eligible ? "#10b981" : "#f59e0b"}
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - overallProgress / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${eligible ? "text-emerald-700" : "text-amber-700"}`}>
                  {overallProgress}%
                </span>
              </div>
            </div>
            <Progress value={overallProgress} className={`h-2 mt-4 ${eligible ? "bg-emerald-500" : "bg-amber-500"}`} />
          </CardContent>
        </Card>

        {/* Key Dates */}
        {deadline && (
          <Card className={`border-${daysUntilDeadline && daysUntilDeadline < 30 ? "red" : "blue"}-200/50`}>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className={`h-5 w-5 shrink-0 ${daysUntilDeadline && daysUntilDeadline < 30 ? "text-red-500" : "text-blue-500"}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {ar ? "موعد تقديم طلب التخرج" : "Graduation Application Deadline"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deadline.toLocaleDateString(ar ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {daysUntilDeadline !== null && ` · ${daysUntilDeadline > 0 ? `${daysUntilDeadline} ${ar ? "يوم" : "days"}` : (ar ? "انتهى" : "Passed")}`}
                </p>
              </div>
              {daysUntilDeadline && daysUntilDeadline < 30 && daysUntilDeadline > 0 && (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Requirements Checklist */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-iscarb-gold" />
              {ar ? "متطلبات التخرج — تدقيق الشهادة" : "Requirements — Degree Audit"}
              <Badge variant="outline" className="text-[9px] ml-auto">{completed}/{total}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {requirements.map((req: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/20 transition-colors">
                <div className={`p-1 rounded-full mt-0.5 ${req.completed ? "text-emerald-500 bg-emerald-50" : "text-muted-foreground bg-muted/30"}`}>
                  {req.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${req.completed ? "" : "text-muted-foreground"}`}>{req.name}</p>
                    <Badge variant={req.completed ? "default" : "outline"} className={`text-[9px] shrink-0 ml-2 ${req.completed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}`}>
                      {req.completed ? (ar ? "مكتمل" : "Done") : `${req.progress || 0}/${req.total || 0}`}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{req.description}</p>
                  {!req.completed && (
                    <Progress value={(req.progress / req.total) * 100} className="h-1.5 mt-2 bg-amber-200" />
                  )}
                </div>
              </div>
            ))}
            {requirements.length === 0 && (
              <div className="p-8 text-center">
                <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">{ar ? "لا توجد متطلبات بعد" : "No requirements yet"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Readiness */}
        <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 cursor-pointer" onClick={() => setShowAiReadiness(!showAiReadiness)}>
              <Brain className="h-4 w-4 text-iscarb-cyan" /><Sparkles className="h-3 w-3 text-iscarb-gold" />
              {ar ? "تقييم جاهزية التخرج iSCARB AI" : "iSCARB AI Graduation Readiness"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {eligible
                ? (ar
                  ? "تهانينا! أنت مؤهل للتخرج. يرجى تقديم طلب التخرج قبل الموعد النهائي والتأكد من استكمال جميع المستندات المطلوبة."
                  : "Congratulations! You're eligible to graduate. Submit your graduation application before the deadline and ensure all required documents are ready.")
                : (ar
                  ? `أنت في ${overallProgress}% من متطلبات التخرج. ركز على إكمال ${total - completed} متطلب متبقي.`
                  : `You're at ${overallProgress}% of graduation requirements. Focus on completing ${total - completed} remaining requirements.`)}
            </p>
            {showAiReadiness && !eligible && (
              <div className="mt-4 space-y-2">
                {requirements.filter((r: any) => !r.completed).map((req: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-white/60 dark:bg-background/40 border border-border/40">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-iscarb-cyan" />
                      {req.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {ar
                        ? `المتبقي: ${(req.total || 0) - (req.progress || 0)} من ${req.total}`
                        : `Remaining: ${(req.total || 0) - (req.progress || 0)} of ${req.total}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
