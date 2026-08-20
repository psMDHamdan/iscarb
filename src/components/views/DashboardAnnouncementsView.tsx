"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Bell, Calendar, Pin, Newspaper, Search, CheckCheck, Eye, EyeOff, ChevronDown, ChevronUp, Clock, Megaphone, Info, Award, Users } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function formatDate(dateStr: string, ar: boolean): string {
  return new Date(dateStr).toLocaleDateString(ar ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Group announcements by time period
function groupAnnouncements(announcements: any[], ar: boolean): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  const now = Date.now();
  const oneDay = 86400000;
  const oneWeek = 7 * oneDay;

  announcements.forEach((a) => {
    const diff = now - new Date(a.date).getTime();
    let group: string;
    if (diff < oneDay) group = "today";
    else if (diff < 2 * oneDay) group = "yesterday";
    else if (diff < oneWeek) group = "thisWeek";
    else group = "earlier";
    if (!groups[group]) groups[group] = [];
    groups[group].push(a);
  });

  return groups;
}

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  announcement: Megaphone,
  academic: Info,
  career: Award,
  community: Users,
  event: Calendar,
};

export function DashboardAnnouncementsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filterSource, setFilterSource] = useState<string | null>(null);

  const { data, isLoading: loading, error } = useApiQuery<{
    data: {
      announcements: {
        id: string; title: string; titleAr: string;
        content: string; contentAr: string;
        date: string; source: string; important: boolean;
        category: string; author: string; isRead?: boolean;
      }[];
      unreadCount: number;
    }
  }>(
    ["dashboard", "announcements"],
    "/api/v1/student/dashboard/announcements"
  );

  const announcementsData = data?.data;

  // Seed readIds from API-provided isRead flags on first load
  const [seeded, setSeeded] = useState(false);
  if (!seeded && announcementsData?.announcements) {
    const serverRead = announcementsData.announcements
      .filter((a: any) => a.isRead)
      .map((a: any) => a.id);
    if (serverRead.length > 0) {
      setReadIds(new Set(serverRead));
    }
    setSeeded(true);
  }

  const markAsRead = async (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
    // Persist to DB
    try {
      await fetch("/api/v1/student/dashboard/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: id }),
      });
    } catch {
      // Non-critical — local state already updated
    }
  };

  const markAllAsRead = async () => {
    if (announcementsData?.announcements) {
      const ids = announcementsData.announcements.map((a: any) => a.id);
      setReadIds(new Set(ids));
      // Persist each to DB
      await Promise.allSettled(
        ids.map((id: string) =>
          fetch("/api/v1/student/dashboard/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ announcementId: id }),
          })
        )
      );
    }
  };

  // Filter and search
  const filteredAnnouncements = useMemo(() => {
    if (!announcementsData?.announcements) return [];
    let filtered = announcementsData.announcements;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a: any) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.titleAr || "").includes(q) ||
          (a.content || "").toLowerCase().includes(q) ||
          (a.contentAr || "").includes(q)
      );
    }

    if (filterSource) {
      filtered = filtered.filter((a: any) => a.source === filterSource || a.category === filterSource);
    }

    if (!showAll) {
      filtered = filtered.slice(0, 10);
    }

    return filtered;
  }, [announcementsData, searchQuery, showAll, filterSource]);

  const grouped = useMemo(() => groupAnnouncements(filteredAnnouncements, ar), [filteredAnnouncements, ar]);

  // Extract unique sources/categories
  const sources = useMemo(() => {
    if (!announcementsData?.announcements) return [];
    return [...new Set(announcementsData.announcements.map((a: any) => a.source || a.category || "announcement"))];
  }, [announcementsData]);

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الإعلانات" : "Announcements"} description={ar ? "آخر الأخبار والإعلانات الجامعية" : "Latest university news and announcements"} />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري تحميل الإعلانات..." : "Loading announcements..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !announcementsData) {
    return (
      <>
        <PageHeader title={ar ? "الإعلانات" : "Announcements"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{ar ? "خطأ في تحميل الإعلانات" : "Error Loading Announcements"}</h4>
              <p className="text-sm mt-1 text-muted-foreground">
                {error instanceof Error ? error.message : (ar ? "تعذر تحميل الإعلانات" : "Could not load announcements")}
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة تحميل" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const { announcements, unreadCount } = announcementsData;
  const hasAnnouncements = announcements && announcements.length > 0;

  return (
    <>
      <PageHeader
        title={ar ? "الإعلانات" : "Announcements"}
        description={ar ? "تابع آخر الأخبار والإعلانات من جامعتك" : "Stay updated with your university announcements"}
      />

      <div className="space-y-6 pb-12">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ar ? "ابحث في الإعلانات..." : "Search announcements..."}
                className="pl-9"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="gap-1 text-xs shrink-0"
              title={ar ? "تحديد الكل كمقروء" : "Mark all as read"}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {ar ? "تحديد الكل" : "Mark read"}
            </Button>
          </div>

          {/* Source/Category Filters */}
          {sources.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filterSource === null ? "default" : "outline"}
                onClick={() => setFilterSource(null)}
                className={`text-xs ${filterSource === null ? "bg-iscarb-cyan/80 text-white" : ""}`}
              >
                {ar ? "الكل" : "All"}
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] bg-white/20 text-white">{unreadCount}</Badge>
                )}
              </Button>
              {sources.map((source: string) => (
                <Button
                  key={source}
                  size="sm"
                  variant={filterSource === source ? "default" : "outline"}
                  onClick={() => setFilterSource(filterSource === source ? null : source)}
                  className={`text-xs capitalize ${filterSource === source ? "bg-iscarb-cyan/80 text-white" : ""}`}
                >
                  {source}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Unread Count Info */}
        {hasAnnouncements && unreadCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/10 border border-blue-200/50">
            <Bell className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {ar
                ? `لديك ${unreadCount} إعلان غير مقروء`
                : `You have ${unreadCount} unread announcement${unreadCount !== 1 ? "s" : ""}`
              }
            </p>
          </div>
        )}

        {hasAnnouncements ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([group, items]) => {
              const groupLabel = ar
                ? ({ today: "اليوم", yesterday: "أمس", thisWeek: "هذا الأسبوع", earlier: "سابقاً" }[group] || group)
                : ({ today: "Today", yesterday: "Yesterday", thisWeek: "This Week", earlier: "Earlier" }[group] || group);

              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      {groupLabel}
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="space-y-3">
                    {items.map((announcement: any, idx: number) => {
                      const isImportant = announcement.important;
                      const isRead = readIds.has(announcement.id);
                      const SourceIcon = sourceIcons[announcement.source] || sourceIcons[announcement.category] || Newspaper;

                      return (
                        <Card
                          key={announcement.id || `${group}-${idx}`}
                          className={`transition-all hover:shadow-md hover:-translate-y-0.5 ${isImportant ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10" : ""
                            } ${isRead ? "opacity-60" : "border-l-2 border-l-iscarb-cyan"} `}
                          onClick={() => markAsRead(announcement.id)}
                        >
                          <CardHeader className="pb-3 border-b border-border/40">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg shrink-0 ${isImportant ? "bg-amber-100 dark:bg-amber-900/30" : isRead ? "bg-muted/30" : "bg-iscarb-cyan/10"
                                  }`}>
                                  {isImportant ? (
                                    <Pin className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <SourceIcon className={`h-4 w-4 ${isRead ? "text-muted-foreground" : "text-iscarb-cyan"}`} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className={`text-sm truncate ${isRead ? "text-muted-foreground" : ""}`}>
                                      {ar && announcement.titleAr ? announcement.titleAr : announcement.title}
                                    </CardTitle>
                                    {isImportant && (
                                      <Badge variant="destructive" className="text-[9px] shrink-0">
                                        {ar ? "مهم" : "Important"}
                                      </Badge>
                                    )}
                                    {!isRead && (
                                      <Badge variant="secondary" className="text-[9px] bg-iscarb-cyan/10 text-iscarb-cyan shrink-0">
                                        {ar ? "جديد" : "New"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1 font-medium capitalize">
                                      <SourceIcon className="h-3 w-3" />
                                      {announcement.source || announcement.category || "announcement"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(announcement.date, ar)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {timeAgo(announcement.date)}
                                    </span>
                                    {announcement.author && (
                                      <>
                                        <span>·</span>
                                        <span>{announcement.author}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="shrink-0 text-muted-foreground"
                                onClick={(e) => { e.stopPropagation(); markAsRead(announcement.id); }}
                              >
                                {isRead ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {ar && announcement.contentAr ? announcement.contentAr : announcement.content}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Show More / Less */}
            {announcements.length > 10 && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-muted-foreground gap-1"
                >
                  {showAll ? (
                    <>{ar ? "عرض أقل" : "Show less"} <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>{ar ? `عرض الكل (${announcements.length})` : `Show all (${announcements.length})`} <ChevronDown className="h-3 w-3" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{ar ? "لا توجد إعلانات حالياً" : "No announcements yet"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {ar ? "سيتم عرض الإعلانات الجديدة هنا" : "New announcements will appear here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
