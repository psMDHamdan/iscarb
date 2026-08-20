"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, TrendingUp, AlertCircle, Loader2, Target } from "lucide-react";
import type { AcademicSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: AcademicSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function AcademicSnapshot({ data, loading, ar }: Props) {
  if (loading) {
    return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-iscarb-cyan" /></CardContent></Card>;
  }

  if (!data) return null;

  const healthColor = data.academicHealthScore >= 70 ? "text-emerald-600" : data.academicHealthScore >= 40 ? "text-amber-600" : "text-red-600";
  const healthBg = data.academicHealthScore >= 70 ? "bg-emerald-100 dark:bg-emerald-900/30" : data.academicHealthScore >= 40 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-iscarb-cyan" />
            {ar ? "لمحة أكاديمية" : "Academic Snapshot"}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${healthBg}`}>
            <span className={`text-xs font-bold ${healthColor}`}>{data.academicHealthScore}</span>
            <span className={`text-[9px] ${healthColor}`}>{ar ? "صحة" : "Health"}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricBox icon={GraduationCap} label={ar ? "المعدل" : "GPA"} value={data.gpa.toFixed(2)} sub={ar ? "من 4.0" : "/4.0"} color="text-iscarb-cyan" />
          <MetricBox icon={BookOpen} label={ar ? "الساعات" : "Credits"} value={`${data.creditsEarned}`} sub={ar ? `من ${data.creditsEnrolled}` : `of ${data.creditsEnrolled}`} color="text-blue-600" />
          <MetricBox icon={Target} label={ar ? "الحضور" : "Attendance"} value={`${data.attendanceRate}%`} sub="" color={data.attendanceRate >= 80 ? "text-emerald-600" : "text-amber-600"} />
          <MetricBox icon={TrendingUp} label={ar ? "التخرج" : "Graduation"} value={`${data.graduationProgress}%`} sub="" color="text-purple-600" />
        </div>

        {/* Degree Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{ar ? "التقدم في الدرجة" : "Degree Progress"}</span>
            <span className="font-bold">{data.degreeProgress}%</span>
          </div>
          <Progress value={data.degreeProgress} className="h-2" indicatorClassName="bg-gradient-to-r from-iscarb-cyan to-blue-600" />
        </div>

        {/* Course Performance */}
        {data.coursePerformance.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "أداء المساقات" : "Course Performance"}
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {data.coursePerformance.slice(0, 5).map((c) => {
                const gradeColor = c.grade !== null ? (c.grade >= 3 ? "text-emerald-600" : c.grade >= 2 ? "text-amber-600" : "text-red-600") : "text-muted-foreground";
                return (
                  <div key={c.courseId} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-background/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.title}</p>
                    </div>
                    <span className={`text-xs font-bold ${gradeColor}`}>
                      {c.grade !== null ? c.grade.toFixed(1) : ar ? "قيد الدراسة" : "In progress"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}
