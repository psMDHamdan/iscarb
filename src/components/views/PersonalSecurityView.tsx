'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Shield, Monitor, Key, LogOut } from "lucide-react";

export function PersonalSecurityView() {
  const { ar } = useI18n();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return;
    setPwSaving(true);
    try {
      await fetch('/api/v1/student/personal/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changePassword', currentPassword: currentPw, newPassword: newPw }),
      });
      setPwMsg(ar ? 'تم تحديث كلمة المرور' : 'Password updated successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch {
      setPwMsg(ar ? 'حدث خطأ' : 'An error occurred');
    }
    setPwSaving(false);
    setTimeout(() => setPwMsg(''), 3000);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await fetch('/api/v1/student/personal/security', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      window.location.reload();
    } catch { }
    setRevoking(null);
  };

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
      {(data: any) => (
        <div className="space-y-6 max-w-2xl">
          {/* Active Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[#0E6C3C]" />
                {ar ? "الجلسات النشطة" : "Active Sessions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {(data?.sessions ?? []).map((session: any, i: number) => (
                <div key={session.id ?? i} className="flex items-center gap-3 p-4">
                  <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{session.device}</p>
                      {session.current && (
                        <Badge className="text-xs bg-[#0E6C3C]/10 text-[#0E6C3C] border-[#0E6C3C]/20">
                          {ar ? "الجلسة الحالية" : "Current"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.ip} · {ar ? "آخر نشاط:" : "Last active:"} {session.lastActive}
                    </p>
                  </div>
                  {!session.current && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 shrink-0"
                      disabled={revoking === (session.id ?? String(i))}
                      onClick={() => handleRevokeSession(session.id ?? String(i))}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {ar ? "إلغاء" : "Revoke"}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* MFA Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                {ar ? "المصادقة الثنائية (MFA)" : "Multi-Factor Authentication (MFA)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {ar ? "الحالة:" : "Status:"}{' '}
                    <span className={data?.mfa?.enabled ? 'text-[#0E6C3C]' : 'text-red-500'}>
                      {data?.mfa?.enabled ? (ar ? 'مفعّل' : 'Enabled') : (ar ? 'غير مفعّل' : 'Disabled')}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ar ? "يضيف طبقة حماية إضافية لحسابك" : "Adds an extra layer of protection to your account"}
                  </p>
                </div>
                <Button size="sm" variant={data?.mfa?.enabled ? "destructive" : "default"}
                  className={!data?.mfa?.enabled ? "bg-[#0E6C3C] hover:bg-[#0E6C3C]/90" : ""}>
                  {data?.mfa?.enabled ? (ar ? 'تعطيل' : 'Disable') : (ar ? 'تفعيل' : 'Enable')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-500" />
                {ar ? "تغيير كلمة المرور" : "Change Password"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {ar ? "كلمة المرور الحالية" : "Current Password"}
                </label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {ar ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {ar ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                />
              </div>
              {pwMsg && <p className="text-sm text-[#0E6C3C]">{pwMsg}</p>}
              <Button
                onClick={handleChangePassword}
                disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90"
              >
                {pwSaving ? (ar ? "جارٍ التحديث..." : "Updating...") : (ar ? "تحديث كلمة المرور" : "Update Password")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
