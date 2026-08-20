"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Target, TrendingUp, Star, Loader2, Users, Award } from "lucide-react";
import type { CareerSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: CareerSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function CareerSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-emerald-600" />
          {ar ? "لمحة مهنية" : "Career Snapshot"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <Metric label={ar ? "الجاهزية" : "Readiness"} value={`${data.readiness}%`} color="text-emerald-600" />
          <Metric label={ar ? "السيرة" : "Resume"} value={`${data.resumeScore}%`} color="text-blue-600" />
          <Metric label={ar ? "المقابلات" : "Interviews"} value={`${data.interviewReadiness}%`} color="text-purple-600" />
          <Metric label={ar ? "الطلبات" : "Apps"} value={`${data.applications}`} color="text-amber-600" />
        </div>

        {data.recommendedJobs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "الوظائف المقترحة" : "Recommended Jobs"}
            </p>
            {data.recommendedJobs.slice(0, 3).map((job, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-background/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{job.title}</p>
                  <p className="text-[10px] text-muted-foreground">{job.employer}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] bg-emerald-100 text-emerald-700">{job.matchScore}%</Badge>
              </div>
            ))}
          </div>
        )}

        {data.networkingSuggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "التواصل" : "Networking"}
            </p>
            {data.networkingSuggestions.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
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
