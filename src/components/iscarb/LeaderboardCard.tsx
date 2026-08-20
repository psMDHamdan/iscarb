"use client";

import { useState } from "react";
import { Trophy, Crown } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

type Win = "week" | "semester" | "all";

interface LeaderboardRow {
  rank: number;
  studentId: string;
  name: string;
  program: string;
  cohort: string;
  equityScore: number;
  windowPoints?: number;
  level: { code: string; nameEn: string; nameAr: string };
}
interface LeaderboardResponse {
  leaderboard: LeaderboardRow[];
  total: number;
  window: Win;
}

const RANK_STYLE: Record<number, string> = {
  1: "bg-iscarb-gold text-white",
  2: "bg-slate-300 text-slate-700",
  3: "bg-amber-700/70 text-white",
};

const TABS: { key: Win; en: string; ar: string }[] = [
  { key: "week", en: "This week", ar: "هذا الأسبوع" },
  { key: "semester", en: "This semester", ar: "هذا الفصل" },
  { key: "all", en: "All time", ar: "كل الوقت" },
];

/**
 * Gamification leaderboard (P2-7): rotating windows — "this week" / "this
 * semester" / "all time". All-time ranks by Equity Score; the windowed tabs
 * rank by points EARNED in the window, so a fast-rising student can top the
 * week even when a veteran leads all-time. Highlights the selected student.
 */
export function LeaderboardCard() {
  const { ar } = useI18n();
  const selectedStudentId = useApp((s) => s.selectedStudentId);
  const [win, setWin] = useState<Win>("week");
  const { data } = useApiQuery<LeaderboardResponse>(
    ["leaderboard", win],
    `/api/iscarb/gamification/leaderboard?limit=10&window=${win}`,
  );

  const rows = data?.leaderboard ?? [];

  return (
    <Card className="border-iscarb-cyan/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4 text-iscarb-gold-dark" />
          {L(ar, "Leaderboard", "لوحة الصدارة")}
        </CardTitle>
        <div className="mt-2 flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setWin(t.key)}
              className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${win === t.key ? "bg-card text-iscarb-ink shadow-sm dark:text-white" : "text-muted-foreground"}`}
            >
              {ar ? t.ar : t.en}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {L(ar, "No ranking yet for this window.", "لا يوجد ترتيب لهذه الفترة بعد.")}
          </p>
        ) : (
          rows.map((r) => {
            const isSel = r.studentId === selectedStudentId;
            const metric = win === "all" ? r.equityScore : r.windowPoints ?? 0;
            return (
              <div
                key={r.studentId}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${isSel ? "border-iscarb-green/40 bg-iscarb-green-soft/40" : "border-border/50"}`}
              >
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${RANK_STYLE[r.rank] ?? "bg-muted text-muted-foreground"}`}>
                  {r.rank <= 3 ? <Crown className="size-3" /> : r.rank}
                </span>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-iscarb-cyan-soft text-[10px] font-bold text-iscarb-cyan">
                    {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-iscarb-ink dark:text-white">{r.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{ar ? r.level.nameAr : r.level.nameEn}</div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[11px]">
                  {win === "all" ? metric : `+${metric}`}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default LeaderboardCard;
