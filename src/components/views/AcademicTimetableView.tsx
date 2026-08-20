"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, AlertTriangle, Brain, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Sparkles, Sun, Moon } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = (ar: boolean) => [
  { key: "sun", label: ar ? "الأحد" : "Sunday" },
  { key: "mon", label: ar ? "الاثنين" : "Monday" },
  { key: "tue", label: ar ? "الثلاثاء" : "Tuesday" },
  { key: "wed", label: ar ? "الأربعاء" : "Wednesday" },
  { key: "thu", label: ar ? "الخميس" : "Thursday" },
  { key: "fri", label: ar ? "الجمعة" : "Friday" },
];

const TYPE_COLORS: Record<string, string> = {
  lecture: "border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/20",
  lab: "border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20",
  tutorial: "border-l-purple-500 bg-purple-50/60 dark:bg-purple-950/20",
  exam: "border-l-red-500 bg-red-50/60 dark:bg-red-950/20",
  office_hours: "border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20",
};

export function AcademicTimetableView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectedDay, setSelectedDay] = useState(0);
  const [week, setWeek] = useState(0);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "timetable", week],
    `/api/v1/student/academic/timetable?week=${week}`
  );

  const days = DAYS(ar);

  if (loading) {
    return (
      <><PageHeader title={ar ? "جدول المحاضرات" : "Timetable"} />
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-16 shrink-0 rounded-xl" />)}
          </div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 flex gap-4">
                <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <div className="flex gap-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-24" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "جدول المحاضرات" : "Timetable"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ في التحميل" : "Error Loading"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة محاولة" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const schedule = data.data.schedule || [[], [], [], [], [], []];
  const todaySessions = schedule[selectedDay] || [];
  const allSessions = schedule.flat();

  // Detect conflicts: overlapping sessions on same day
  const conflicts: { dayIdx: number; sessions: any[] }[] = [];
  schedule.forEach((daySessions: any[], dayIdx: number) => {
    for (let i = 0; i < daySessions.length; i++) {
      for (let j = i + 1; j < daySessions.length; j++) {
        const a = daySessions[i];
        const b = daySessions[j];
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          conflicts.push({ dayIdx, sessions: [a, b] });
          break;
        }
      }
    }
  });

  return (
    <>
      <PageHeader title={ar ? "جدول المحاضرات" : "Timetable"}
        description={ar ? "جدولك الأسبوعي مع كشف التضارب" : "Your weekly schedule with conflict detection"} />

      <div className="space-y-6 pb-12">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setWeek(w => w - 1)} disabled={week <= 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {week === 0 ? (ar ? "هذا الأسبوع" : "This Week") : `${ar ? "الأسبوع" : "Week"} ${week + 1}`}
            </span>
            <Button size="sm" variant="outline" onClick={() => setWeek(w => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {allSessions.length} {ar ? "جلسة" : "sessions"}
          </div>
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {ar ? "تضارب في المواعيد" : "Schedule Conflicts"}
                </p>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {days[c.dayIdx].label}: {c.sessions.map(s => s.courseName).join(" × ")}
                  </p>
                ))}
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">{conflicts.length}</Badge>
            </CardContent>
          </Card>
        )}

        {/* Day Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day, idx) => (
            <Button key={day.key} size="sm" variant={selectedDay === idx ? "default" : "outline"}
              onClick={() => setSelectedDay(idx)}
              className={`shrink-0 ${selectedDay === idx ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}`}>
              {day.label}
              {schedule[idx]?.length > 0 && (
                <span className="ml-1.5 text-[9px] opacity-70">({schedule[idx].length})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Today's Schedule */}
        {todaySessions.length > 0 ? (
          <div className="relative space-y-3">
            {/* Time indicator line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/60 hidden sm:block" />
            {todaySessions.map((session: any, idx: number) => (
              <div key={idx} className={`pl-0 sm:pl-8 relative border-l-4 rounded-lg p-4 ${TYPE_COLORS[session.type] || "border-l-gray-300 bg-gray-50/50"}`}>
                <div className="hidden sm:block absolute left-2 top-4 w-2 h-2 rounded-full bg-iscarb-cyan ring-2 ring-background" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <p className="font-semibold text-sm">{session.courseName}</p>
                      <Badge variant="outline" className="text-[9px] shrink-0">{session.type === "lecture" ? (ar ? "محاضرة" : "Lecture") : session.type === "lab" ? (ar ? "مختبر" : "Lab") : session.type === "tutorial" ? (ar ? "تمرين" : "Tutorial") : session.type}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.startTime} - {session.endTime}</span>
                      {session.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{session.location}</span>}
                      {session.instructor && <span className="flex items-center gap-1 hidden sm:flex">{session.instructor}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {session.attendanceRequired && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {ar ? "حضور إلزامي" : "Required"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-3 rounded-xl bg-muted/50 mb-3">
                {selectedDay === 5 ? <Moon className="h-6 w-6 text-muted-foreground" /> : <Sun className="h-6 w-6 text-muted-foreground" />}
              </div>
              <p className="font-semibold">{ar ? "لا توجد جلسات" : "No sessions"}</p>
              <p className="text-xs text-muted-foreground mt-1">{days[selectedDay].label}</p>
            </CardContent>
          </Card>
        )}

        {/* AI Schedule Tips */}
        <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-iscarb-cyan" />
              <Sparkles className="h-3 w-3 text-iscarb-gold" />
              {ar ? "نصائح iSCARB AI للجدول" : "iSCARB AI Schedule Tips"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySessions.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {ar
                  ? `لديك ${todaySessions.length} جلسات اليوم. خصص ٣٠ دقيقة بين كل جلسة لمراجعة الملاحظات.`
                  : `You have ${todaySessions.length} sessions today. Allocate 30 minutes between each for review.`}
              </p>
            )}
            {allSessions.length > 4 && (
              <p className="text-sm text-muted-foreground">
                {ar
                  ? `إجمالي ${allSessions.length} جلسة أسبوعياً — رصيد دراسي جيد.`
                  : `${allSessions.length} total weekly sessions — solid course load.`}
              </p>
            )}
            {conflicts.length > 0 && (
              <p className="text-sm text-muted-foreground text-amber-700 dark:text-amber-400">
                {ar ? "توجد تضاربات في الجدول. راجع المحاضر لتأكيد المواعيد." : "Schedule conflicts detected. Verify times with instructors."}
              </p>
            )}
            {allSessions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {ar ? "لم يتم تحميل الجدول بعد. تأكد من تسجيل المقررات." : "No timetable loaded yet. Ensure courses are registered."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
