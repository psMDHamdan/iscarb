'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Bell, Layout, Bot, Save } from "lucide-react";

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

export function PersonalPreferencesView() {
  const { ar } = useI18n();

  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: any) => setPrefs((p: any) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/student/personal/preferences', {
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
      title="Preferences"
      titleAr="التفضيلات"
      apiEndpoint="/api/v1/student/personal/preferences"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "التفضيلات" : "Preferences", href: "/student/personal/preferences" },
      ]}
    >
      {(data: any) => {
        // Initialise local state from API data on first render
        if (prefs === null && data) {
          setPrefs({
            emailNotifications: data?.emailNotifications ?? true,
            pushNotifications: data?.pushNotifications ?? true,
            inAppNotifications: data?.inAppNotifications ?? true,
            dashboardLayout: data?.dashboardLayout ?? 'standard',
            aiSuggestions: data?.aiSuggestions ?? true,
            aiMemory: data?.aiMemory ?? true,
          });
          return null; // re-render with state
        }

        const p = prefs ?? {};

        return (
          <div className="space-y-6 max-w-2xl">
            {/* Notification Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#0E6C3C]" />
                  {ar ? "تفضيلات الإشعارات" : "Notification Preferences"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'emailNotifications', label: ar ? 'إشعارات البريد الإلكتروني' : 'Email Notifications' },
                  { key: 'pushNotifications', label: ar ? 'إشعارات الدفع' : 'Push Notifications' },
                  { key: 'inAppNotifications', label: ar ? 'إشعارات داخل التطبيق' : 'In-App Notifications' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-sm">{item.label}</span>
                    <Toggle checked={!!p[item.key]} onChange={(v) => update(item.key, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Dashboard Layout */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layout className="h-4 w-4 text-blue-500" />
                  {ar ? "تخطيط لوحة التحكم" : "Dashboard Layout"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {(['compact', 'standard', 'wide'] as const).map(layout => (
                    <button
                      key={layout}
                      onClick={() => update('dashboardLayout', layout)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${p.dashboardLayout === layout
                          ? 'bg-[#0E6C3C] text-white border-[#0E6C3C]'
                          : 'border-border hover:bg-muted/50'
                        }`}
                    >
                      {ar
                        ? layout === 'compact' ? 'مضغوط' : layout === 'standard' ? 'قياسي' : 'واسع'
                        : layout.charAt(0).toUpperCase() + layout.slice(1)}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Behavior */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-500" />
                  {ar ? "سلوك الذكاء الاصطناعي" : "AI Behavior"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'aiSuggestions', label: ar ? 'اقتراحات استباقية' : 'Proactive Suggestions' },
                  { key: 'aiMemory', label: ar ? 'ذاكرة المحادثة' : 'Conversation Memory' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-sm">{item.label}</span>
                    <Toggle checked={!!p[item.key]} onChange={(v) => update(item.key, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90">
              <Save className="h-4 w-4" />
              {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ التفضيلات" : "Save Preferences")}
            </Button>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
