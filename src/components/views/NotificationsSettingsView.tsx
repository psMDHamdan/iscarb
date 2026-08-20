"use client";

import { useState, useEffect } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Save, Loader2 } from "lucide-react";

interface NotificationsSettingsViewProps {
  ar: boolean;
}

export function NotificationsSettingsView({ ar }: NotificationsSettingsViewProps) {
  const { data: rawRes, isLoading: loading, refetch } = useApiQuery<any>(
    ["user", "notification-preferences"],
    "/api/v1/user/notification-preferences",
  );
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    securityAlerts: true,
    loginAlerts: true,
    roleChanges: true,
    auditDigest: false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (rawRes?.success) setPrefs(rawRes.data);
    else if (rawRes?.data) setPrefs(rawRes.data);
  }, [rawRes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/user/notification-preferences", {
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

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#0E6C3C]" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
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
        <h3 className="font-semibold mb-4">{ar ? "قنوات الإشعارات" : "Notification Channels"}</h3>
        <Toggle
          label={ar ? "البريد الإلكتروني" : "Email"}
          checked={prefs.emailEnabled}
          onChange={(v) => setPrefs({ ...prefs, emailEnabled: v })}
        />
        <Toggle
          label={ar ? "الإشعارات الفورية" : "Push Notifications"}
          checked={prefs.pushEnabled}
          onChange={(v) => setPrefs({ ...prefs, pushEnabled: v })}
        />
        <Toggle label="SMS" checked={prefs.smsEnabled} onChange={(v) => setPrefs({ ...prefs, smsEnabled: v })} />

        <h3 className="font-semibold mt-6 mb-4">{ar ? "أنواع الإشعارات" : "Notification Types"}</h3>
        <Toggle
          label={ar ? "تنبيهات الأمان" : "Security Alerts"}
          checked={prefs.securityAlerts}
          onChange={(v) => setPrefs({ ...prefs, securityAlerts: v })}
        />
        <Toggle
          label={ar ? "تنبيهات تسجيل الدخول" : "Login Alerts"}
          checked={prefs.loginAlerts}
          onChange={(v) => setPrefs({ ...prefs, loginAlerts: v })}
        />
        <Toggle
          label={ar ? "تغييرات الأدوار" : "Role Changes"}
          checked={prefs.roleChanges}
          onChange={(v) => setPrefs({ ...prefs, roleChanges: v })}
        />
        <Toggle
          label={ar ? "ملخص التدقيق" : "Audit Digest"}
          checked={prefs.auditDigest}
          onChange={(v) => setPrefs({ ...prefs, auditDigest: v })}
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
