'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Settings, Globe, Moon } from "lucide-react";

export function PersonalPersonalSettingsView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Settings"
      titleAr="الإعدادات"
      apiEndpoint="/api/v1/student/settings"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الإعدادات" : "Settings", href: "/student/personal/settings" },
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
                <CardTitle className="text-lg">{ar ? "الإعدادات العامة" : "General Settings"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "اللغة" : "Language"}</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="en">{ar ? "English" : "English"}</option>
                      <option value="ar">{ar ? "العربية" : "العربية"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "الzone الزمنية" : "Time Zone"}</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>UTC</option>
                      <option>Asia/Riyadh</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "التنسيق الرقمي" : "Number Format"}</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>En (1,234.56)</option>
                      <option>Ar (١٢٣٤.٥٦)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "الإعدادات المتقدمة" : "Advanced Settings"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "الوضع الداكن" : "Dark Mode"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "تفعيل الوضع الداكن" : "Enable dark mode"}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      {data?.settings?.darkMode ? (ar ? "إيقاف" : "Off") : (ar ? "تشغيل" : "On")}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{ar ? "التحديث التلقائي" : "Auto-refresh"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "تحديث البيانات تلقائيًا" : "Auto-refresh data"}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      {data?.settings?.autoRefresh ? (ar ? "تشغيل" : "On") : (ar ? "إيقاف" : "Off")}
                    </Button>
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
