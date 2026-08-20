"use client";

/**
 * NFR-02 / NFR-07 / NFR-08 — Compliance & Governance Admin Page.
 * ===========================================================================
 * Three-tab admin workspace:
 *   1. PDPL Data Residency (NFR-08) — Saudi PDPL controller/processor config
 *   2. WCAG Accessibility Audit (NFR-07) — automated WCAG 2.2 AA checks
 *   3. Data Retention Policies (NFR-02) — tenant-configurable retention rules
 *
 * Admin role only. All mutations are audited.
 */

import { useState } from "react";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Accessibility,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Save,
  RefreshCw,
  FileText,
  Lock,
  UserCheck,
  Mail,
  Phone,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface PdplConfig {
  role: "controller" | "processor" | "both";
  dataRegion: "ksa" | "gcc" | "international";
  crossBorderTransfer: "allowed" | "restricted" | "prohibited";
  allowedDestinations: string[];
  subjectRights: {
    access: boolean;
    rectification: boolean;
    erasure: boolean;
    portability: boolean;
    objection: boolean;
  };
  breachNotification: {
    slaHours: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
  dpo: { name: string; email: string; phone: string };
  processingPurposes: {
    purpose: string;
    legalBasis: string;
    dataCategories: string[];
  }[];
  readinessAssessed: boolean;
  lastAssessedAt: string | null;
}

interface ResidencyStatus {
  compliant: boolean;
  region: string;
  role: string;
  crossBorder: string;
  dpoConfigured: boolean;
  breachNotificationConfigured: boolean;
  readinessAssessed: boolean;
}

interface WcagAuditResult {
  id: string;
  timestamp: string;
  overallScore: number;
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  componentsAudited: string[];
}

interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  enabled: boolean;
  organizationId: string | null;
  lastRunAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Entity type labels
// ─────────────────────────────────────────────────────────────────────────

const ENTITY_LABELS: Record<string, { en: string; ar: string }> = {
  assessment: { en: "Assessment Data", ar: "بيانات التقييم" },
  lecture: { en: "Lecture Packages", ar: "حزم المحاضرات" },
  lecture_source: { en: "Lecture Source Files", ar: "ملفات مصادر المحاضرات" },
  audit_log: { en: "Audit Logs", ar: "سجلات المراجعة" },
  pii: { en: "Personal Identifiable Info", ar: "المعلومات الشخصية" },
  rag_retrieval: { en: "RAG/Retrieval Data", ar: "بيانات الاسترجاع" },
  model_runs: { en: "AI Model Run Logs", ar: "سجلات تشغيل الذكاء الاصطناعي" },
};

const REGION_LABELS: Record<string, { en: string; ar: string }> = {
  ksa: { en: "Saudi Arabia (KSA)", ar: "المملكة العربية السعودية" },
  gcc: { en: "GCC Region", ar: "منطقة مجلس التعاون الخليجي" },
  international: { en: "International", ar: "دولي" },
};

// ─────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────

export default function ComplianceAdminPage() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState<"pdpl" | "wcag" | "retention">("pdpl");

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={ar ? "الامتثال والحوكمة" : "Compliance & Governance"}
        description={
          ar
            ? "إعدادات حوكمة البيانات compliance: إعدادات PDPL، تدقيق WCAG، وسياسات الاحتفاظ بالبيانات."
            : "Data governance compliance: PDPL residency, WCAG accessibility auditing, and tenant data retention policies."
        }
        breadcrumbs={[
          { label: ar ? "الإدارة" : "Admin", href: "/faculty/lecture/admin" },
          { label: ar ? "الامتثال" : "Compliance" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid grid-cols-3 p-1 bg-muted/70 rounded-xl h-auto">
          <TabsTrigger value="pdpl" className="flex items-center gap-2 rounded-lg text-xs font-semibold py-2.5">
            <Globe className="h-4 w-4" /> {ar ? "ndata Residency" : "PDPL Data Residency"}
          </TabsTrigger>
          <TabsTrigger value="wcag" className="flex items-center gap-2 rounded-lg text-xs font-semibold py-2.5">
            <Accessibility className="h-4 w-4" /> {ar ? "WCAG 2.2 AA" : "WCAG 2.2 AA Audit"}
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2 rounded-lg text-xs font-semibold py-2.5">
            <Clock className="h-4 w-4" /> {ar ? "سياسات الاحتفاظ" : "Retention Policies"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdpl">
          <PdplTab ar={ar} />
        </TabsContent>
        <TabsContent value="wcag">
          <WcagTab ar={ar} />
        </TabsContent>
        <TabsContent value="retention">
          <RetentionTab ar={ar} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PDPL Tab
// ─────────────────────────────────────────────────────────────────────────

function PdplTab({ ar }: { ar: boolean }) {
  const { data, isLoading } = useApiQuery<{ config: PdplConfig; residencyStatus: ResidencyStatus }>(
    ["admin", "pdpl"],
    "/api/iscarb/lecture/admin/data-residency",
  );

  const save = useApiMutation<{ config: PdplConfig }, PdplConfig>(
    "/api/iscarb/lecture/admin/data-residency",
    { invalidateKeys: () => [["admin", "pdpl"]] },
  );

  const [form, setForm] = useState<PdplConfig | null>(null);
  const config = form ?? data?.config;
  const status = data?.residencyStatus;

  const handleSave = () => {
    if (config) save.mutate(config);
  };

  if (isLoading || !config) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      {/* Compliance Status Banner */}
      <Card className={`border shadow-lg rounded-2xl overflow-hidden ${
        status?.compliant
          ? "border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 to-white/60"
          : "border-red-200/60 bg-gradient-to-br from-red-50/90 to-white/60"
      }`}>
        <CardContent className="p-6 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${status?.compliant ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {status?.compliant ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">
              {status?.compliant
                ? (ar ? "متوافق مع PDPL" : "PDPL Compliant")
                : (ar ? "غير متوافق مع PDPL — يتطلب مراجعة" : "PDPL Non-Compliant — Review Required")}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ar
                ? `المنطقة: ${REGION_LABELS[status?.region ?? "ksa"]?.ar} | الدور: ${status?.role} | النقل عبر الحدود: ${status?.crossBorder}`
                : `Region: ${REGION_LABELS[status?.region ?? "ksa"]?.en} | Role: ${status?.role} | Cross-border: ${status?.crossBorder}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PDPL Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role & Region */}
        <Card className="border-border/80 bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0F7B8A]" />
              {ar ? "الدور ومنطقة البيانات" : "Role & Data Region"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "دور المنظمة" : "Organization Role"}</Label>
              <Select value={config.role} onValueChange={(v) => setForm({ ...config, role: v as PdplConfig["role"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="controller">{ar ? "مسيطر على البيانات (Controller)" : "Data Controller"}</SelectItem>
                  <SelectItem value="processor">{ar ? "معالج البيانات (Processor)" : "Data Processor"}</SelectItem>
                  <SelectItem value="both">{ar ? "كلاهما" : "Both Controller & Processor"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "منطقةتخزين البيانات" : "Primary Data Region"}</Label>
              <Select value={config.dataRegion} onValueChange={(v) => setForm({ ...config, dataRegion: v as PdplConfig["dataRegion"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ksa">{ar ? "المملكة العربية السعودية" : "Saudi Arabia (KSA)"}</SelectItem>
                  <SelectItem value="gcc">{ar ? "منطقة مجلس التعاون الخليجي" : "GCC Region"}</SelectItem>
                  <SelectItem value="international">{ar ? "دولي" : "International"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "النقل عبر الحدود" : "Cross-Border Data Transfer"}</Label>
              <Select value={config.crossBorderTransfer} onValueChange={(v) => setForm({ ...config, crossBorderTransfer: v as PdplConfig["crossBorderTransfer"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">{ar ? "مسموح" : "Allowed"}</SelectItem>
                  <SelectItem value="restricted">{ar ? "مقيد" : "Restricted"}</SelectItem>
                  <SelectItem value="prohibited">{ar ? "محظور" : "Prohibited"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* DPO & Breach Notification */}
        <Card className="border-border/80 bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#0E6C3C]" />
              {ar ? "مسؤول حماية البيانات وإشعار الاختراق" : "DPO & Breach Notification"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "اسم مسؤول الحماية (DPO)" : "Data Protection Officer Name"}</Label>
              <Input value={config.dpo.name} onChange={(e) => setForm({ ...config, dpo: { ...config.dpo, name: e.target.value } })} placeholder="Dr. ..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input value={config.dpo.email} onChange={(e) => setForm({ ...config, dpo: { ...config.dpo, email: e.target.value } })} placeholder="dpo@university.edu.sa" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1"><Phone className="h-3 w-3" /> {ar ? "الهاتف" : "Phone"}</Label>
              <Input value={config.dpo.phone} onChange={(e) => setForm({ ...config, dpo: { ...config.dpo, phone: e.target.value } })} placeholder="+966..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "ساعة الإشعار عند الاختراق (PDPL Art. 26)" : "Breach Notification SLA (hours, PDPL Art. 26)"}</Label>
              <Input type="number" value={config.breachNotification.slaHours} onChange={(e) => setForm({ ...config, breachNotification: { ...config.breachNotification, slaHours: Number(e.target.value) } })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "جهة اتصال الإشعار" : "Breach Notification Contact"}</Label>
              <Input value={config.breachNotification.contactName} onChange={(e) => setForm({ ...config, breachNotification: { ...config.breachNotification, contactName: e.target.value } })} placeholder="Security Team Lead" />
            </div>
          </CardContent>
        </Card>

        {/* Data Subject Rights */}
        <Card className="border-border/80 bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-600" />
              {ar ? "حقوق صاحب البيانات (PDPL)" : "Data Subject Rights (PDPL)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["access", "rectification", "erasure", "portability", "objection"] as const).map((right) => (
              <div key={right} className="flex items-center justify-between">
                <Label className="text-sm">
                  {right === "access" && (ar ? "الحق في الوصول" : "Right of Access")}
                  {right === "rectification" && (ar ? "الحق في التصحيح" : "Right of Rectification")}
                  {right === "erasure" && (ar ? "الحق في المحو" : "Right of Erasure")}
                  {right === "portability" && (ar ? "الحق في النقل" : "Right of Portability")}
                  {right === "objection" && (ar ? "الحق في الاعتراض" : "Right to Object")}
                </Label>
                <Switch
                  checked={config.subjectRights[right]}
                  onCheckedChange={(v) => setForm({ ...config, subjectRights: { ...config.subjectRights, [right]: v } })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Readiness Assessment */}
        <Card className="border-border/80 bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              {ar ? "تقييم الجاهزية" : "Readiness Assessment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{ar ? "تم تقييم الامتثال" : "Readiness Assessment Completed"}</Label>
              <Switch checked={config.readinessAssessed} onCheckedChange={(v) => setForm({ ...config, readinessAssessed: v })} />
            </div>
            {config.lastAssessedAt && (
              <p className="text-xs text-muted-foreground">
                {ar ? "آخر تقييم:" : "Last assessed:"} {new Date(config.lastAssessedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={save.isPending} className="bg-[#0F7B8A] hover:bg-[#0F7B8A]/90 text-white rounded-xl font-bold shadow-md">
          <Save className="mr-2 h-4 w-4" />
          {save.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ إعدادات PDPL" : "Save PDPL Configuration")}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WCAG Tab
// ─────────────────────────────────────────────────────────────────────────

function WcagTab({ ar }: { ar: boolean }) {
  const { data: auditData, isLoading: auditLoading } = useApiQuery<{ audits: WcagAuditResult[] }>(
    ["admin", "wcag"],
    "/api/iscarb/lecture/admin/wcag-audit",
  );

  const runAudit = useApiMutation<{ audit: WcagAuditResult }, Record<string, never>>(
    "/api/iscarb/lecture/admin/wcag-audit",
    { invalidateKeys: () => [["admin", "wcag"]] },
  );

  const latest = auditData?.audits?.[0];

  return (
    <div className="space-y-6">
      {/* Run Audit Button */}
      <Card className="border-border/80 bg-card rounded-2xl">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">{ar ? "تدقيق WCAG 2.2 AA" : "WCAG 2.2 AA Accessibility Audit"}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {ar
                ? "تشغيل فحص تلقائي لمعايير WCAG 2.2 AA على واجهات النظام."
                : "Run automated WCAG 2.2 AA checks against system interfaces. Results are audited (NFR-07)."}
            </p>
          </div>
          <Button onClick={() => runAudit.mutate({})} disabled={runAudit.isPending} className="bg-[#0F7B8A] hover:bg-[#0F7B8A]/90 text-white rounded-xl font-bold shadow-md">
            <Accessibility className="mr-2 h-4 w-4" />
            {runAudit.isPending ? (ar ? "جاري التدقيق..." : "Auditing...") : (ar ? "تشغيل تدقيق جديد" : "Run New Audit")}
          </Button>
        </CardContent>
      </Card>

      {/* Latest Audit Score */}
      {latest && (
        <Card className="border-border/80 bg-card rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-6">
              {/* Score Ring */}
              <div className="relative h-24 w-24 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="currentColor" className="text-muted/30" />
                  <circle
                    cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                    stroke={latest.overallScore >= 90 ? "#10B981" : latest.overallScore >= 70 ? "#F59E0B" : "#EF4444"}
                    strokeDasharray={`${(latest.overallScore / 100) * 87.96} 87.96`}
                    strokeLinecap="round"
                  />
                  <text x="18" y="20" textAnchor="middle" className="fill-current text-[8px] font-extrabold" transform="rotate(90 18 18)">
                    {latest.overallScore}%
                  </text>
                </svg>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span className="text-emerald-600">✅ {latest.passed} {ar ? "ناجح" : "Passed"}</span>
                  <span className="text-amber-600">⚠️ {latest.warnings} {ar ? "تحذير" : "Warnings"}</span>
                  <span className="text-red-600">❌ {latest.errors} {ar ? "خطأ" : "Errors"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ar ? "آخر تدقيق:" : "Last audit:"} {new Date(latest.timestamp).toLocaleString(ar ? "ar-SA" : "en-US")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ar ? "المكونات المدروسة:" : "Components audited:"} {latest.componentsAudited.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit History */}
      {auditData?.audits && auditData.audits.length > 1 && (
        <Card className="border-border/80 bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display font-bold">{ar ? "سجل التدقيق" : "Audit History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{ar ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="text-xs">{ar ? "النتيجة" : "Score"}</TableHead>
                  <TableHead className="text-xs">{ar ? "ناجح" : "Passed"}</TableHead>
                  <TableHead className="text-xs">{ar ? "تحذير" : "Warnings"}</TableHead>
                  <TableHead className="text-xs">{ar ? "خطأ" : "Errors"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.audits.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs font-mono">{new Date(a.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${a.overallScore >= 90 ? "bg-emerald-100 text-emerald-800" : a.overallScore >= 70 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                        {a.overallScore}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600">{a.passed}</TableCell>
                    <TableCell className="text-xs font-semibold text-amber-600">{a.warnings}</TableCell>
                    <TableCell className="text-xs font-semibold text-red-600">{a.errors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {auditLoading && <Skeleton className="h-64 rounded-2xl" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Retention Tab
// ─────────────────────────────────────────────────────────────────────────

function RetentionTab({ ar }: { ar: boolean }) {
  const { data, isLoading } = useApiQuery<{ policies: RetentionPolicy[] }>(
    ["admin", "retention"],
    "/api/iscarb/lecture/admin/retention",
  );

  const savePolicy = useApiMutation<{ policy: RetentionPolicy }, { entityType: string; retentionDays: number; action: string; enabled: boolean }>(
    "/api/iscarb/lecture/admin/retention",
    { invalidateKeys: () => [["admin", "retention"]] },
  );

  const policies = data?.policies ?? [];

  // Fill in defaults for entity types that don't have policies yet
  const allEntityTypes = Object.keys(ENTITY_LABELS);
  const policyMap = new Map(policies.map((p) => [p.entityType, p]));
  const displayPolicies = allEntityTypes.map((et) => {
    const existing = policyMap.get(et);
    return existing ?? {
      id: `default-${et}`,
      entityType: et,
      retentionDays: et === "audit_log" ? 2555 : et === "pii" ? 90 : 365,
      action: "archive",
      enabled: true,
      organizationId: null,
      lastRunAt: null,
    };
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#0F7B8A]" />
            {ar ? "سياسات الاحتفاظ بالبيانات" : "Data Retention Policies (NFR-02)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            {ar
              ? "تكوين مدة الاحتفاظ لكل نوع بيانات. التغييرات مسجلة في سجل المراجعة."
              : "Configure retention duration for each data entity type. All changes are audited."}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{ar ? "نوع البيانات" : "Entity Type"}</TableHead>
                <TableHead className="text-xs">{ar ? "أيام الاحتفاظ" : "Retention (days)"}</TableHead>
                <TableHead className="text-xs">{ar ? "الإجراء" : "Action"}</TableHead>
                <TableHead className="text-xs">{ar ? "مفعّل" : "Enabled"}</TableHead>
                <TableHead className="text-xs">{ar ? "آخر تشغيل" : "Last Run"}</TableHead>
                <TableHead className="text-xs">{ar ? "حفظ" : "Save"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayPolicies.map((policy) => (
                <RetentionRow key={policy.entityType} policy={policy} ar={ar} onSave={savePolicy.mutate} saving={savePolicy.isPending} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RetentionRow({
  policy,
  ar,
  onSave,
  saving,
}: {
  policy: RetentionPolicy;
  ar: boolean;
  onSave: (data: { entityType: string; retentionDays: number; action: string; enabled: boolean }) => void;
  saving: boolean;
}) {
  const [days, setDays] = useState(policy.retentionDays);
  const [action, setAction] = useState(policy.action);
  const [enabled, setEnabled] = useState(policy.enabled);
  const [dirty, setDirty] = useState(false);

  const label = ENTITY_LABELS[policy.entityType]?.[ar ? "ar" : "en"] ?? policy.entityType;

  return (
    <TableRow>
      <TableCell className="text-xs font-semibold">{label}</TableCell>
      <TableCell>
        <Input
          type="number"
          className="h-8 w-24 text-xs"
          value={days}
          onChange={(e) => { setDays(Number(e.target.value)); setDirty(true); }}
          min={1}
          max={36500}
        />
      </TableCell>
      <TableCell>
        <Select value={action} onValueChange={(v) => { setAction(v); setDirty(true); }}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="archive">{ar ? "أرشفة" : "Archive"}</SelectItem>
            <SelectItem value="delete">{ar ? "حذف" : "Delete"}</SelectItem>
            <SelectItem value="anonymize">{ar ? "تعمية" : "Anonymize"}</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); setDirty(true); }} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground font-mono">
        {policy.lastRunAt ? new Date(policy.lastRunAt).toLocaleDateString() : "—"}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          className={`h-7 text-xs rounded-lg ${dirty ? "bg-[#0F7B8A] text-white" : ""}`}
          disabled={!dirty || saving}
          onClick={() => { onSave({ entityType: policy.entityType, retentionDays: days, action, enabled }); setDirty(false); }}
        >
          <Save className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
