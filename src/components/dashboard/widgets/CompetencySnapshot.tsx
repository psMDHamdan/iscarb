"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Loader2, Target, Award, Shield } from "lucide-react";
import type { CompetencySnapshotData } from "@/services/unified-dashboard.service";
import { DimensionRadar } from "@/components/iscarb/DimensionRadar";

interface Props {
  data: CompetencySnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function CompetencySnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></CardContent></Card>;
  if (!data) return null;

  const radarDimensions = data.radar.slice(0, 4).map((d, i) => ({
    name: ar && d.nameAr ? d.nameAr : d.name,
    score: d.score,
    icon: ["💻", "🧠", "👔", "🌟"][i] || "📊",
  }));

  const avgProgress = data.progress.length > 0
    ? Math.round(data.progress.reduce((s, p) => s + (p.current / Math.max(p.target, 1)) * 100, 0) / data.progress.length)
    : 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            {ar ? "لمحة الكفاءات" : "Competency Snapshot"}
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {data.growthTrend > 0 ? "↑" : data.growthTrend < 0 ? "↓" : "—"} {data.growthTrend}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Radar + Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-center">
            {radarDimensions.length > 0 ? (
              <DimensionRadar dimensions={radarDimensions} />
            ) : (
              <div className="text-center py-8">
                <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{ar ? "لا توجد بيانات" : "No data"}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="text-center p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/15 border border-blue-200/50">
              <Award className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xl font-bold text-blue-600">{avgProgress}%</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "متوسط الإتقان" : "Avg Mastery"}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[10px] font-semibold text-amber-600">{ar ? "فجوة المهارات" : "Skill Gap"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{data.skillGap}% {ar ? "فجوة" : "gap to target"}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-600">{ar ? "حالة جواز الكفاءات" : "Passport Status"}</span>
              </div>
              <p className="text-xs text-muted-foreground capitalize">{data.passportStatus}</p>
            </div>
          </div>
        </div>

        {/* Competency List */}
        {data.progress.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "تقدم الكفاءات" : "Competency Progress"}
            </p>
            {data.progress.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-background/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{c.current}/{c.target}</span>
                  <span className={`text-[10px] ${c.trend > 0 ? "text-emerald-600" : c.trend < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    {c.trend > 0 ? "↑" : c.trend < 0 ? "↓" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
