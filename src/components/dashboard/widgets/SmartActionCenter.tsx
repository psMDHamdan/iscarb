"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, AlertTriangle, Target, Bell, Briefcase, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import type { ActionCenterData, ActionItem } from "@/services/unified-dashboard.service";

interface Props {
  data: ActionCenterData | null;
  loading: boolean;
  ar: boolean;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  academic: BookOpen,
  task: Target,
  career: Briefcase,
  general: Bell,
};

const urgencyStyles: Record<string, { border: string; bg: string; icon: string }> = {
  critical: { border: "border-red-300", bg: "bg-red-50/50 dark:bg-red-950/15", icon: "text-red-600" },
  high: { border: "border-orange-300", bg: "bg-orange-50/50 dark:bg-orange-950/15", icon: "text-orange-600" },
  medium: { border: "border-yellow-300", bg: "bg-yellow-50/50 dark:bg-yellow-950/15", icon: "text-yellow-600" },
  low: { border: "border-green-300", bg: "bg-green-50/50 dark:bg-green-950/15", icon: "text-green-600" },
};

export function SmartActionCenter({ data, loading, ar }: Props) {
  if (loading) {
    return (
      <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-iscarb-gold" /></CardContent></Card>
    );
  }

  const summaryItems = data ? [
    { label: ar ? "واجبات" : "Assignments", value: data.assignmentsDue, color: "text-blue-600" },
    { label: ar ? "امتحانات" : "Exams", value: data.examsSoon, color: "text-red-600" },
    { label: ar ? "إعلانات" : "Announcements", value: data.unreadAnnouncements, color: "text-orange-600" },
    { label: ar ? "مهام" : "Tasks", value: data.pendingTasks, color: "text-purple-600" },
    { label: ar ? "مقابلات" : "Interviews", value: data.interviewSchedule, color: "text-emerald-600" },
    { label: ar ? "الحضور" : "Attendance", value: data.missedAttendance, color: "text-amber-600" },
  ] : [];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-iscarb-gold" />
            {ar ? "مركز الإجراءات الذكي" : "Smart Action Center"}
          </div>
          {data && data.items.length > 0 && (
            <Badge variant="secondary" className="bg-iscarb-gold/10 text-iscarb-gold-dark">
              {data.items.length} {ar ? "إجراء" : "actions"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Summary grid */}
        {data && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {summaryItems.map((item, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[9px] text-muted-foreground truncate">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action items */}
        {(data?.items.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {data!.items.slice(0, 5).map((item) => {
              const UrgencyIcon = item.urgency === "critical" ? AlertTriangle : Clock;
              const ItemIcon = typeIcons[item.type] || Bell;
              const styles = urgencyStyles[item.urgency] || urgencyStyles.medium;
              
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${styles.border} ${styles.bg}`}>
                  <ItemIcon className={`h-4 w-4 shrink-0 ${styles.icon}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 text-xs" onClick={() => window.location.href = item.actionUrl}>
                    {item.actionLabel} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {ar ? "لا توجد إجراءات معلقة" : "No pending actions"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {ar ? "كل شيء على ما يرام!" : "All caught up!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
