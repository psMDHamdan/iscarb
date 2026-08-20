'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Bell, Eye, Moon, Sun } from "lucide-react";

export function PersonalPersonalPreferencesView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Preferences"
      titleAr="التفضيلات"
      apiEndpoint="/api/v1/student/personal/preferences"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "التفضيلات" : "Preferences", href: "/student/personal/preferences" },
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
                <CardTitle className="text-lg">{ar ? "تفضيلات الإشعارات" : "Notification Preferences"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "إشعارات_email" : "Email Notifications"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "تلقي تحديثات عبر البريد الإلكتروني" : "Receive updates via email"}</div>
                    </div>
                    <Switch defaultChecked={data?.preferences?.emailNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "إشعارات_push" : "Push Notifications"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "تلقي إشعارات مباشرة على الجهاز" : "Receive direct device notifications"}</div>
                    </div>
                    <Switch defaultChecked={data?.preferences?.pushNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "إشعارات_in-app" : "In-App Notifications"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "عرض الإشعارات داخل التطبيق" : "Show notifications in-app"}</div>
                    </div>
                    <Switch defaultChecked={data?.preferences?.inAppNotifications} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "تفضيلات العرض" : "Display Preferences"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "الوضع الداكن" : "Dark Mode"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "تشغيل الوضع الداكن" : "Enable dark mode"}</div>
                    </div>
                    <Switch defaultChecked={data?.preferences?.darkMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "اللغة" : "Language"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "اللغة الافتراضية" : "Default language"}</div>
                    </div>
                    <select className="text-sm rounded-md border border-input bg-background px-3 py-1">
                      <option value="en">{ar ? "English" : "English"}</option>
                      <option value="ar">{ar ? "العربية" : "العربية"}</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
