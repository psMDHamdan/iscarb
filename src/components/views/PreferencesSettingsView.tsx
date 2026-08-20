"use client";

import { useState, useEffect } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Save, Loader2, Globe, Palette, Clock } from "lucide-react";

interface PreferencesSettingsViewProps {
  ar: boolean;
  locale: string;
  setLocale: (lang: string) => void;
}

export function PreferencesSettingsView({ ar, locale, setLocale }: PreferencesSettingsViewProps) {
  const { data: rawRes, isLoading: loading, refetch } = useApiQuery<any>(
    ["user", "preferences"],
    "/api/v1/user/preferences",
  );
  const [prefs, setPrefs] = useState({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const prefsData = rawRes?.success ? rawRes.data : rawRes?.data;
    if (prefsData) setPrefs(prefsData);
  }, [rawRes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSuccess(true);
        refetch();
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const Select = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 border rounded-lg bg-background text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border rounded-xl p-6 space-y-2">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4" /> {ar ? "المظهر" : "Appearance"}
        </h3>

        <Select
          label={ar ? "السمة" : "Theme"}
          value={prefs.theme}
          onChange={(v) => setPrefs({ ...prefs, theme: v })}
          options={[
            { value: "light", label: ar ? "فاتح" : "Light" },
            { value: "dark", label: ar ? "داكن" : "Dark" },
            { value: "system", label: ar ? "النظام" : "System" },
          ]}
        />

        <h3 className="font-semibold mt-6 mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" /> {ar ? "اللغة والمنطقة" : "Language & Region"}
        </h3>

        <Select
          label={ar ? "اللغة" : "Language"}
          value={prefs.language}
          onChange={(v) => {
            setPrefs({ ...prefs, language: v });
            setLocale(v);
          }}
          options={[
            { value: "en", label: "English" },
            { value: "ar", label: "العربية" },
            { value: "fr", label: "Fran\u00e7ais" },
            { value: "es", label: "Espa\u00f1ol" },
          ]}
        />

        <Select
          label={ar ? "المنطقة الزمنية" : "Timezone"}
          value={prefs.timezone}
          onChange={(v) => setPrefs({ ...prefs, timezone: v })}
          options={[
            { value: "UTC", label: "UTC" },
            { value: "Asia/Riyadh", label: "Asia/Riyadh" },
            { value: "America/New_York", label: "America/New_York" },
            { value: "Europe/London", label: "Europe/London" },
          ]}
        />

        <Select
          label={ar ? "تنسيق التاريخ" : "Date Format"}
          value={prefs.dateFormat}
          onChange={(v) => setPrefs({ ...prefs, dateFormat: v })}
          options={[
            { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
            { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
          ]}
        />

        <Select
          label={ar ? "تنسيق الوقت" : "Time Format"}
          value={prefs.timeFormat}
          onChange={(v) => setPrefs({ ...prefs, timeFormat: v })}
          options={[
            { value: "24h", label: "24h" },
            { value: "12h", label: "12h" },
          ]}
        />

        <div className="pt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E6C3C] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {ar ? "حفظ" : "Save"}
          </button>
          {success && (
            <span className="text-sm text-emerald-600">{ar ? "تم الحفظ" : "Saved"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
