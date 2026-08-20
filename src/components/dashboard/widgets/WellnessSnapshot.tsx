"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Moon, Brain, Activity, Loader2, AlertTriangle, Smile } from "lucide-react";
import type { WellnessSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: WellnessSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function WellnessSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-rose-600" /></CardContent></Card>;
  if (!data) return null;

  const riskColor = data.burnoutRisk === "low" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" 
    : data.burnoutRisk === "medium" ? "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200"
    : "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            {ar ? "لمحة العافية" : "Wellness Snapshot"}
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${riskColor}`}>
            <AlertTriangle className="h-2.5 w-2.5" />
            {ar ? (data.burnoutRisk === "low" ? "منخفض" : data.burnoutRisk === "medium" ? "متوسط" : "مرتفع") : data.burnoutRisk} burnout
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Metric label={ar ? "التركيز" : "Focus"} value={`${data.focusTime}h`} color="text-rose-600" />
          <Metric label={ar ? "العادات" : "Habits"} value={`${data.habits}`} color="text-blue-600" />
          <Metric label={ar ? "التوازن" : "Balance"} value={`${data.studyLifeBalance}%`} color="text-emerald-600" />
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-br from-rose-50/50 to-orange-50/50 dark:from-rose-950/10 dark:to-orange-950/10 border border-rose-200/50">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-3.5 w-3.5 text-rose-600" />
            <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
              {ar ? "نصيحة العافية" : "Wellness Tip"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.aiWellnessTip}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground truncate">{label}</p>
    </div>
  );
}
