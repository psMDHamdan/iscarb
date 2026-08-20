"use client";

import React from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { StatCard } from '@/components/iscarb/StatCard';
import { ActivityTimeline, TimelineEvent } from '@/components/iscarb/ActivityTimeline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, Shield, Fingerprint, Activity, AlertTriangle, Key, Loader2, RefreshCw, Lock, Eye } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useApiQuery } from '@/hooks/use-api-query';
import Link from 'next/link';

interface DashboardResponse {
  success: boolean;
  data: {
    users: {
      total: number;
      byStatus: Record<string, number>;
      byRole: Record<string, number>;
    };
    mfa: {
      enabled: number;
      adoptionRate: number;
    };
    roles: { total: number };
    permissions: { total: number };
    organizations: { total: number };
    audit: { totalEvents: number };
    recentActivity: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string | null;
      category: string;
      severity: string;
      at: string;
    }>;
  };
}

export function AdminDashboardView() {
  const { lang } = useApp();
  const ar = lang === 'ar';

  const { data: rawRes, isLoading, error: queryError, refetch } = useApiQuery<DashboardResponse>(
    ["admin", "dashboard"],
    "/api/v1/admin/dashboard",
  );

  const d = rawRes?.data;
  const stats = {
    totalUsers: d?.users?.total || 0,
    activeUsers: d?.users?.byStatus?.active || 0,
    suspendedUsers: d?.users?.byStatus?.suspended || 0,
    totalRoles: d?.roles?.total || 0,
    totalPermissions: d?.permissions?.total || 0,
    totalOrganizations: d?.organizations?.total || 0,
    mfaAdoption: d?.mfa?.adoptionRate ? Math.round(d.mfa.adoptionRate * 100) : 0,
    totalAuditEvents: d?.audit?.totalEvents || 0,
  };

  const events: TimelineEvent[] = (d?.recentActivity || []).map((log) => ({
    id: log.id,
    title: `${log.action} ${log.entityType}`,
    description: log.entityId ? `ID: ${log.entityId.slice(0, 8)}...` : undefined,
    timestamp: log.at,
    iconColorClass: log.severity === 'critical' ? 'text-red-600' : log.severity === 'warning' ? 'text-amber-600' : 'text-blue-600',
    iconBgClass: log.severity === 'critical' ? 'bg-red-100' : log.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100',
  }));

  const error = queryError ? queryError.message : null;

  const quickActions = [
    { label: ar ? "إدارة المستخدمين" : "Manage Users", icon: Users, href: "/admin/users" },
    { label: ar ? "إدارة الأدوار" : "Manage Roles", icon: Shield, href: "/admin/rbac" },
    { label: ar ? "المنظمات" : "Organizations", icon: Building2, href: "/admin/organization" },
    { label: ar ? "سجل التدقيق" : "Audit Logs", icon: Eye, href: "/admin/audit" },
    { label: ar ? "الإعدادات" : "Settings", icon: Key, href: "/admin/settings" },
    { label: ar ? "الأمان" : "Security", icon: Lock, href: "/admin/security" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <PageHeader title={ar ? "لوحة التحكم" : "Admin Dashboard"} description={ar ? "نظرة عامة على النظام" : "System Administration Overview"} />
        <div className="flex items-center justify-center py-24" role="progressbar" aria-label={ar ? "جاري التحميل" : "Loading"}>
          <Loader2 className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <PageHeader title={ar ? "لوحة التحكم" : "Admin Dashboard"} description={ar ? "نظرة عامة على النظام" : "System Administration Overview"} />
        <Card>
          <CardContent className="py-12 text-center" role="alert">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 relative min-h-[calc(100vh-4rem)] rounded-3xl bg-slate-50/40 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-indigo-100/30 before:via-slate-50/10 before:to-transparent dark:before:from-indigo-900/20 dark:before:via-slate-950/10">
      <PageHeader
        title={ar ? "لوحة التحكم" : "Admin Dashboard"}
        description={ar ? "نظرة عامة على النظام والصلاحيات" : "System Overview — Users, Roles, Security & Activity"}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/" },
          { label: ar ? "الإدارة" : "Admin", href: "/admin" },
          { label: ar ? "لوحة التحكم" : "Dashboard", href: "/admin/dashboard" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Core metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              title={ar ? "إجمالي المستخدمين" : "Total Users"}
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
            />
            <StatCard
              title={ar ? "الأدوار" : "Roles"}
              value={stats.totalRoles.toLocaleString()}
              icon={Shield}
            />
            <StatCard
              title={ar ? "الصلاحيات" : "Permissions"}
              value={stats.totalPermissions.toLocaleString()}
              icon={Key}
            />
            <StatCard
              title={ar ? "المنظمات" : "Organizations"}
              value={stats.totalOrganizations.toLocaleString()}
              icon={Building2}
            />
            <StatCard
              title={ar ? "المصادقة الثنائية" : "MFA Adoption"}
              value={`${stats.mfaAdoption}%`}
              icon={Fingerprint}
              className={stats.mfaAdoption >= 50 ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}
            />
            <StatCard
              title={ar ? "أحداث التدقيق" : "Audit Events"}
              value={stats.totalAuditEvents.toLocaleString()}
              icon={Activity}
            />
          </div>

          {/* User breakdown */}
          {d?.users?.byRole && Object.keys(d.users.byRole).length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-sm text-slate-800 dark:text-slate-200">
                {ar ? "توزيع المستخدمين حسب الدور" : "Users by Role"}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(d.users.byRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/50 rounded-xl">
                    <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">{role}</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-sm text-slate-800 dark:text-slate-200">{ar ? "إجراءات سريعة" : "Admin Shortcuts"}</h3>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 text-sm font-medium rounded-xl flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm">
                    <action.icon className="w-4 h-4" /> {action.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="space-y-6">
          <ActivityTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
