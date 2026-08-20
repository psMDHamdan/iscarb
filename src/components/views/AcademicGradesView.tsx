"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, AlertTriangle, Brain, ChevronDown, ChevronUp, GraduationCap, Sparkles, Star, TrendingUp, BarChart3, Target } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

const GRADE_COLORS: Record<string, string> = {
  "A": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200",
  "B+": "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200",
  "B": "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200",
  "C+": "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200",
  "C": "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200",
  "D": "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200",
  "F": "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200",
};

const GRADE_ORDER = ["A", "B+", "B", "C+", "C", "D", "F"];

export function AcademicGradesView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "grades"],
    "/api/v1/student/academic/grades"
  );

  if (loading) {
    return (
      <><PageHeader title={ar ? "الدرجات" : "Grades"} />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "الدرجات" : "Grades"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const d = data.data;
  const grades = d.grades || [];
  const semGpa = parseFloat(d.semesterGpa || "0");
  const cumGpa = parseFloat(d.cumulativeGpa || "0");
  const semestersCount = d.semestersCompleted || 0;

  // Grade distribution
  const distribution: Record<string, number> = {};
  grades.forEach((g: any) => {
    const lg = g.letterGrade || "";
    distribution[lg] = (distribution[lg] || 0) + 1;
  });

  // Weak subjects (grade C+ or below)
  const weak = grades.filter((g: any) => {
    const lg = g.letterGrade || "";
    return ["C+", "C", "D", "F"].includes(lg);
  });

  const gpaStatusColor = (gpa: number) =>
    gpa >= 3.5 ? "text-emerald-600" : gpa >= 2.5 ? "text-amber-600" : "text-red-600";
  const gpaLabel = (gpa: number) =>
    gpa >= 3.5 ? (ar ? "ممتاز" : "Excellent") : gpa >= 2.5 ? (ar ? "جيد" : "Good") : (ar ? "تحتاج تحسين" : "Needs Work");

  return (
    <>
      <PageHeader title={ar ? "سجل الدرجات" : "Grade Records"}
        description={ar ? `${grades.length} مقرر — المعدل التراكمي ${cumGpa.toFixed(2)}` : `${grades.length} courses — CGPA ${cumGpa.toFixed(2)}`} />

      <div className="space-y-6 pb-12">
        {/* GPA Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/10 border-emerald-200/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className={`text-2xl font-bold ${gpaStatusColor(semGpa)}`}>{semGpa.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "معدل الفصل" : "Semester GPA"}</p>
              <Badge variant="outline" className="text-[9px] mt-1 border-emerald-200 text-emerald-700">{gpaLabel(semGpa)}</Badge>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">{cumGpa.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "المعدل التراكمي" : "CGPA"}</p>
              <Progress value={(cumGpa / 4) * 100} className="h-1 mt-2 bg-purple-200" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{grades.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "المقررات" : "Courses"}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{semestersCount} {ar ? "فصل" : "semesters"}</p>
            </CardContent>
          </Card>
          <Card className={`hover:shadow-md transition-shadow ${weak.length > 0 ? "border-amber-200" : ""}`}>
            <CardContent className="p-4 text-center">
              <Target className={`h-5 w-5 mx-auto mb-1 ${weak.length > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
              <p className={`text-2xl font-bold ${weak.length > 0 ? "text-amber-600" : ""}`}>{weak.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "تحتاج تحسين" : "Needs Work"}</p>
              {weak.length > 0 && (
                <Button size="sm" variant="ghost" className="text-[9px] h-auto py-0.5 mt-1 text-amber-600"
                  onClick={() => setShowAnalysis(!showAnalysis)}>
                  <Brain className="h-3 w-3 mr-1" />{ar ? "تحليل" : "Analyze"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grade Distribution */}
        {grades.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-iscarb-cyan" />{ar ? "توزيع الدرجات" : "Grade Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-end gap-2 h-32">
                {GRADE_ORDER.map(letter => {
                  const count = distribution[letter] || 0;
                  const maxCount = Math.max(...Object.values(distribution), 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={letter} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-mono text-muted-foreground">{count}</span>
                      <div className="w-full rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(height, count > 0 ? 8 : 0)}%`, backgroundColor: GRADE_ORDER.indexOf(letter) <= 1 ? "#10b981" : GRADE_ORDER.indexOf(letter) <= 3 ? "#f59e0b" : "#ef4444" }} />
                      <span className={`text-[10px] font-bold ${GRADE_COLORS[letter]?.split(" ")[0] || ""}`}>{letter}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weak Subject Analysis */}
        {showAnalysis && weak.length > 0 && (
          <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-iscarb-cyan" /><Sparkles className="h-3 w-3 text-iscarb-gold" />
                {ar ? "تحليل iSCARB AI للمواد الضعيفة" : "iSCARB AI Weak Subject Analysis"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {ar
                  ? `حددنا ${weak.length} مقرر تحتاج تحسين. إليك خطة مقترحة:`
                  : `We identified ${weak.length} course(s) needing improvement. Here's a plan:`}
              </p>
              {weak.map((g: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-white/60 dark:bg-background/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{g.courseName}</p>
                    <Badge variant="outline" className="text-red-600 border-red-200">{g.letterGrade}</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">▸</span>
                      {ar ? "خصص ساعتين إضافية أسبوعياً لهذا المقرر" : "Dedicate 2 extra hours weekly to this subject"}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">▸</span>
                      {ar ? "راجع المصادر الإضافية المتاحة على المنصة" : "Review supplementary materials on the platform"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Performance Forecast */}
        <Card className="border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />{ar ? "توقعات الأداء" : "Performance Forecast"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {ar
                ? `بناءً على أدائك الحالي (${cumGpa.toFixed(2)})، من المتوقع أن يصل معدلك التراكمي إلى ${(cumGpa + 0.15).toFixed(2)} مع تحسين درجات ${weak.length > 0 ? `${weak.length} مقرر` : "المقررات الحالية"}.`
                : `Based on your current performance (${cumGpa.toFixed(2)}), your projected CGPA is ${(cumGpa + 0.15).toFixed(2)} by improving ${weak.length > 0 ? `${weak.length} course(s)` : "current courses"}.`}
            </p>
          </CardContent>
        </Card>

        {/* Grade List */}
        <div className="space-y-2">
          {grades.map((grade: any, idx: number) => {
            const colorClass = GRADE_COLORS[grade.letterGrade] || "bg-gray-50 border-gray-200";
            return (
              <Card key={idx} className="hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{grade.courseName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{grade.courseCode} · {grade.semester} · {grade.credits} {ar ? "وحدات" : "cr"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold">{grade.points}</p>
                      <p className="text-[9px] text-muted-foreground">{ar ? "درجة" : "pts"}</p>
                    </div>
                    <Badge className={`${colorClass} border text-sm font-bold px-3 py-1`}>{grade.letterGrade}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {grades.length === 0 && (
            <Card><CardContent className="p-12 text-center">
              <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">{ar ? "لا توجد درجات بعد" : "No grades yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "تظهر الدرجات بعد تقييم المقررات" : "Grades appear after course assessment"}</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </>
  );
}
