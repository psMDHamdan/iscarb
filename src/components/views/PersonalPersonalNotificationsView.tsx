'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Bell, Inbox } from "lucide-react";

export function PersonalPersonalNotificationsView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Notifications"
      titleAr="الإشعارات"
      apiEndpoint="/api/v1/student/personal/notifications"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الإشعارات" : "Notifications", href: "/student/personal/notifications" },
      ]}
    >
      {(data: any, loading: boolean, error: string | null) => {
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  {ar ? "خطأ في التحميل" : "Error Loading Page"}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "سجل الإشعارات" : "Notification History"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.notifications?.map((notif: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex justify-between">
                        <div className="font-medium text-sm">{notif.title}</div>
                        <div className="text-xs text-muted-foreground">{notif.timestamp}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{notif.message}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-iscarb-green text-white px-2 py-1 rounded-full">{notif.type}</span>
                      </div>
                    </div>
                  ))}
                  {(!data?.notifications || data.notifications.length === 0) && (
                    <div className="text-center py-4">
                      <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{ar ? "لا توجد إشعارات" : "No notifications"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
