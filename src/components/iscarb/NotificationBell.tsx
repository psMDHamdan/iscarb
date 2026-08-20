"use client";

import { Bell, Check, CheckCheck, Briefcase } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface NotificationRow {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string | null;
  bodyAr: string | null;
  readAt: string | null;
  createdAt: string;
}
interface NotificationsResponse {
  notifications: NotificationRow[];
  unreadCount: number;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  career: Briefcase,
};

/**
 * Job Alert / Notification bell (P2 fix): the `Notification` model existed
 * with zero writers and zero UI. The Saudi Job Match engine now writes a
 * `type: "career"` row when a strong (80%+) new match appears; this is the
 * one place a student sees it. Built to read ANY notification type, so
 * future writers (deadline reminders, mentorship confirmations…) need no UI
 * change.
 */
export function NotificationBell() {
  const { ar } = useI18n();
  const selectedStudentId = useApp((s) => s.selectedStudentId);
  const { data } = useApiQuery<NotificationsResponse>(
    ["notifications", selectedStudentId ?? ""],
    `/api/iscarb/notifications?studentId=${selectedStudentId}`,
    { enabled: !!selectedStudentId },
  );

  const markOne = useApiMutation<{ ok: boolean }, { studentId: string; id: string }>("/api/iscarb/notifications", {
    method: "PATCH",
    invalidateKeys: (vars) => [["notifications", vars.studentId]],
  });
  const markAll = useApiMutation<{ ok: boolean }, { studentId: string; all: true }>("/api/iscarb/notifications", {
    method: "PATCH",
    invalidateKeys: (vars) => [["notifications", vars.studentId]],
  });

  if (!selectedStudentId) return null;
  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
          aria-label={L(ar, "Notifications", "الإشعارات")}
          title={L(ar, "Notifications", "الإشعارات")}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-iscarb-gold text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">{L(ar, "Notifications", "الإشعارات")}</span>
          {unread > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 text-[11px]"
              onClick={() => markAll.mutate({ studentId: selectedStudentId, all: true })}
              disabled={markAll.isPending}
            >
              <CheckCheck className="size-3" />{L(ar, "Mark all read", "تحديد الكل كمقروء")}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">{L(ar, "No notifications yet.", "لا إشعارات بعد.")}</p>
          ) : (
            items.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <div key={n.id} className={`flex items-start gap-2 border-b border-border/40 px-3 py-2.5 last:border-0 ${!n.readAt ? "bg-iscarb-cyan-soft/20" : ""}`}>
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-iscarb-cyan-dark" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug" dir="auto">{ar ? n.titleAr : n.titleEn}</p>
                    {(ar ? n.bodyAr : n.bodyEn) && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground" dir="auto">{ar ? n.bodyAr : n.bodyEn}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</p>
                  </div>
                  {!n.readAt && (
                    <button
                      onClick={() => markOne.mutate({ studentId: selectedStudentId, id: n.id })}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={L(ar, "Mark as read", "وضع علامة كمقروء")}
                    >
                      <Check className="size-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
