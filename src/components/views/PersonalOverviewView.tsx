'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, User, Settings, Shield, Bell, FileText, Edit } from "lucide-react";

export function PersonalOverviewView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Personal Dashboard"
      titleAr="لوحة المعلومات الشخصية"
      apiEndpoint="/api/v1/student/personal/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-iscarb-green" />
                    {ar ? "كامل الملف الشخصي" : "Profile Completeness"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{data?.profileCompleteness || 0}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ar ? "من إجمالي 100%" : "of 100%"}
                      </p>
                    </div>
                    <Progress value={data?.profileCompleteness || 0} className="w-24" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" />
                    {ar ? "تعديلات حديثة" : "Recent Changes"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.recentChanges || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "في هذا الشهر" : "This month"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    {ar ? "وضع الجار" : "Quick Links"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      {ar ? "تعديل" : "Edit"}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      {ar ? "توثيق" : "Docs"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="profile">{ar ? "الملف الشخصي" : "Profile"}</TabsTrigger>
                <TabsTrigger value="security">{ar ? "الأمان" : "Security"}</TabsTrigger>
                <TabsTrigger value="preferences">{ar ? "التفضيلات" : "Preferences"}</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "بيانات الملف الشخصي" : "Profile Information"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ar ? "الاسم" : "Name"}</span>
                          <span className="text-sm">{data?.profile?.name || "-"}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ar ? "البريد الإلكتروني" : "Email"}</span>
                          <span className="text-sm">{data?.profile?.email || "-"}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ar ? "رقم الهوية" : "ID Number"}</span>
                          <span className="text-sm">{data?.profile?.idNumber || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "إعدادات الأمان" : "Security Settings"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{ar ? "المصادقة الثنائية" : "Two-Factor Auth"}</div>
                          <div className="text-xs text-muted-foreground">{ar ? "مستخدم" : "Enabled"}</div>
                        </div>
                        <div className="w-10 h-6 rounded-full bg-iscarb-green flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{ar ? "الجلسات النشطة" : "Active Sessions"}</div>
                          <div className="text-xs text-muted-foreground">{data?.activeSessions || 0} {ar ? "جهاز" : "devices"}</div>
                        </div>
                        <Button size="sm" variant="outline">{ar ? "إدارة" : "Manage"}</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "التفضيلات الشخصية" : "Personal Preferences"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{ar ? "اللغة" : "Language"}</div>
                          <div className="text-xs text-muted-foreground">{data?.preferences?.language || "English"}</div>
                        </div>
                        <Button size="sm" variant="outline">{ar ? "تغيير" : "Change"}</Button>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{ar ? "الzone الزمنية" : "Time Zone"}</div>
                          <div className="text-xs text-muted-foreground">{data?.preferences?.timezone || "UTC"}</div>
                        </div>
                        <Button size="sm" variant="outline">{ar ? "تغيير" : "Change"}</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
