'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Database, Download, Trash2 } from "lucide-react";

export function PersonalPersonalDataView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Data Management"
      titleAr="إدارة البيانات"
      apiEndpoint="/api/v1/student/personal/data"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "البيانات" : "Data", href: "/student/personal/data" },
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
                <CardTitle className="text-lg">{ar ? "تنزيل البيانات" : "Download Data"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <div className="font-medium text-sm">{ar ? "ملف البيانات الشخصي" : "Personal Data File"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "JSON format" : "JSON format"}</div>
                    </div>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {ar ? "تنزيل" : "Download"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <div className="font-medium text-sm">{ar ? "سجل الأنشطة" : "Activity Log"}</div>
                      <div className="text-xs text-muted-foreground">{ar ? "All your activities" : "All your activities"}</div>
                    </div>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {ar ? "تنزيل" : "Download"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "إدارة البيانات" : "Data Management"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {ar ? "حذف الحساب" : "Delete Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {ar ? "تحذير: هذا الإجراء لا يمكن التراجع عنه" : "Warning: This action cannot be undone"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
