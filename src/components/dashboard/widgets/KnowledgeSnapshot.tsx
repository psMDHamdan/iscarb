"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Search, Bookmark, Library, Loader2, Lightbulb } from "lucide-react";
import type { KnowledgeSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: KnowledgeSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function KnowledgeSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center gap-2">
          <Network className="h-5 w-5 text-teal-600" />
          {ar ? "لمحة المعرفة" : "Knowledge Snapshot"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Metric label={ar ? "العقد المعرفية" : "Graph Nodes"} value={`${data.graphNodes}`} color="text-teal-600" />
          <Metric label={ar ? "المحفوظات" : "Saved"} value={`${data.savedKnowledge}`} color="text-blue-600" />
        </div>

        {data.recentSearches.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "آخر البحوث" : "Recent Searches"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.recentSearches.slice(0, 3).map((q, i) => (
                <Badge key={i} variant="secondary" className="text-[9px] bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300">
                  <Search className="h-2.5 w-2.5 mr-1" />{q}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {ar ? "توصيات المعرفة" : "Knowledge Recommendations"}
          </p>
          {data.recommendations.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3 text-teal-500 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
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
