'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Lock, Shield, Key } from "lucide-react";

export function PersonalPersonalSecurityView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Security"
      titleAr="الأمان"
      apiEndpoint="/api/v1/student/personal/security"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الأمان" : "Security", href: "/student/personal/security" },
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
                <CardTitle className="text-lg">{ar ? "الجلسات النشطة" : "Active Sessions"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.sessions?.map((session: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <div className="font-medium text-sm">{session.device}</div>
                        <div className="text-xs text-muted-foreground">{session.ip} • {ar ? "آخر استخدام:" : "Last active:"} {session.lastActive}</div>
                      </div>
                      <div className="flex gap-2">
                        {session.current && (
                          <span className="text-xs bg-iscarb-green text-white px-2 py-1 rounded-full">{ar ? "حالي" : "Current"}</span>
                        )}
                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                          {ar ? "إلغاء" : "Revoke"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!data?.sessions || data.sessions.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">{ar ? "لا توجد جلسات نشطة" : "No active sessions"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "المصادقة الثنائية" : "Two-Factor Authentication"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{ar ? "حالة المصادقة الثنائية" : "2FA Status"}</div>
                    <div className="text-xs text-muted-foreground">{data?.mfa?.enabled ? (ar ? "مفعل" : "Enabled") : (ar ? "غير مفعل" : "Disabled")}</div>
                  </div>
                  <Button variant={data?.mfa?.enabled ? "destructive" : "default"}>
                    {data?.mfa?.enabled ? (ar ? "إلغاء" : "Disable") : (ar ? "تفعيل" : "Enable")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "تغيير كلمة المرور" : "Change Password"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "كلمة المرور الحالية" : "Current Password"}</label>
                    <input type="password" className="w-full rounded-md border border-input bg-background px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "كلمة المرور الجديدة" : "New Password"}</label>
                    <input type="password" className="w-full rounded-md border border-input bg-background px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "تكرار كلمة المرور الجديدة" : "Confirm New Password"}</label>
                    <input type="password" className="w-full rounded-md border border-input bg-background px-3 py-2" />
                  </div>
                  <Button className="w-full">{ar ? "حفظ كلمة المرور" : "Save Password"}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
