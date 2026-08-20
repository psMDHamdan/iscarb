"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Trophy, Calendar, Loader2, TrendingUp } from "lucide-react";
import type { CommunitySnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: CommunitySnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function CommunitySnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-pink-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-pink-600" />
          {ar ? "لمحة المجتمع" : "Community Snapshot"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <Metric label={ar ? "المجموعات" : "Groups"} value={`${data.studyGroups}`} color="text-pink-600" />
          <Metric label={ar ? "الإرشاد" : "Mentors"} value={`${data.mentorship}`} color="text-blue-600" />
          <Metric label={ar ? "التحديات" : "Challenges"} value={`${data.challenges}`} color="text-amber-600" />
          <Metric label={ar ? "الترتيب" : "Rank"} value={`#${data.leaderboardRank}`} color="text-emerald-600" />
        </div>

        {data.feed.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "النشاطات" : "Activities"}
            </p>
            {data.feed.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <MessageCircle className="h-3 w-3 text-pink-500 shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">{item.content}</p>
                <span className="text-[9px] text-muted-foreground">{item.time}</span>
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
