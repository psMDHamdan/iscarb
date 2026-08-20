"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, AlertTriangle, Brain, CheckCircle2, Copy, Download, Printer, Sparkles, Shield, TrendingUp } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function AcademicTranscriptView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [copied, setCopied] = useState(false);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "transcript"],
    "/api/v1/student/academic/transcript"
  );

  if (loading) {
    return (
      <><PageHeader title={ar ? "السجل الأكاديمي" : "Transcript"} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "السجل الأكاديمي" : "Transcript"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const t = data.data.transcript || {};
  const aiSummary = data.data.aiSummary || "";
  const courses = t.courses || [];
  const summary = t.summary || {};

  // Group courses by semester
  const semesters: Record<string, any[]> = {};
  courses.forEach((c: any) => {
    const sem = c.semester || "Unknown";
    if (!semesters[sem]) semesters[sem] = [];
    semesters[sem].push(c);
  });

  const gpaColor = (gpa: number) =>
    gpa >= 3.5 ? "text-emerald-600" : gpa >= 2.5 ? "text-amber-600" : "text-red-600";
  const gpaLabel = (gpa: number) =>
    gpa >= 3.5 ? (ar ? "ممتاز" : "Excellent") : gpa >= 2.5 ? (ar ? "جيد" : "Good") : (ar ? "تحتاج تحسين" : "Needs Work");

  return (
    <>
      <PageHeader title={ar ? "السجل الأكاديمي الرسمي" : "Official Transcript"}
        description={ar ? `السجل الرسمي — ${courses.length} مقرر` : `Official record — ${courses.length} courses`} />

      <div className="space-y-6 pb-12">
        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />{ar ? "PDF" : "Download PDF"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="h-4 w-4" />{ar ? "طباعة" : "Print"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            navigator.clipboard.writeText(`Student: ${t.studentName}\nProgram: ${t.program}\nCGPA: ${summary.gpa?.toFixed(2)}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}>
            <Copy className="h-4 w-4" />{copied ? (ar ? "تم!" : "Copied!") : (ar ? "نسخ" : "Copy")}
          </Button>
        </div>

        {/* Main Transcript Card */}
        <Card className="border-2 border-iscarb-green/30 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-iscarb-green/5 to-transparent pb-4">
            <CardTitle className="text-center text-lg font-bold">{ar ? "السجل الأكاديمي الرسمي" : "Official Academic Transcript"}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Student Info */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ar ? "الاسم" : "Name"}</p>
                <p className="font-semibold text-sm mt-0.5">{t.studentName}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ar ? "البرنامج" : "Program"}</p>
                <p className="font-semibold text-sm mt-0.5">{t.program}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ar ? "الجامعة" : "University"}</p>
                <p className="font-semibold text-sm mt-0.5">{t.university}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ar ? "تاريخ الإصدار" : "Issued"}</p>
                <p className="font-semibold text-sm mt-0.5">{new Date(t.issuedDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Courses by Semester */}
            <div className="border-t pt-6 space-y-6">
              {Object.entries(semesters).map(([sem, semCourses]) => {
                const semGpa = semCourses.length > 0
                  ? (semCourses.reduce((s: number, c: any) => s + (c.gpa || 0), 0) / semCourses.length).toFixed(2)
                  : "—";
                return (
                  <div key={sem}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Badge variant="outline" className="bg-iscarb-cyan/10 text-iscarb-cyan border-iscarb-cyan/20">{sem}</Badge>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {ar ? "معدل الفصل" : "Sem GPA"}: <span className="font-semibold text-iscarb-cyan">{semGpa}</span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {semCourses.map((course: any, idx: number) => {
                        const gradeColor = course.grade === "A" ? "text-emerald-600 bg-emerald-50" :
                          course.grade === "B" ? "text-blue-600 bg-blue-50" :
                          course.grade === "C" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{course.name}</p>
                              <p className="text-[10px] text-muted-foreground">{course.code} · {course.credits} {ar ? "وحدة" : "cr"}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">{course.gpa?.toFixed(1)}</span>
                              <Badge className={`border text-xs font-bold ${gradeColor}`}>{course.grade}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="border-t pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 border border-blue-200/50 text-center">
                  <p className="text-[10px] text-muted-foreground">{ar ? "الوحدات" : "Credits"}</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalCredits || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 border border-emerald-200/50 text-center">
                  <p className="text-[10px] text-muted-foreground">{ar ? "المعدل" : "GPA"}</p>
                  <p className={`text-2xl font-bold ${gpaColor(summary.gpa || 0)}`}>{(summary.gpa || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 border border-purple-200/50 text-center">
                  <p className="text-[10px] text-muted-foreground">{ar ? "الوضع" : "Status"}</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.status || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 border border-amber-200/50 text-center">
                  <p className="text-[10px] text-muted-foreground">{ar ? "التقييم" : "Rating"}</p>
                  <Badge className="text-xs mt-1">{gpaLabel(summary.gpa || 0)}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Summary */}
        {aiSummary && (
          <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-iscarb-cyan" /><Sparkles className="h-3 w-3 text-iscarb-gold" />
                {ar ? "ملخص iSCARB AI" : "iSCARB AI Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Verification Badge */}
        <Card className="border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {ar ? "سجل معتمد رقمياً" : "Digitally Verified Transcript"}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                {ar ? "يمكن التحقق من صحة هذا السجل عبر رمز QR فريد." : "This transcript can be verified via a unique QR code."}
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[9px] shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />{ar ? "موثق" : "Verified"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
