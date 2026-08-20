"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, AlertTriangle, Brain, CheckCircle2, Clock, Sparkles, TrendingDown, TrendingUp, Users, Shield } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function AcademicAttendanceView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showAiPlan, setShowAiPlan] = useState(false);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "attendance"],
    "/api/v1/student/academic/attendance"
  );

  if (loading) {
    return (
      <><PageHeader title={ar ? "الحضور" : "Attendance"} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "الحضور" : "Attendance"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const courses = data.data.courses || [];
  const overallRate = courses.length > 0
    ? Math.round(courses.reduce((s: number, c: any) => s + (c.attendancePercentage || 0), 0) / courses.length)
    : 0;
  const atRisk = courses.filter((c: any) => (c.attendancePercentage || 0) < 75);
  const good = courses.filter((c: any) => (c.attendancePercentage || 0) >= 85);

  const getPercentColor = (pct: number) =>
    pct >= 85 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-red-600";
  const getBgColor = (pct: number) =>
    pct >= 85 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";
  const getBadge = (pct: number) =>
    pct >= 85 ? (ar ? "ممتاز" : "Excellent") : pct >= 75 ? (ar ? "جيد" : "Good") : (ar ? "مخاطرة" : "At Risk");

  return (
    <>
      <PageHeader title={ar ? "سجل الحضور" : "Attendance Records"}
        description={ar ? `${courses.length} مقرر — ${
          atRisk.length > 0 ? `${atRisk.length} يحتاج تحسين` : "جميع المقرارت بمعدل جيد"
        }` : `${courses.length} courses — ${
          atRisk.length > 0 ? `${atRisk.length} need improvement` : "all courses healthy"
        }`} />

      <div className="space-y-6 pb-12">
        {/* Overall Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 w-fit mx-auto mb-2">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <p className={`text-2xl font-bold ${getPercentColor(overallRate)}`}>{overallRate}%</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "المعدل العام" : "Overall Rate"}</p>
              <Progress value={overallRate} className={`h-1 mt-2 ${getBgColor(overallRate)}`} />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 w-fit mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{good.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "ممتاز" : "Excellent"}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{ar ? "مقرر ≥٨٥٪" : "Course ≥85%"}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 w-fit mx-auto mb-2">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{courses.filter((c: any) => (c.attendancePercentage || 0) >= 75 && (c.attendancePercentage || 0) < 85).length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "بحاجة تحسين" : "Needs Work"}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{ar ? "٧٥-٨٤٪" : "75-84%"}</p>
            </CardContent>
          </Card>
          <Card className={`hover:shadow-md transition-shadow border ${atRisk.length > 0 ? "border-red-200" : ""}`}>
            <CardContent className="p-4 text-center">
              <div className={`p-2 rounded-xl w-fit mx-auto mb-2 ${atRisk.length > 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/50"}`}>
                <AlertTriangle className={`h-5 w-5 ${atRisk.length > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              </div>
              <p className={`text-2xl font-bold ${atRisk.length > 0 ? "text-red-600" : ""}`}>{atRisk.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مخاطرة" : "At Risk"}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{ar ? "<٧٥٪" : "<75%"}</p>
            </CardContent>
          </Card>
        </div>

        {/* At Risk Alert */}
        {atRisk.length > 0 && (
          <Card className="border-red-200 bg-red-50/60 dark:bg-red-950/10">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  {ar ? "تنبيه: مقررات تحتاج متابعة" : "Alert: Courses Need Attention"}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                  {ar
                    ? `لديك ${atRisk.length} مقرر بمعدل حضور أقل من ٧٥٪. يرجى التواصل مع المحاضر.`
                    : `You have ${atRisk.length} course(s) with attendance below 75%. Please contact the instructor.`}
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-red-200 text-red-700 shrink-0"
                onClick={() => setShowAiPlan(!showAiPlan)}>
                <Brain className="h-3 w-3 mr-1" />{ar ? "خطة تحسين" : "AI Plan"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Improvement Plan */}
        {showAiPlan && (
          <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-iscarb-cyan" /><Sparkles className="h-3 w-3 text-iscarb-gold" />
                {ar ? "خطة تحسين الحضور" : "Attendance Improvement Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {atRisk.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-white/60 dark:bg-background/40 border border-border/40">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <ul className="mt-1.5 space-y-1">
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {ar
                        ? `حضور ${Math.min(3, Math.ceil((75 - (c.attendancePercentage || 0)) / 5))} جلسة إضافية هذا الأسبوع`
                        : `Attend ${Math.min(3, Math.ceil((75 - (c.attendancePercentage || 0)) / 5))} extra sessions this week`}
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {ar ? "تواصل مع المحاضر لمعرفة البدائل" : "Contact instructor for make-up options"}
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {ar ? "حدد تنبيهاً قبل كل محاضرة" : "Set a reminder before each class"}
                    </li>
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Course Breakdown */}
        <div className="space-y-3">
          {courses.map((course: any, idx: number) => {
            const pct = course.attendancePercentage || 0;
            const isExpanded = expandedCourse === course.name;
            return (
              <Card key={idx} className={`hover:shadow-md transition-all cursor-pointer ${pct < 75 ? "border-red-200" : ""}`}
                onClick={() => setExpandedCourse(isExpanded ? null : course.name)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{course.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{course.presentDays}</span>
                        <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-500" />{course.absentDays}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" />{course.excusedDays || 0}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-xl font-bold ${getPercentColor(pct)}`}>{pct}%</p>
                      <Badge variant="outline" className={`text-[9px] mt-0.5 ${
                        pct >= 85 ? "border-emerald-200 text-emerald-700" : pct >= 75 ? "border-amber-200 text-amber-700" : "border-red-200 text-red-700"
                      }`}>{getBadge(pct)}</Badge>
                    </div>
                  </div>
                  <Progress value={pct} className={`h-2 mt-3 ${getBgColor(pct)}`} />
                </CardContent>
              </Card>
            );
          })}
          {courses.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">{ar ? "لا توجد بيانات حضور" : "No attendance data"}</p>
                <p className="text-xs text-muted-foreground mt-1">{ar ? "سجل في المقررات لعرض الحضور" : "Enroll in courses to track attendance"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
