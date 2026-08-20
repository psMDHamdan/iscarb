'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Link2, Link2Off, ShieldCheck } from "lucide-react";

export function PersonalConnectedAppsView() {
  const { ar } = useI18n();
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (appId: string) => {
    setRevoking(appId);
    try {
      await fetch(`/api/v1/student/account/connected-apps?id=${appId}`, { method: 'DELETE' });
      window.location.reload();
    } catch { }
    setRevoking(null);
  };

  return (
    <StudentPageTemplate
      title="Connected Apps"
      titleAr="التطبيقات المتصلة"
      apiEndpoint="/api/v1/student/account/connected-apps"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "التطبيقات المتصلة" : "Connected Apps", href: "/student/account/connected-apps" },
      ]}
    >
      {(data: any) => {
        const apps: any[] = data?.apps ?? [];

        if (apps.length === 0) {
          return (
            <Card>
              <CardContent className="p-12 text-center">
                <Link2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">{ar ? "لا توجد تطبيقات متصلة" : "No connected apps"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "ستظهر هنا التطبيقات التي منحتها صلاحية الوصول" : "Apps you authorize will appear here"}
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0E6C3C]" />
              {ar
                ? "إلغاء الاتصال يُنهي صلاحية الوصول ويسجّل ذلك في سجل المراجعة."
                : "Revoking access terminates the app's permissions and is logged for audit."}
            </p>

            <div className="space-y-3">
              {apps.map((app: any, i: number) => (
                <Card key={app.id ?? i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon / emoji */}
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                        {app.icon || '🔗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{app.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {ar ? "متصل" : "Connected"}
                          </Badge>
                        </div>
                        {app.connectedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ar ? "متصل منذ:" : "Connected:"} {app.connectedAt}
                          </p>
                        )}
                        {app.scopes && app.scopes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.scopes.map((scope: string, j: number) => (
                              <span key={j} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                {scope}
                              </span>
                            ))}
                          </div>
                        )}
                        {app.permissions && (
                          <p className="text-xs text-muted-foreground mt-1">{app.permissions}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        disabled={revoking === (app.id ?? String(i))}
                        onClick={() => handleRevoke(app.id ?? String(i))}
                      >
                        <Link2Off className="h-4 w-4 mr-1" />
                        {ar ? "إلغاء" : "Revoke"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
