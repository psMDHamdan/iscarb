"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, FileText, Lightbulb, Loader2, FlaskConical, ListChecks } from "lucide-react";
import type { ResearchSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: ResearchSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function ResearchSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center gap-2">
          <Beaker className="h-5 w-5 text-violet-600" />
          {ar ? "لمحة البحث" : "Research Snapshot"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <Metric label={ar ? "التقدم" : "Progress"} value={`${data.progress}%`} color="text-violet-600" />
          <Metric label={ar ? "الأفكار" : "Ideas"} value={`${data.ideas}`} color="text-blue-600" />
          <Metric label={ar ? "المشاريع" : "Projects"} value={`${data.papers}`} color="text-emerald-600" />
          <Metric label={ar ? "الابتكار" : "Innovation"} value={`${data.innovation}`} color="text-amber-600" />
        </div>

        {data.tasks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "المهام البحثية" : "Research Tasks"}
            </p>
            {data.tasks.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-background/50">
                <ListChecks className="h-3 w-3 text-violet-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!data.tasks.length && data.progress === 0 && (
          <div className="text-center py-4">
            <FlaskConical className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {ar ? "ابدأ رحلتك البحثية" : "Start your research journey"}
            </p>
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
