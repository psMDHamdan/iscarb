"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Star, Award, Loader2, CheckCircle, Globe } from "lucide-react";
import type { PortfolioSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: PortfolioSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function PortfolioSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-indigo-600" />
            {ar ? "لمحة المحفظة" : "Portfolio Snapshot"}
          </div>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30">
            {data.completeness}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <Metric label={ar ? "المهارات" : "Skills"} value={`${data.skills}`} color="text-indigo-600" />
          <Metric label={ar ? "الشارات" : "Badges"} value={`${data.badges}`} color="text-amber-600" />
          <Metric label={ar ? "الأدلة" : "Evidence"} value={`${data.evidence}`} color="text-emerald-600" />
          <Metric label={ar ? "عام" : "Public"} value={data.publicProfile ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} color={data.publicProfile ? "text-emerald-600" : "text-muted-foreground"} />
        </div>

        {data.latestProjects.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "آخر المشاريع" : "Latest Projects"}
            </p>
            {data.latestProjects.slice(0, 2).map((p, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-background/50">
                <Star className="h-3 w-3 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.latestAchievements.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "آخر الإنجازات" : "Achievements"}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.latestAchievements.slice(0, 3).map((a, i) => (
                <Badge key={i} variant="outline" className="text-[9px] border-amber-200 text-amber-700 bg-amber-50">
                  <Award className="h-2.5 w-2.5 mr-1" />{a.title}
                </Badge>
              ))}
            </div>
          </div>
        )}
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
