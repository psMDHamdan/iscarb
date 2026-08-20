"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Check, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  read: boolean;
  createdAt: string;
  type: string;
}

export function NotificationCenter() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);

  const { data, refetch } = useApiQuery<{ notifications: Notification[] }>(
    ["notifications"],
    "/api/iscarb/notifications",
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center justify-between">
            <span>{ar ? "الإشعارات" : "Notifications"}</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs">
                <CheckCheck className="h-3 w-3 mr-1" />
                {ar ? "تعيين الكل كمقروء" : "Mark all read"}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{ar ? "لا توجد إشعارات" : "No notifications"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className={cn("p-4 hover:bg-muted/50 transition-colors", !n.read && "bg-primary/5")}>
                  <div className="flex items-start gap-3">
                    {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ar ? n.titleAr : n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ar ? n.messageAr : n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
