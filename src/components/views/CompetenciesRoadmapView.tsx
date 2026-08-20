"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Calendar, CheckCircle2, Clock, Target, Milestone } from "lucide-react";

interface MilestoneItem {
  id: string;
  title: string;
  description: string | null;
  targetDate: string;
  completedDate: string | null;
  status: "completed" | "in_progress" | "upcoming";
  category: string;
  priority: string;
  progress: number;
}

interface RoadmapData {
  milestones: MilestoneItem[];
  grouped: Record<string, MilestoneItem[]>;
  stats: { total: number; completed: number; inProgress: number; progress: number };
  nextMilestone: MilestoneItem | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "border-green-300 bg-green-50 dark:bg-green-900/10",
  in_progress: "border-blue-300 bg-blue-50 dark:bg-blue-900/10",
  upcoming: "border-gray-200 bg-gray-50 dark:bg-gray-800/30",
};

const PRIORITY_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  critical: "destructive",
  high: "secondary",
  medium: "outline",
  low: "outline",
};

export function CompetenciesRoadmapView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "quarter">("list");

  useEffect(() => {
    fetch("/api/v1/student/competencies/roadmap")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "خارطة الطريق" : "Development Roadmap"}
          description={ar ? "خطتك الزمنية لتطوير الكفاءات" : "Your time-based competency development roadmap"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "خارطة الطريق" : "Development Roadmap"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "خارطة الطريق" : "Development Roadmap"}
        description={ar ? "تابع رحلتك الزمنية في تطوير الكفاءات والمهارات" : "Track your competency development journey over time"}
      />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: ar ? "التقدم الإجمالي" : "Overall Progress", value: `${data.stats.progress}%`, color: "text-iscarb-green" },
            { label: ar ? "المعالم الكلية" : "Total Milestones", value: data.stats.total, color: "" },
            { label: ar ? "مكتملة" : "Completed", value: data.stats.completed, color: "text-green-600" },
            { label: ar ? "قيد الإنجاز" : "In Progress", value: data.stats.inProgress, color: "text-blue-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall progress bar */}
        {data.stats.total > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{ar ? "التقدم الإجمالي" : "Overall Roadmap Progress"}</span>
                <span className="text-sm font-bold text-iscarb-green">{data.stats.progress}%</span>
              </div>
              <Progress value={data.stats.progress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {data.stats.completed} / {data.stats.total} {ar ? "معالم مكتملة" : "milestones completed"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next milestone highlight */}
        {data.nextMilestone && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                {ar ? "المعلم التالي" : "Next Milestone"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold">{data.nextMilestone.title}</h3>
              {data.nextMilestone.description && (
                <p className="text-sm text-muted-foreground mt-1">{data.nextMilestone.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(data.nextMilestone.targetDate).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                {data.nextMilestone.priority && (
                  <Badge variant={PRIORITY_BADGE[data.nextMilestone.priority] || "outline"} className="text-xs capitalize">
                    {data.nextMilestone.priority}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* View toggle */}
        {data.milestones.length > 0 && (
          <div className="flex gap-2">
            {(["list", "quarter"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === v ? "bg-iscarb-green text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {v === "list" ? (ar ? "قائمة" : "List") : (ar ? "ربع سنوي" : "By Quarter")}
              </button>
            ))}
          </div>
        )}

        {/* Milestones */}
        {view === "list" && data.milestones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Milestone className="h-4 w-4" />
                {ar ? "المعالم" : "Milestones"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.milestones.map((milestone) => (
                  <div key={milestone.id} className={`border rounded-lg p-4 ${STATUS_COLORS[milestone.status]}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          ) : milestone.status === "in_progress" ? (
                            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                          ) : (
                            <Target className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <h4 className="font-semibold text-sm">{milestone.title}</h4>
                        </div>
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">{milestone.description}</p>
                        )}
                      </div>
                      <Badge
                        variant={milestone.status === "completed" ? "default" : milestone.status === "in_progress" ? "secondary" : "outline"}
                        className="text-xs ml-2 shrink-0"
                      >
                        {milestone.status === "completed" ? (ar ? "مكتمل" : "Done") :
                          milestone.status === "in_progress" ? (ar ? "جارٍ" : "Active") :
                            (ar ? "قادم" : "Upcoming")}
                      </Badge>
                    </div>

                    <div className="ml-6">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{ar ? "التقدم" : "Progress"}</span>
                        <span className="font-semibold">{milestone.progress}%</span>
                      </div>
                      <Progress value={milestone.progress} className="h-1.5 mb-2" />

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{ar ? "الهدف" : "Target"}: {new Date(milestone.targetDate).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                        </div>
                        {milestone.completedDate && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{new Date(milestone.completedDate).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quarter view */}
        {view === "quarter" && Object.keys(data.grouped).length > 0 && (
          <div className="space-y-6">
            {Object.entries(data.grouped).map(([quarter, milestones]) => (
              <Card key={quarter}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-iscarb-blue" />
                    {quarter}
                    <Badge variant="outline" className="text-xs ml-auto">
                      {milestones.length} {ar ? "معالم" : "milestones"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.map((m) => (
                      <div key={m.id} className={`border rounded-lg p-3 ${STATUS_COLORS[m.status]}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{m.title}</h4>
                          <Badge
                            variant={m.status === "completed" ? "default" : m.status === "in_progress" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {m.progress}%
                          </Badge>
                        </div>
                        <Progress value={m.progress} className="h-1 mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.milestones.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Milestone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد معالم بعد" : "No milestones yet"}</h3>
              <p className="text-sm text-muted-foreground">
                {ar ? "ستظهر إنجازاتك كمعالم هنا" : "Your achievements will appear as milestones here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
