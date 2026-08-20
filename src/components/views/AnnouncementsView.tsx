"use client";

import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export function AnnouncementsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Announcements"
      titleAr="الإعلانات"
      apiEndpoint="/api/v1/announcements"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الإعلانات" : "Announcements", href: "/student/dashboard/announcements" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {ar ? "آخر الإعلانات" : "Latest Announcements"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.announcements && data.announcements.length > 0 ? (
                data.announcements.slice(0, 10).map((announcement: any) => (
                  <div key={announcement.id} className="p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors">
                    <h4 className="font-semibold text-sm">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-2">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">{ar ? "لا توجد إعلانات" : "No announcements"}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
