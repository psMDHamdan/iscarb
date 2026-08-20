"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Shield,
  Database,
  Server,
  Activity,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Key,
  Globe,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalOrganizations: number;
  totalStudents: number;
  totalFaculty: number;
  mfaAdoption: number;
  systemHealth: string;
}

export function SuperAdminDashboardView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useApiQuery<any>(
    ["superadmin", "users-stats"],
    "/api/v1/users/stats",
  );
  const { data: identityData, isLoading: identityLoading, error: identityError, refetch: refetchIdentity } = useApiQuery<any>(
    ["superadmin", "identity"],
    "/api/v1/analytics/identity",
  );

  const loading = usersLoading && identityLoading;
  const error = usersError?.message ?? identityError?.message ?? null;

  const stats: SystemStats = {
    totalUsers: usersData?.data?.totalUsers || identityData?.data?.users?.total || 0,
    totalOrganizations: usersData?.data?.totalOrganizations || 0,
    totalStudents: usersData?.data?.totalStudents || 0,
    totalFaculty: usersData?.data?.totalFaculty || 0,
    mfaAdoption: identityData?.data?.mfa?.adoptionRate ? Math.round(identityData.data.mfa.adoptionRate * 100) : 0,
    systemHealth: "Operational",
  };

  const adminModules = [
    { icon: Users, label: ar ? "المستخدمين" : "Users", href: "/superadmin/tenants", color: "text-blue-500", stat: stats?.totalUsers || 0 },
    { icon: Building2, label: ar ? "المؤسسات" : "Tenants", href: "/superadmin/tenants", color: "text-[#0E6C3C]", stat: stats?.totalOrganizations || 0 },
    { icon: Shield, label: ar ? "الأمان" : "Security", href: "/superadmin/security", color: "text-red-500", stat: `${stats?.mfaAdoption || 0}% MFA` },
    { icon: Database, label: ar ? "قاعدة البيانات" : "Database", href: "/superadmin/database", color: "text-purple-500", stat: ar ? "متصل" : "Connected" },
    { icon: Server, label: ar ? "البنية التحتية" : "Infrastructure", href: "/superadmin/infrastructure", color: "text-amber-500", stat: stats?.systemHealth || "OK" },
    { icon: Key, label: ar ? "مفاتيح API" : "API Keys", href: "/superadmin/api-keys", color: "text-teal-500", stat: "" },
    { icon: Activity, label: ar ? "سجل التدقيق" : "Audit Log", href: "/superadmin/audit", color: "text-orange-500", stat: "" },
    { icon: Globe, label: ar ? "بوابة AI" : "AI Gateway", href: "/superadmin/ai-gateway", color: "text-indigo-500", stat: "" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title={ar ? "لوحة التحكم العليا" : "SuperAdmin Dashboard"} description={ar ? "إدارة النظام على مستوى المنصة" : "Platform-wide system administration"} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title={ar ? "لوحة التحكم العليا" : "SuperAdmin Dashboard"} description={ar ? "إدارة النظام على مستوى المنصة" : "Platform-wide system administration"} />
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { refetchUsers(); refetchIdentity(); }}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={ar ? "لوحة التحكم العليا" : "SuperAdmin Dashboard"}
        description={ar ? "إدارة النظام على مستوى المنصة" : "Platform-wide system administration"}
      />

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{ar ? "إجمالي المستخدمين" : "Total Users"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0E6C3C]/10"><Building2 className="h-5 w-5 text-[#0E6C3C]" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalOrganizations || 0}</p>
                <p className="text-xs text-muted-foreground">{ar ? "المؤسسات" : "Organizations"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><Shield className="h-5 w-5 text-purple-500" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.mfaAdoption || 0}%</p>
                <p className="text-xs text-muted-foreground">{ar ? "اعتماد MFA" : "MFA Adoption"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><Server className="h-5 w-5 text-amber-500" /></div>
              <div>
                <p className="text-2xl font-bold text-[#0E6C3C]">{stats?.systemHealth || "OK"}</p>
                <p className="text-xs text-muted-foreground">{ar ? "حالة النظام" : "System Health"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules */}
      <Card>
        <CardHeader><CardTitle>{ar ? "إدارة النظام" : "System Management"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {adminModules.map((mod) => (
              <Link key={mod.href} href={mod.href}>
                <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group">
                  <mod.icon className={`h-5 w-5 ${mod.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{mod.label}</p>
                    {mod.stat && <p className="text-xs text-muted-foreground">{mod.stat}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
