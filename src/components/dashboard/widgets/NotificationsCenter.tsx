"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, MessageCircle, Calendar, AlertTriangle, Briefcase, BookOpen, Brain, ChevronRight } from "lucide-react";
import type { NotificationsCenterData, NotificationItem } from "@/services/unified-dashboard.service";

interface Props {
  data: NotificationsCenterData | null;
  loading: boolean;
  ar: boolean;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  announcement: Bell,
  task: Calendar,
  deadline: AlertTriangle,
  career: Briefcase,
  learning: BookOpen,
  research: Brain,
  community: MessageCircle,
  academic: BookOpen,
  ai_alert: Brain,
};

const typeColors: Record<string, string> = {
  announcement: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
  task: "text-orange-600 bg-orange-50 dark:bg-orange-950/20",
  deadline: "text-red-600 bg-red-50 dark:bg-red-950/20",
  career: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
  learning: "text-purple-600 bg-purple-50 dark:bg-purple-950/20",
  research: "text-violet-600 bg-violet-50 dark:bg-violet-950/20",
  community: "text-pink-600 bg-pink-50 dark:bg-pink-950/20",
  academic: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20",
  ai_alert: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
};

export function NotificationsCenter({ data, loading, ar }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-iscarb-gold" /></CardContent></Card>;

  if (!data || data.total === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-iscarb-gold" />
            {ar ? "مركز الإشعارات" : "Notifications Center"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="text-center py-6">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{ar ? "لا توجد إشعارات" : "No notifications"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allItems = [
    ...data.announcements.map(n => ({ ...n, category: "announcement" as const })),
    ...data.tasks.map(n => ({ ...n, category: "task" as const })),
    ...data.deadlines.map(n => ({ ...n, category: "deadline" as const })),
    ...data.career.map(n => ({ ...n, category: "career" as const })),
    ...data.learning.map(n => ({ ...n, category: "learning" as const })),
    ...data.academic.map(n => ({ ...n, category: "academic" as const })),
    ...data.aiAlerts.map(n => ({ ...n, category: "ai_alert" as const })),
  ].slice(0, showAll ? 20 : 6);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-iscarb-gold" />
            {ar ? "مركز الإشعارات" : "Notifications"}
          </div>
          <div className="flex items-center gap-2">
            {data.unread > 0 && (
              <Badge className="bg-iscarb-gold text-white text-[10px]">{data.unread} {ar ? "غير مقروء" : "new"}</Badge>
            )}
            <Badge variant="secondary" className="text-[9px]">{data.total} {ar ? "الإجمالي" : "total"}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-2">
        {allItems.map((item, i) => {
          const Icon = typeIcons[item.category] || Bell;
          const colorClass = typeColors[item.category] || "text-gray-600 bg-gray-50";
          
          return (
            <div key={`${item.id}-${i}`} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
              item.read ? "opacity-50" : "bg-accent/30"
            } hover:bg-accent/50`}>
              <div className={`p-1.5 rounded-lg ${colorClass}`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-1">{ar ? item.titleAr || item.title : item.title}</p>
                {item.body && <p className="text-[10px] text-muted-foreground line-clamp-1">{ar ? item.bodyAr || item.body : item.body}</p>}
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}

        {allItems.length < data.total && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAll(!showAll)}>
            {showAll ? (ar ? "عرض أقل" : "Show less") : ar ? `عرض الكل (${data.total})` : `View all (${data.total})`}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
