'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Bell, Globe, Sun, Moon, Settings, Lock, Mail, Trash2, Save, Loader2 } from "lucide-react";

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

export function PersonalSettingsView() {
  const { ar } = useI18n();
  const [state, setState] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const update = (key: string, value: any) => setState((s: any) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/student/personal/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setSaving(false);
  };

  return (
    <StudentPageTemplate
      title="Settings"
      titleAr="الإعدادات"
      apiEndpoint="/api/v1/student/personal/settings"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الإعدادات" : "Settings", href: "/student/settings" },
      ]}
    >
      {(data: any) => {
        if (state === null && data) {
          setState({
            language: data?.language ?? 'en',
            theme: data?.theme ?? 'system',
            notifications: {
              email: data?.notifications?.email ?? true,
              push: data?.notifications?.push ?? true,
              courseUpdates: data?.notifications?.courseUpdates ?? true,
              grades: data?.notifications?.grades ?? true,
              deadlines: data?.notifications?.deadlines ?? true,
              community: data?.notifications?.community ?? false,
            },
          });
          return null;
        }
        const s = state ?? {};
        const notif = s.notifications ?? {};

        return (
          <div className="space-y-6 max-w-2xl">
            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#0E6C3C]" />
                  {ar ? "الإشعارات" : "Notifications"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: 'email', label: ar ? 'إشعارات البريد الإلكتروني' : 'Email Notifications' },
                  { key: 'push', label: ar ? 'إشعارات الدفع' : 'Push Notifications' },
                  { key: 'courseUpdates', label: ar ? 'تحديثات الدورات' : 'Course Updates' },
                  { key: 'grades', label: ar ? 'الدرجات والتقييمات' : 'Grades & Assessments' },
                  { key: 'deadlines', label: ar ? 'المواعيد النهائية' : 'Deadlines' },
                  { key: 'community', label: ar ? 'نشاط المجتمع' : 'Community Activity' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{item.label}</span>
                    <Toggle
                      checked={!!notif[item.key]}
                      onChange={(v) => update('notifications', { ...notif, [item.key]: v })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  {ar ? "اللغة" : "Language"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {[{ v: 'en', label: 'English' }, { v: 'ar', label: 'العربية' }].map(l => (
                    <button
                      key={l.v}
                      onClick={() => update('language', l.v)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${s.language === l.v
                          ? 'bg-[#0E6C3C] text-white border-[#0E6C3C]'
                          : 'border-border hover:bg-muted/50'
                        }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {s.theme === 'dark' ? <Moon className="h-4 w-4 text-purple-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                  {ar ? "المظهر" : "Theme"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {[
                    { v: 'light', icon: Sun, label: ar ? 'فاتح' : 'Light' },
                    { v: 'dark', icon: Moon, label: ar ? 'داكن' : 'Dark' },
                    { v: 'system', icon: Settings, label: ar ? 'النظام' : 'System' },
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.v}
                        onClick={() => update('theme', t.v)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-all ${s.theme === t.v
                            ? 'bg-[#0E6C3C] text-white border-[#0E6C3C]'
                            : 'border-border hover:bg-muted/50'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{ar ? "الحساب" : "Account"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ar ? "تغيير كلمة المرور" : "Change Password"}</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ar ? "تحديث البريد الإلكتروني" : "Update Email"}</span>
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">{ar ? "حذف الحساب" : "Delete Account"}</span>
                </button>
              </CardContent>
            </Card>

            {showDelete && (
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="py-6 text-center">
                  <Trash2 className="h-10 w-10 mx-auto mb-3 text-red-500/30" />
                  <p className="font-semibold text-sm mb-1">{ar ? "هل أنت متأكد؟" : "Are you sure?"}</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {ar ? "لا يمكن التراجع عن هذا الإجراء" : "This action cannot be undone"}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setShowDelete(false)}>
                      {ar ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button variant="destructive">{ar ? "حذف" : "Delete"}</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : (ar ? "حفظ الإعدادات" : "Save Settings")}
            </Button>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
