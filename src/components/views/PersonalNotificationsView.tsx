'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Bell, Settings, CheckCircle, Circle, Save } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${checked ? 'bg-[#0E6C3C]' : 'bg-muted border border-border'
        }`}
    >
      <span className={`h-4 w-4 bg-white rounded-full absolute top-1 shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'
        }`} />
    </button>
  );
}

export function PersonalNotificationsView() {
  const { ar } = useI18n();
  const [tab, setTab] = useState<'history' | 'config'>('history');
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePref = (key: string, value: any) => setPrefs((p: any) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/student/account/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setSaving(false);
  };

  return (
    <StudentPageTemplate
      title="Notifications"
      titleAr="الإشعارات"
      apiEndpoint="/api/v1/student/account/notifications"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الإشعارات" : "Notifications", href: "/student/account/notifications" },
      ]}
    >
      {(data: any) => {
        if (prefs === null && data?.preferences) {
          setPrefs({
            email: data.preferences.email ?? true,
            push: data.preferences.push ?? true,
            inApp: data.preferences.inApp ?? true,
            assignmentDue: data.preferences.assignmentDue ?? true,
            gradePosted: data.preferences.gradePosted ?? true,
            courseAnnouncements: data.preferences.courseAnnouncements ?? true,
          });
        }
        const p = prefs ?? {};
        const notifications: any[] = data?.notifications ?? [];

        return (
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setTab('history')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'history' ? 'border-[#0E6C3C] text-[#0E6C3C]' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Bell className="h-4 w-4" />
                {ar ? "الإشعارات" : "History"}
                {notifications.filter((n: any) => !n.readAt).length > 0 && (
                  <Badge className="text-xs bg-[#0E6C3C]/10 text-[#0E6C3C]">
                    {notifications.filter((n: any) => !n.readAt).length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setTab('config')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'config' ? 'border-[#0E6C3C] text-[#0E6C3C]' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Settings className="h-4 w-4" />
                {ar ? "الإعدادات" : "Configure"}
              </button>
            </div>

            {/* Tab 1: History */}
            {tab === 'history' && (
              notifications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{ar ? "لا توجد إشعارات بعد" : "No notifications yet"}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0 divide-y">
                    {notifications.map((n: any, i: number) => (
                      <div key={n.id ?? i} className={`flex items-start gap-3 p-4 ${!n.readAt ? 'bg-[#0E6C3C]/5' : ''}`}>
                        <div className="shrink-0 mt-0.5">
                          {n.readAt
                            ? <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            : <Circle className="h-4 w-4 text-[#0E6C3C]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ar ? n.titleAr || n.titleEn : n.titleEn}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ar ? n.bodyAr || n.bodyEn : n.bodyEn}</p>
                          <p className="text-xs text-muted-foreground mt-1">{n.createdAt}</p>
                        </div>
                        {!n.readAt && (
                          <div className="h-2 w-2 rounded-full bg-[#0E6C3C] shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            )}

            {/* Tab 2: Configuration */}
            {tab === 'config' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{ar ? "قنوات الإشعار" : "Notification Channels"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: 'email', label: ar ? 'البريد الإلكتروني' : 'Email' },
                      { key: 'push', label: ar ? 'الدفع (Push)' : 'Push Notifications' },
                      { key: 'inApp', label: ar ? 'داخل التطبيق' : 'In-App' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm">{item.label}</span>
                        <Toggle checked={!!p[item.key]} onChange={(v) => updatePref(item.key, v)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{ar ? "أنواع الإشعارات" : "Notification Types"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: 'assignmentDue', label: ar ? 'موعد تسليم الواجب' : 'Assignment Due' },
                      { key: 'gradePosted', label: ar ? 'نشر الدرجة' : 'Grade Posted' },
                      { key: 'courseAnnouncements', label: ar ? 'إعلانات المقرر' : 'Course Announcements' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm">{item.label}</span>
                        <Toggle checked={!!p[item.key]} onChange={(v) => updatePref(item.key, v)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90">
                  <Save className="h-4 w-4" />
                  {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ التفضيلات" : "Save Preferences")}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
