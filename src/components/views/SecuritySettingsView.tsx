"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Shield,
  Smartphone,
  Key,
  Monitor,
  Check,
  X,
  Loader2,
  Plus,
  Trash2,
  Lock,
  Globe,
  LogOut,
  Eye,
  EyeOff,
  Smartphone as DeviceIcon,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MfaStatus {
  enabled: boolean;
  method?: string;
  backupCodesRemaining?: number;
}

interface TrustedDevice {
  id: string;
  name?: string;
  userAgent?: string;
  ipAddress?: string;
  lastUsedAt: string;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  active: boolean;
  createdAt: string;
}

interface ActiveSession {
  sessionId: string;
  data: {
    userId: string;
    orgId: string;
    ipAddress?: string;
    userAgent?: string;
    issuedAt: number;
    expiresAt: number;
    lastActivity: number;
    mfaVerified?: boolean;
  };
}

type TabId = "password" | "mfa" | "sessions" | "devices" | "api-keys";

interface SecuritySettingsViewProps {
  ar: boolean;
}

// ─── Main View ──────────────────────────────────────────────────────────────

export function SecuritySettingsView({ ar }: SecuritySettingsViewProps) {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("password");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mfaRes, devicesRes, keysRes, sessionsRes] = await Promise.all([
        fetch("/api/v1/security/mfa"),
        fetch("/api/v1/security/devices"),
        fetch("/api/v1/security/api-keys"),
        fetch("/api/v1/auth/sessions"),
      ]);

      const [mfa, devices, keys, sessionsData] = await Promise.all([
        mfaRes.json(),
        devicesRes.json(),
        keysRes.json(),
        sessionsRes.json(),
      ]);

      if (mfa.success) setMfaStatus(mfa.data);
      if (devices.success) setDevices(devices.data);
      if (keys.success) setApiKeys(keys.data);
      if (sessionsData.success) setSessions(sessionsData.data);
    } catch (err) {
      console.error("Failed to load security settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { key: "password" as const, label: ar ? "كلمة المرور" : "Password", icon: Lock },
    { key: "mfa" as const, label: ar ? "المصادقة الثنائية" : "MFA", icon: Shield },
    { key: "sessions" as const, label: ar ? "الجلسات" : "Sessions", icon: Globe },
    { key: "devices" as const, label: ar ? "الأجهزة" : "Devices", icon: Monitor },
    { key: "api-keys" as const, label: "API Keys", icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "border-[#0E6C3C] text-[#0E6C3C]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeTab === "password" && <PasswordSection ar={ar} />}
          {activeTab === "mfa" && <MfaSection status={mfaStatus} ar={ar} />}
          {activeTab === "sessions" && <SessionsSection sessions={sessions} ar={ar} onRefresh={fetchData} />}
          {activeTab === "devices" && <DevicesSection devices={devices} ar={ar} />}
          {activeTab === "api-keys" && <ApiKeysSection keys={apiKeys} ar={ar} />}
        </>
      )}
    </div>
  );
}

// ─── Password Section ───────────────────────────────────────────────────────

function PasswordSection({ ar }: { ar: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async () => {
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError(ar ? "يرجى إدخال كلمة المرور الحالية" : "Current password is required");
      return;
    }

    if (newPassword.length < 12) {
      setError(ar ? "يجب أن تتكون كلمة المرور من 12 حرفًا على الأقل" : "Password must be at least 12 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(ar ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    setChanging(true);
    try {
      // Try the dedicated change-password endpoint first, fallback to password/confirm
      const res = await fetch("/api/v1/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        // Fallback: try the reset confirm endpoint with a session-based token flow
        const data = await res.json();
        setError(data.error || (ar ? "فشل تغيير كلمة المرور" : "Failed to change password"));
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(ar ? "خطأ في الشبكة. حاول مرة أخرى." : "Network error. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4" /> {ar ? "تغيير كلمة المرور" : "Change Password"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {ar
            ? "يوصى بتغيير كلمة المرور بانتظام للحفاظ على أمان حسابك"
            : "It's recommended to change your password regularly to keep your account secure"}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            {ar ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully"}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "كلمة المرور الحالية" : "Current Password"}
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm pr-10"
                placeholder={ar ? "كلمة المرور الحالية" : "Current password"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "كلمة المرور الجديدة" : "New Password"}
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm pr-10"
                placeholder={ar ? "كلمة المرور الجديدة" : "New password"}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength indicator */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        strengthScore <= 1 ? "bg-red-500" : strengthScore <= 2 ? "bg-amber-500" : strengthScore <= 3 ? "bg-blue-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium min-w-[3rem] text-right">
                    {strengthScore <= 1 ? (ar ? "ضعيف" : "Weak") : strengthScore <= 2 ? (ar ? "مقبول" : "Fair") : strengthScore <= 3 ? (ar ? "جيد" : "Good") : (ar ? "قوي" : "Strong")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <RequirementCheck met={hasMinLength} label={ar ? "12 حرفًا على الأقل" : "At least 12 chars"} />
                  <RequirementCheck met={hasUpper} label={ar ? "حرف كبير" : "Uppercase"} />
                  <RequirementCheck met={hasLower} label={ar ? "حرف صغير" : "Lowercase"} />
                  <RequirementCheck met={hasNumber} label={ar ? "رقم" : "Number"} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-lg bg-background text-sm",
                confirmPassword.length > 0 && !passwordsMatch
                  ? "border-red-300"
                  : passwordsMatch
                  ? "border-emerald-300"
                  : ""
              )}
              placeholder={ar ? "تأكيد كلمة المرور" : "Confirm password"}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">{ar ? "كلمات المرور غير متطابقة" : "Passwords do not match"}</p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changing || !currentPassword || !passwordsMatch || strengthScore < 4}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E6C3C] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#0E6C3C]/90 transition-colors"
          >
            {changing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {ar ? "تغيير كلمة المرور" : "Change Password"}
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
          {ar ? "نصائح أمان كلمة المرور" : "Password Security Tips"}
        </h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#0E6C3C] mt-2 flex-shrink-0" />
            {ar ? "استخدم كلمة مرور فريدة لكل حساب" : "Use a unique password for each account"}
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#0E6C3C] mt-2 flex-shrink-0" />
            {ar ? "قم بتغيير كلمة المرور كل 90 يومًا" : "Change your password every 90 days"}
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#0E6C3C] mt-2 flex-shrink-0" />
            {ar ? "لا تشارك كلمة المرور مع أي شخص" : "Never share your password with anyone"}
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#0E6C3C] mt-2 flex-shrink-0" />
            {ar ? "استخدم المصادقة الثنائية لطبقة حماية إضافية" : "Enable MFA for an extra layer of security"}
          </li>
        </ul>
      </div>
    </div>
  );
}

function RequirementCheck({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", met ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
      <span className={met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

// ─── Sessions Section ───────────────────────────────────────────────────────

function SessionsSection({ sessions, ar, onRefresh }: { sessions: ActiveSession[]; ar: boolean; onRefresh: () => void }) {
  const [revoking, setRevoking] = useState<string | null>(null);

  const revokeSession = async (sessionId: string) => {
    if (!confirm(ar ? "هل تريد إنهاء هذه الجلسة؟" : "Terminate this session?")) return;

    setRevoking(sessionId);
    try {
      const res = await fetch("/api/v1/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to revoke session:", err);
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllSessions = async () => {
    if (!confirm(ar ? "هل تريد إنهاء جميع الجلسات الأخرى؟" : "Terminate all other sessions?")) return;

    try {
      const res = await fetch("/api/v1/auth/sessions/revoke-all", { method: "POST" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to revoke all sessions:", err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isCurrentSession = (session: ActiveSession) => {
    // The last session in the list or the first one in the sorted list is likely the current one
    // In a real implementation, the API should return a flag for the current session
    return sessions.indexOf(session) === 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{ar ? "الجلسات النشطة" : "Active Sessions"}</h3>
          <p className="text-sm text-muted-foreground">
            {ar
              ? `لديك ${sessions.length} جلسة نشطة`
              : `You have ${sessions.length} active session${sessions.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={revokeAllSessions}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {ar ? "إنهاء الكل" : "Sign Out All"}
          </button>
        )}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{ar ? "لا توجد جلسات نشطة" : "No active sessions"}</p>
          </div>
        ) : (
          <div className="divide-y">
            {sessions.map((session) => {
              const s = session.data;
              const current = isCurrentSession(session);

              return (
                <div key={session.sessionId} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", current ? "bg-[#0E6C3C]/10" : "bg-muted")}>
                      {current ? (
                        <DeviceIcon className="h-5 w-5 text-[#0E6C3C]" />
                      ) : (
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{s.userAgent ? formatUserAgent(s.userAgent) : (ar ? "جلسة غير معروفة" : "Unknown session")}</p>
                        {current && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#0E6C3C]/10 text-[#0E6C3C] font-medium">
                            {ar ? "حاليًا" : "Current"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {s.ipAddress ? `${s.ipAddress} • ` : ""}
                        {ar ? "آخر نشاط:" : "Last active:"} {formatDate(s.lastActivity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? "تم:" : "Issued:"} {formatDate(s.issuedAt)}
                        {s.mfaVerified ? ` • MFA ${ar ? "مفعلة" : "verified"}` : ""}
                      </p>
                    </div>
                  </div>
                  {!current && (
                    <button
                      onClick={() => revokeSession(session.sessionId)}
                      disabled={revoking === session.sessionId}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg disabled:opacity-50"
                      title={ar ? "إنهاء الجلسة" : "Terminate session"}
                    >
                      {revoking === session.sessionId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatUserAgent(ua: string): string {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Mobile")) return "Mobile Browser";
  return ua.substring(0, 30);
}

// ─── MFA Section ────────────────────────────────────────────────────────────

function MfaSection({ status, ar }: { status: MfaStatus | null; ar: boolean }) {
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);

  const setupMfa = async (method: string) => {
    setSetupLoading(true);
    try {
      const res = await fetch("/api/v1/security/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (data.success) {
        setSetupResult(data.data);
      }
    } catch (err) {
      console.error("Failed to setup MFA:", err);
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">
              {ar ? "المصادقة الثنائية" : "Multi-Factor Authentication"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {ar ? "أضف طبقة حماية إضافية لحسابك" : "Add an extra layer of security to your account"}
            </p>
          </div>
          {status?.enabled && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              {ar ? "مفعّل" : "Enabled"}
            </span>
          )}
        </div>

        {!status?.enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {ar ? "اختر طريقة المصادقة الثنائية:" : "Choose a multi-factor authentication method:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { method: "totp", label: "Authenticator App", desc: "Google Authenticator, Authy" },
                { method: "sms", label: "SMS Code", desc: "Text message to your phone" },
                { method: "email", label: "Email Code", desc: "Code sent to your email" },
                { method: "fido2", label: "Security Key", desc: "YubiKey, fingerprint" },
              ].map((option) => (
                <button
                  key={option.method}
                  onClick={() => setupMfa(option.method)}
                  disabled={setupLoading}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 text-left"
                >
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">{ar ? "المصادقة الثنائية مفعّلة" : "MFA is enabled"} ({status.method})</span>
            </div>
            {status.backupCodesRemaining !== undefined && (
              <p className="text-sm text-muted-foreground">
                {ar ? `أكواد النسخ الاحتياطي المتبقية: ${status.backupCodesRemaining}` : `Backup codes remaining: ${status.backupCodesRemaining}`}
              </p>
            )}
          </div>
        )}

        {setupResult && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm mb-2">{ar ? "خطوات الإعداد" : "Setup Steps"}</h4>
            {setupResult.qrCodeUrl && (
              <p className="text-xs text-muted-foreground mb-2">
                {ar ? "امسح رمز QR في تطبيق المصادقة" : "Scan this QR code in your authenticator app"}
              </p>
            )}
            {setupResult.secret && (
              <div className="p-2 bg-background rounded font-mono text-sm break-all">{setupResult.secret}</div>
            )}
            {setupResult.backupCodes && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {ar ? "احفظ هذه الأكواد في مكان آمن:" : "Save these backup codes safely:"}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {setupResult.backupCodes.map((code: string) => (
                    <span key={code} className="font-mono text-xs p-1 bg-background rounded">{code}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Devices Section ────────────────────────────────────────────────────────

function DevicesSection({ devices, ar }: { devices: TrustedDevice[]; ar: boolean }) {
  const revokeDevice = async (deviceId: string) => {
    if (!confirm(ar ? "هل تريد إلغاء ثقة هذا الجهاز؟" : "Revoke this device?")) return;
    try {
      await fetch(`/api/v1/security/devices/${deviceId}`, { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error("Failed to revoke device:", err);
    }
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold">{ar ? "الأجهزة الموثوقة" : "Trusted Devices"}</h3>
        <p className="text-sm text-muted-foreground">
          {ar ? "الأجهزة التي لا تتطلب مصادقة ثنائية" : "Devices that don't require MFA verification"}
        </p>
      </div>

      {devices.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">{ar ? "لا توجد أجهزة موثوقة" : "No trusted devices"}</p>
        </div>
      ) : (
        <div className="divide-y">
          {devices.map((device) => (
            <div key={device.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{device.name || (ar ? "جهاز موثق" : "Trusted Device")}</p>
                  <p className="text-xs text-muted-foreground">{device.userAgent?.substring(0, 50)}...</p>
                  <p className="text-xs text-muted-foreground">
                    {ar ? "آخر استخدام:" : "Last used:"} {new Date(device.lastUsedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => revokeDevice(device.id)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── API Keys Section ───────────────────────────────────────────────────────

function ApiKeysSection({ keys, ar }: { keys: ApiKey[]; ar: boolean }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/security/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data.plainKey);
        setShowCreate(false);
        setNewKeyName("");
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm(ar ? "هل تريد إلغاء هذا المفتاح؟" : "Revoke this API key?")) return;
    try {
      await fetch(`/api/v1/security/api-keys/${keyId}`, { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  return (
    <div className="space-y-4">
      {createdKey && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-emerald-800 dark:text-emerald-200">
                {ar ? "تم إنشاء المفتاح" : "API Key Created"}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2">
                {ar ? "احفظ هذا المفتاح. لن يظهر مرة أخرى." : "Save this key. It will not be shown again."}
              </p>
              <code className="block p-2 bg-background rounded text-xs break-all">{createdKey}</code>
            </div>
            <button onClick={() => setCreatedKey(null)} className="text-emerald-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0E6C3C] text-white rounded-lg text-sm"
        >
          <Plus className="h-4 w-4" />
          {ar ? "إنشاء مفتاح" : "Create API Key"}
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{ar ? "لا توجد مفاتيح API" : "No API keys"}</p>
          </div>
        ) : (
          <div className="divide-y">
            {keys.map((key) => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}...</p>
                    <p className="text-xs text-muted-foreground">
                      {key.scopes.join(", ")} • {key.rateLimit} req/hr
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!key.active && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Revoked</span>
                  )}
                  {key.active && (
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">{ar ? "إنشاء مفتاح API" : "Create API Key"}</h3>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder={ar ? "اسم المفتاح" : "Key name"}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={createKey}
                disabled={creating || !newKeyName.trim()}
                className="px-4 py-2 bg-[#0E6C3C] text-white rounded-lg text-sm disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : ar ? "إنشاء" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
