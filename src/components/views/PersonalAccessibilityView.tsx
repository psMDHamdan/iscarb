'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Type, Contrast, Zap, Eye, Save } from "lucide-react";

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

export function PersonalAccessibilityView() {
  const { ar } = useI18n();

  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }));

  const applyFontSize = (value: number) => {
    document.documentElement.style.setProperty('--font-size-base', value + 'rem');
    update('fontSize', value);
  };

  const applyHighContrast = (enabled: boolean) => {
    if (enabled) document.documentElement.classList.add('high-contrast');
    else document.documentElement.classList.remove('high-contrast');
    update('highContrast', enabled);
  };

  const applyReducedMotion = (enabled: boolean) => {
    if (enabled) document.documentElement.classList.add('reduce-motion');
    else document.documentElement.classList.remove('reduce-motion');
    update('reducedMotion', enabled);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/student/personal/accessibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setSaving(false);
  };

  return (
    <StudentPageTemplate
      title="Accessibility"
      titleAr="إمكانية الوصول"
      apiEndpoint="/api/v1/student/personal/accessibility"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "إمكانية الوصول" : "Accessibility", href: "/student/personal/accessibility" },
      ]}
    >
      {(data: any) => {
        if (settings === null && data) {
          const a = data?.accessibility ?? data ?? {};
          setSettings({
            fontSize: a.fontSize ?? 1,
            highContrast: a.highContrast ?? false,
            reducedMotion: a.reducedMotion ?? false,
            screenReaderHints: a.screenReaderHints ?? true,
          });
          return null;
        }
        const s = settings ?? {};

        return (
          <div className="space-y-6 max-w-2xl">
            {/* Font Size */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Type className="h-4 w-4 text-[#0E6C3C]" />
                  {ar ? "حجم الخط" : "Font Size"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>0.8x</span>
                    <span className="font-semibold text-foreground text-sm">{(s.fontSize ?? 1).toFixed(1)}x</span>
                    <span>1.4x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.1}
                    value={s.fontSize ?? 1}
                    onChange={(e) => applyFontSize(Number(e.target.value))}
                    className="w-full accent-[#0E6C3C]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {ar ? "معاينة:" : "Preview:"}{' '}
                    <span style={{ fontSize: `${s.fontSize ?? 1}rem` }}>
                      {ar ? "هذا نص معاينة الخط" : "This is a font preview"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Visual Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Contrast className="h-4 w-4 text-blue-500" />
                  {ar ? "خيارات بصرية" : "Visual Options"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{ar ? "تباين عالي" : "High Contrast"}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "يزيد وضوح النصوص والحدود" : "Increases text and border visibility"}</p>
                  </div>
                  <Toggle checked={!!s.highContrast} onChange={applyHighContrast} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{ar ? "تقليل الحركة" : "Reduced Motion"}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "يوقف الرسوم المتحركة" : "Disables animations and transitions"}</p>
                  </div>
                  <Toggle checked={!!s.reducedMotion} onChange={applyReducedMotion} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {ar ? "تلميحات قارئ الشاشة" : "Screen Reader Hints"}
                    </p>
                    <p className="text-xs text-muted-foreground">{ar ? "يضيف وصفاً للعناصر التفاعلية" : "Adds descriptive labels to interactive elements"}</p>
                  </div>
                  <Toggle checked={!!s.screenReaderHints} onChange={(v) => update('screenReaderHints', v)} />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90">
              <Save className="h-4 w-4" />
              {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ الإعدادات" : "Save Settings")}
            </Button>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
