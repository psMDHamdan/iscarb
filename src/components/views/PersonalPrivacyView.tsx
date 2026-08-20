'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Lock, Save, Info } from "lucide-react";

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

export function PersonalPrivacyView() {
  const { ar } = useI18n();
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/student/personal/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { }
    setSaving(false);
  };

  return (
    <StudentPageTemplate
      title="Privacy"
      titleAr="الخصوصية"
      apiEndpoint="/api/v1/student/personal/privacy"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الخصوصية" : "Privacy", href: "/student/personal/privacy" },
      ]}
    >
      {(data: any) => {
        if (settings === null && data) {
          setSettings({
            profileVisibility: data?.profileVisibility ?? 'public',
            showEmail: data?.showEmail ?? false,
            showProgress: data?.showProgress ?? true,
            dataCollection: data?.dataCollection ?? true,
          });
          return null;
        }

        const s = settings ?? {};

        return (
          <div className="space-y-6 max-w-2xl">
            {/* PDPL compliance notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {ar
                  ? "يتم تسجيل التغييرات لأغراض الامتثال (نظام حماية البيانات الشخصية - PDPL)."
                  : "Changes are logged for compliance (PDPL)."}
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#0E6C3C]" />
                  {ar ? "ظهور الملف الشخصي" : "Profile Visibility"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {(['public', 'private', 'link-only'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => update('profileVisibility', v)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${s.profileVisibility === v
                          ? 'bg-[#0E6C3C] text-white border-[#0E6C3C]'
                          : 'border-border hover:bg-muted/50'
                        }`}
                    >
                      {ar
                        ? v === 'public' ? 'عام' : v === 'private' ? 'خاص' : 'برابط فقط'
                        : v === 'public' ? 'Public' : v === 'private' ? 'Private' : 'Link Only'}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {ar ? "إعدادات موافقة البيانات" : "Data Consent Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'showEmail', label: ar ? 'إظهار البريد الإلكتروني' : 'Show Email', desc: ar ? 'يظهر بريدك في ملفك العام' : 'Show email on public profile' },
                  { key: 'showProgress', label: ar ? 'إظهار تقدمي' : 'Show Progress', desc: ar ? 'يظهر تقدمك الأكاديمي' : 'Show academic progress to others' },
                  { key: 'dataCollection', label: ar ? 'جمع البيانات' : 'Data Collection', desc: ar ? 'السماح بتحسين المنصة من بياناتك' : 'Allow anonymized data for platform improvement' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle checked={!!s[item.key]} onChange={(v) => update(item.key, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90">
              <Save className="h-4 w-4" />
              {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ إعدادات الخصوصية" : "Save Privacy Settings")}
            </Button>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
