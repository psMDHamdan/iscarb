"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import {
  Palette,
  Languages,
  GraduationCap,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  Hash,
  FileCode,
  AlertTriangle,
  Trash2,
  Eye,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_VISUAL_PROFILE,
  DEFAULT_LANGUAGE_PROFILE,
  DEFAULT_INSTITUTIONAL_PROFILE,
  DEFAULT_SOURCE_PROFILE,
} from "@/lib/lecture/profile-governance";

type ProfileType = "visual" | "language" | "institutional" | "source";

interface ProfileVersionView {
  id: string;
  tenantId: string;
  profileType: ProfileType;
  version: number;
  status: "draft" | "active" | "archived";
  effectiveAt: string | null;
  createdBy: string;
  createdAt: string;
  schema: Record<string, any>;
  profileHash?: string;
}

interface ProfilesResponse {
  versions: ProfileVersionView[];
}

const TAB_CONFIG: {
  key: ProfileType;
  labelEn: string;
  labelAr: string;
  icon: any;
  descriptionEn: string;
  descriptionAr: string;
}[] = [
  {
    key: "visual",
    labelEn: "Visual Themes",
    labelAr: "السمات المرئية",
    icon: Palette,
    descriptionEn: "Palette, typography, geometry, and institutional branding.",
    descriptionAr: "لوحة الألوان، الخطوط، الأبعاد، والهوية المؤسسية.",
  },
  {
    key: "language",
    labelEn: "Language Policy",
    labelAr: "السياسة اللغوية",
    icon: Languages,
    descriptionEn: "Bilingual rendering, Arabic font scaling, and official terminology glossaries.",
    descriptionAr: "العرض ثنائي اللغة، مقياس الخط العربي، ومعاجم المصطلحات المعتمدة.",
  },
  {
    key: "institutional",
    labelEn: "Pedagogy & Bloom",
    labelAr: "البيداغوجيا وبلوم",
    icon: GraduationCap,
    descriptionEn: "NCAAA accreditation alignment, Bloom's cognitive distribution, and gate strictness.",
    descriptionAr: "المواءمة مع معايير هيئة الاعتماد، توزيع مستويات بلوم، وبوابات التدقيق.",
  },
  {
    key: "source",
    labelEn: "Source Governance",
    labelAr: "حوكمة المصادر",
    icon: ShieldCheck,
    descriptionEn: "Allowed national domains, snapshot synchronization intervals, and freshness rules.",
    descriptionAr: "النطاقات الوطنية المصرحة، فترات المزامنة، وقواعد حداثة المحتوى.",
  },
];

export default function AdminConfigPage() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState<ProfileType>("visual");

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [viewJsonDialogOpen, setViewJsonDialogOpen] = useState(false);
  const [targetProfile, setTargetProfile] = useState<ProfileVersionView | null>(null);
  const [activationReason, setActivationReason] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // New Draft Form State
  const [draftType, setDraftType] = useState<ProfileType>("visual");
  const [draftName, setDraftName] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");
  const [formPalette, setFormPalette] = useState({
    primary: "#0E6C3C",
    secondary: "#1E293B",
    accent: "#0F7B8A",
    background: "#F8FAFC",
    text: "#0F172A",
  });
  const [formTypography, setFormTypography] = useState({
    fontEnglish: "Inter",
    fontArabic: "Cairo",
    titleFontSizePt: 32,
    bodyFontSizePt: 24,
  });
  const [formBloom, setFormBloom] = useState({
    remember: 10,
    understand: 20,
    apply: 35,
    analyze: 25,
    evaluate: 10,
    create: 0,
  });
  const [formDomains, setFormDomains] = useState<string[]>([
    "*.gov.sa",
    "*.edu.sa",
    "etec.gov.sa",
    "ncaaa.gov.sa",
    "vision2030.gov.sa",
  ]);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [formTerms, setFormTerms] = useState<Array<{ en: string; ar: string }>>([
    { en: "Learning Outcome", ar: "مخرج التعلم" },
    { en: "Assessment", ar: "تقييم" },
    { en: "Prerequisite", ar: "متطلب سابق" },
  ]);
  const [newTermEn, setNewTermEn] = useState("");
  const [newTermAr, setNewTermAr] = useState("");

  // Queries & Mutations
  const { data, isLoading, error } = useApiQuery<ProfilesResponse>(
    ["lecture", "profiles"],
    "/api/iscarb/lecture/admin/profiles"
  );

  const createMutation = useApiMutation<
    { version: ProfileVersionView },
    { profileType: ProfileType; schema: Record<string, unknown>; notes?: string }
  >("/api/iscarb/lecture/admin/profiles", {
    invalidateKeys: () => [["lecture", "profiles"]],
    onSuccess: () => {
      setCreateModalOpen(false);
      resetDraftForm();
    },
  });

  const patchMutation = useApiMutation<
    { version: ProfileVersionView },
    { id: string; status?: string; schema?: Record<string, unknown>; reason?: string }
  >((vars) => `/api/iscarb/lecture/admin/profiles/${vars.id}`, {
    method: "PATCH",
    invalidateKeys: () => [["lecture", "profiles"]],
    onSuccess: () => {
      setActivateDialogOpen(false);
      setTargetProfile(null);
      setActivationReason("");
    },
  });

  const deleteMutation = useApiMutation<
    { ok: boolean },
    { id: string }
  >((vars) => `/api/iscarb/lecture/admin/profiles/${vars.id}`, {
    method: "DELETE",
    invalidateKeys: () => [["lecture", "profiles"]],
  });

  const versions = data?.versions ?? [];
  const tabVersions = versions.filter((v) => v.profileType === activeTab);
  const activeVersion = tabVersions.find((v) => v.status === "active");

  const totalActiveCount = TAB_CONFIG.reduce((acc, tab) => {
    const hasActive = versions.some((v) => v.profileType === tab.key && v.status === "active");
    return acc + (hasActive ? 1 : 0);
  }, 0);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const resetDraftForm = () => {
    setDraftName("");
    setDraftNotes("");
    setRawJsonMode(false);
    setRawJsonText("");
  };

  const openCreateModalForTab = (type: ProfileType) => {
    setDraftType(type);
    setDraftName(ar ? `إصدار مخصص - ${type}` : `Custom ${type} Profile`);
    if (type === "visual") {
      setRawJsonText(JSON.stringify(DEFAULT_VISUAL_PROFILE, null, 2));
    } else if (type === "language") {
      setRawJsonText(JSON.stringify(DEFAULT_LANGUAGE_PROFILE, null, 2));
    } else if (type === "institutional") {
      setRawJsonText(JSON.stringify(DEFAULT_INSTITUTIONAL_PROFILE, null, 2));
    } else {
      setRawJsonText(JSON.stringify(DEFAULT_SOURCE_PROFILE, null, 2));
    }
    setCreateModalOpen(true);
  };

  const submitCreateDraft = () => {
    let schemaObj: Record<string, unknown> = {};
    if (rawJsonMode) {
      try {
        schemaObj = JSON.parse(rawJsonText);
      } catch {
        alert(ar ? "صيغة JSON غير صالحة" : "Invalid JSON syntax");
        return;
      }
    } else {
      if (draftType === "visual") {
        schemaObj = {
          name: draftName || "Custom Visual Profile",
          palette: formPalette,
          typography: formTypography,
          geometry: { aspectRatio: "16:9", slideWidthInches: 10, slideHeightInches: 7.5 },
          branding: { logoPosition: "top-right", watermarkText: "iSCARB Institutional" },
        };
      } else if (draftType === "language") {
        const dict: Record<string, string> = {};
        formTerms.forEach((t) => {
          if (t.en.trim()) dict[t.en.trim()] = t.ar.trim();
        });
        schemaObj = {
          name: draftName || "Custom Language Policy",
          defaultLanguage: "en",
          policy: "bilingual",
          bilingualMode: "parallel",
          terminologyDictionary: dict,
          arabicFontScale: 1.15,
        };
      } else if (draftType === "institutional") {
        schemaObj = {
          name: draftName || "Custom Institutional Framework",
          framework: "Bloom_Revised_2001",
          bloomDistributionTargets: formBloom,
          minimumHigherOrderPercent: 35,
          gateEnforcement: { strictErrorBlocking: true },
        };
      } else {
        schemaObj = {
          name: draftName || "Custom Source Governance",
          allowedDomains: formDomains,
          syncIntervalHours: 24,
          staleThresholdDays: 90,
        };
      }
    }

    createMutation.mutate({
      profileType: draftType,
      schema: schemaObj,
      notes: draftNotes || undefined,
    });
  };

  const triggerActivate = (profile: ProfileVersionView) => {
    setTargetProfile(profile);
    setActivationReason("");
    setActivateDialogOpen(true);
  };

  const confirmActivate = () => {
    if (!targetProfile) return;
    patchMutation.mutate({
      id: targetProfile.id,
      status: "active",
      reason: activationReason.trim() || undefined,
    });
  };

  const bloomTotal = Object.values(formBloom).reduce((a, b) => a + b, 0);
  const higherOrderTotal =
    formBloom.apply + formBloom.analyze + formBloom.evaluate + formBloom.create;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          ar
            ? "إدارة الملفات المؤسسية والحوكمة (FR-013)"
            : "Institutional Profile Governance (FR-013)"
        }
        description={
          ar
            ? "إدارة إصدارات السياسات البيداغوجية، السمات المرئية، المعاجم اللغوية، والمصادر المعتمدة مع توثيق البصمة التشفيرية SHA-256 وسجل التدقيق غير القابل للتعديل."
            : "Manage versioned pedagogical, visual, language, and source policies with deterministic SHA-256 fingerprints and immutable governance audit trails."
        }
        breadcrumbs={[
          { label: ar ? "لوحة التحكم" : "Dashboard", href: "/faculty" },
          { label: ar ? "مجمّع المحاضرات" : "Lecture Compiler", href: "/faculty/lecture" },
          { label: ar ? "الحوكمة والإدارة" : "Profile Governance" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/faculty/lecture/admin/compliance"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#0F7B8A]/30 bg-white/80 hover:bg-[#0F7B8A]/5 text-[#0F7B8A] text-xs font-bold transition-all shadow-sm"
            >
              <Shield className="h-4 w-4" />
              {ar ? "الامتثال والحوكمة" : "Compliance & Governance"}
            </Link>
            <Button
              onClick={() => openCreateModalForTab(activeTab)}
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Plus className="h-4 w-4" />
              {ar ? "إنشاء مسودة إصدار جديدة" : "Create New Draft Version"}
            </Button>
          </div>
        }
      />

      {/* KPI & Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "الملفات النشطة المعتمدة" : "Active Profile Domains"}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                {totalActiveCount} / 4
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalActiveCount === 4
                  ? ar
                    ? "جميع المجالات مكتملة"
                    : "All 4 domains configured"
                  : ar
                    ? "يتم استخدام التكوين الافتراضي للناقص"
                    : "Defaults active for missing"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "حالة الحوكمة والنزاهة" : "Governance Enforcement"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground">
                  {ar ? "مطبقة وغير قابلة للتعديل" : "Enforced & Immutable"}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {ar ? "رمز الحالة 409 عند محاولة تعديل المعتمد" : "HTTP 409 locked on active"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "إجمالي الإصدارات المسجلة" : "Total Tracked Versions"}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{versions.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {ar ? "عبر جميع مجالات الحوكمة الأربعة" : "Across 4 governance domains"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "تثبيت النشر التشفيري" : "Cryptographic Binding"}
              </p>
              <div className="flex items-center gap-1 mt-1 font-mono text-xs font-bold text-foreground">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span>SHA-256 Locked</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {ar ? "مطابقة تامة لشهادات الاعتماد" : "Exact match on package export"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <Skeleton className="h-72 rounded-xl" />}

      {error && !isLoading && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ProfileType)}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 p-1 bg-muted/70 rounded-xl h-auto">
          {TAB_CONFIG.map((t) => {
            const IconComp = t.icon;
            return (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="flex items-center gap-2 py-2.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs"
              >
                <IconComp className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-sm">
                  {ar ? t.labelAr : t.labelEn}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TAB_CONFIG.map((tab) => {
          const tabKey = tab.key;
          const currentTabVersions = versions.filter((v) => v.profileType === tabKey);
          const currentActive = currentTabVersions.find((v) => v.status === "active");

          return (
            <TabsContent key={tabKey} value={tabKey} className="space-y-6">
              {/* Tab Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {ar ? tab.labelAr : tab.labelEn}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ar ? tab.descriptionAr : tab.descriptionEn}
                  </p>
                </div>
                <Button
                  onClick={() => openCreateModalForTab(tabKey)}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  {ar ? "إضافة مسودة جديدة" : "New Draft"}
                </Button>
              </div>

              {/* Active Profile Snapshot Highlight */}
              {currentActive ? (
                <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-xs">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white gap-1.5 font-semibold py-1 px-2.5">
                          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                          {ar ? "الإصدار النشط حالياً" : "Current Active Version"}
                        </Badge>
                        <Badge variant="outline" className="font-mono font-bold text-xs">
                          v{currentActive.version}
                        </Badge>
                        {currentActive.effectiveAt && (
                          <span className="text-xs text-muted-foreground">
                            {ar ? "ساري منذ" : "Effective since"}{" "}
                            {new Date(currentActive.effectiveAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {currentActive.profileHash && (
                        <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 py-1">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span
                            className="font-mono text-xs text-muted-foreground select-all"
                            title={currentActive.profileHash}
                          >
                            {currentActive.profileHash.slice(0, 10)}...
                            {currentActive.profileHash.slice(-6)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 p-0 hover:bg-muted"
                            onClick={() => handleCopyHash(currentActive.profileHash!)}
                            title="Copy SHA-256"
                          >
                            {copiedHash === currentActive.profileHash ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {ar ? "تم الإنشاء بواسطة" : "Created by"} {currentActive.createdBy} ·{" "}
                        {new Date(currentActive.createdAt).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1.5 text-emerald-700 dark:text-emerald-400"
                        onClick={() => {
                          setTargetProfile(currentActive);
                          setViewJsonDialogOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {ar ? "معاينة بنية المخطط (JSON)" : "Inspect Full Schema"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-500/40 bg-amber-500/5 shadow-xs">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {ar
                            ? "يتم استخدام التكوين الافتراضي للنظام"
                            : "Running on Platform System Default"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ar
                            ? "لم يتم تفعيل إصدار مخصص بعد لهذه المؤسسة. يتم تطبيق المعايير الوطنية تلقائياً."
                            : "No custom version is currently active. Standard national defaults are applied."}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openCreateModalForTab(tabKey)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {ar ? "إنشاء إصدار مؤسسي مخصص" : "Create Custom Version"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Version History Table / List */}
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">
                    {ar ? "سجل الإصدارات وحالاتها" : "Version History & Lifecycle"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {ar
                      ? "قائمة بجميع المسودات، الإصدارات المعتمدة النشطة، والإصدارات المؤرشفة تاريخياً."
                      : "Complete ledger of drafts, active policies, and archived historical versions."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {currentTabVersions.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      {ar
                        ? "لا توجد إصدارات مسجلة بعد لهذا المجال."
                        : "No versions recorded yet for this domain."}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">{ar ? "الإصدار" : "Version"}</TableHead>
                          <TableHead className="w-36">{ar ? "الحالة" : "Status"}</TableHead>
                          <TableHead>{ar ? "بصمة التشفير (SHA-256)" : "SHA-256 Fingerprint"}</TableHead>
                          <TableHead>{ar ? "المنشئ والتاريخ" : "Author & Date"}</TableHead>
                          <TableHead className="text-end">{ar ? "الإجراءات" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentTabVersions.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono font-bold text-xs">
                                v{v.version}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {v.status === "active" ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 font-semibold py-0.5 px-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {ar ? "نشط (معتمد)" : "Active"}
                                </Badge>
                              ) : v.status === "draft" ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 font-semibold py-0.5 px-2"
                                >
                                  {ar ? "مسودة" : "Draft"}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-muted/50 text-muted-foreground border-border/40 py-0.5 px-2"
                                >
                                  {ar ? "مؤرشف" : "Archived"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {v.profileHash ? (
                                <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                  <span>
                                    {v.profileHash.slice(0, 8)}...{v.profileHash.slice(-6)}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 hover:bg-muted"
                                    onClick={() => handleCopyHash(v.profileHash!)}
                                    title="Copy SHA-256"
                                  >
                                    {copiedHash === v.profileHash ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">{v.createdBy}</p>
                                <p>{new Date(v.createdAt).toLocaleDateString()}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => {
                                    setTargetProfile(v);
                                    setViewJsonDialogOpen(true);
                                  }}
                                  title={ar ? "معاينة المخطط" : "Inspect Schema"}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>

                                {v.status === "draft" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2.5 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                                      onClick={() => triggerActivate(v)}
                                      disabled={patchMutation.isPending}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      {ar ? "تفعيل" : "Activate"}
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-2 text-xs text-red-600 hover:bg-red-500/10"
                                      onClick={() => deleteMutation.mutate({ id: v.id })}
                                      disabled={deleteMutation.isPending}
                                      title={ar ? "حذف المسودة" : "Delete Draft"}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}

                                {v.status === "active" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 text-xs text-muted-foreground hover:bg-muted"
                                    onClick={() =>
                                      patchMutation.mutate({
                                        id: v.id,
                                        status: "archived",
                                        reason: "Manual archival by admin",
                                      })
                                    }
                                    disabled={patchMutation.isPending}
                                  >
                                    {ar ? "أرشفة" : "Archive"}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* =================================================================== */}
      {/* 1. Create Profile Draft Dialog */}
      {/* =================================================================== */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {ar ? "إنشاء مسودة إصدار حوكمة جديدة" : "Create New Governance Profile Draft"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar
                ? "سيتم حفظ هذا الإصدار كمسودة قابلة للمعاينة والتعديل قبل اعتماده وتفعيله رسمياً."
                : "This version will be saved as an editable draft before official review and activation."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "مجال الحوكمة" : "Profile Domain"}</Label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize text-xs px-2.5 py-1 font-semibold">
                    {draftType}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="draft-name" className="text-xs">
                  {ar ? "اسم الإصدار أو الوصف" : "Profile Name / Identifier"}
                </Label>
                <Input
                  id="draft-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. KFU College of CS 2026"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="draft-notes" className="text-xs">
                {ar ? "ملاحظات التغيير والهدف" : "Change Notes & Objective"}
              </Label>
              <Input
                id="draft-notes"
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder={
                  ar
                    ? "مثال: تحديث لوحة الألوان وتعديل معجم الذكاء الاصطناعي"
                    : "e.g. Updated primary branding color & added AI terminology"
                }
                className="h-8 text-xs"
              />
            </div>

            {/* Mode Toggle: Visual Form vs Raw JSON */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {ar ? "محرر المخطط المتقدم (Raw JSON)" : "Advanced JSON Schema Editor"}
                </span>
              </div>
              <Switch checked={rawJsonMode} onCheckedChange={setRawJsonMode} />
            </div>

            {rawJsonMode ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-mono">{ar ? "بنية المخطط JSON" : "JSON Schema Payload"}</Label>
                <Textarea
                  value={rawJsonText}
                  onChange={(e) => setRawJsonText(e.target.value)}
                  rows={10}
                  className="font-mono text-xs leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-4 border border-border/60 rounded-xl p-4 bg-muted/20">
                {draftType === "visual" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-foreground">
                      {ar ? "تخصيص لوحة الألوان الأساسية" : "Palette Customization"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Primary Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={formPalette.primary}
                            onChange={(e) =>
                              setFormPalette({ ...formPalette, primary: e.target.value })
                            }
                            className="h-7 w-7 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={formPalette.primary}
                            onChange={(e) =>
                              setFormPalette({ ...formPalette, primary: e.target.value })
                            }
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Secondary Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={formPalette.secondary}
                            onChange={(e) =>
                              setFormPalette({ ...formPalette, secondary: e.target.value })
                            }
                            className="h-7 w-7 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={formPalette.secondary}
                            onChange={(e) =>
                              setFormPalette({ ...formPalette, secondary: e.target.value })
                            }
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Accent Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={formPalette.accent}
                            onChange={(e) =>
                              setFormPalette({ ...formPalette, accent: e.target.value })
                            }
                            className="h-7 w-7 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={formPalette.accent}
                            onChange={(e) =>
                              setFormPalette({ ...formPalette, accent: e.target.value })
                            }
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {draftType === "language" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-foreground">
                      {ar ? "معجم المصطلحات المعتمدة" : "Terminology Dictionary"}
                    </p>
                    <div className="space-y-2">
                      {formTerms.map((term, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={term.en}
                            readOnly
                            className="h-7 text-xs bg-background flex-1"
                          />
                          <span className="text-xs text-muted-foreground">↔</span>
                          <Input
                            value={term.ar}
                            readOnly
                            className="h-7 text-xs bg-background flex-1"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() =>
                              setFormTerms(formTerms.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          placeholder="English term"
                          value={newTermEn}
                          onChange={(e) => setNewTermEn(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          placeholder="الترجمة العربية"
                          value={newTermAr}
                          onChange={(e) => setNewTermAr(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            if (newTermEn && newTermAr) {
                              setFormTerms([
                                ...formTerms,
                                { en: newTermEn, ar: newTermAr },
                              ]);
                              setNewTermEn("");
                              setNewTermAr("");
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" /> {ar ? "إضافة" : "Add"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {draftType === "institutional" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">
                        {ar ? "توزيع مستويات بلوم (%)" : "Bloom's Cognitive Distribution (%)"}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          bloomTotal === 100
                            ? "border-emerald-500 text-emerald-600"
                            : "border-red-500 text-red-600"
                        }
                      >
                        Total: {bloomTotal}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(["remember", "understand", "apply", "analyze", "evaluate", "create"] as const).map(
                        (level) => (
                          <div key={level}>
                            <Label className="text-[11px] capitalize text-muted-foreground">
                              {level}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={formBloom[level]}
                              onChange={(e) =>
                                setFormBloom({
                                  ...formBloom,
                                  [level]: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="h-7 text-xs mt-1"
                            />
                          </div>
                        )
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                      <span>
                        {ar ? "المستويات العليا (تطبيق + تحليل + تقييم + ابتكار):" : "Higher-Order (Apply+Analyze+Evaluate+Create):"}
                      </span>
                      <span className="font-bold text-foreground">{higherOrderTotal}% (Min 35%)</span>
                    </div>
                  </div>
                )}

                {draftType === "source" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-foreground">
                      {ar ? "قائمة النطاقات المصرحة" : "Allowed Domain Whitelist"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {formDomains.map((dom, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="font-mono text-xs gap-1.5 py-1 px-2"
                        >
                          {dom}
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-red-500"
                            onClick={() =>
                              setFormDomains(formDomains.filter((_, idx) => idx !== i))
                            }
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        placeholder="*.gov.sa"
                        value={newDomainInput}
                        onChange={(e) => setNewDomainInput(e.target.value)}
                        className="h-7 text-xs font-mono flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          if (newDomainInput.trim()) {
                            setFormDomains([...formDomains, newDomainInput.trim()]);
                            setNewDomainInput("");
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" /> {ar ? "إضافة نطاق" : "Add Domain"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={submitCreateDraft}
              disabled={createMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {createMutation.isPending
                ? ar
                  ? "جاري الحفظ..."
                  : "Saving..."
                : ar
                  ? "حفظ المسودة"
                  : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* 2. Mandatory Audit Justification Activation Dialog */}
      {/* =================================================================== */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              {ar ? "تأكيد اعتماد وتفعيل الإصدار" : "Confirm Profile Activation"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar
                ? "سيصبح هذا الإصدار نشطاً على مستوى المؤسسة بالكامل، وسيتم إقفاله ضد أي تعديل تشفيري لاحقاً."
                : "Activating this profile applies it tenant-wide and locks its schema into immutable cryptographic state."}
            </DialogDescription>
          </DialogHeader>

          {targetProfile && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {ar ? "تنبيه الحوكمة الإلزامية:" : "Mandatory Governance Notice:"}
                </p>
                <p>
                  {ar
                    ? "سيتم أرشفة الإصدار النشط السابق تلقائياً في معاملة ذرية واحدة وتسجيل هذا الإجراء في سجل التدقيق."
                    : "The previous active version will be atomically archived and permanently audited in the governance ledger."}
                </p>
              </div>

              <div className="text-xs space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{ar ? "المجال:" : "Domain:"}</span>
                  <span className="font-bold capitalize">{targetProfile.profileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{ar ? "الإصدار:" : "Version:"}</span>
                  <span className="font-mono font-bold">v{targetProfile.version}</span>
                </div>
                {targetProfile.profileHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">SHA-256:</span>
                    <span className="font-mono text-[11px]">
                      {targetProfile.profileHash.slice(0, 10)}...
                      {targetProfile.profileHash.slice(-6)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="activation-reason" className="text-xs font-semibold">
                  {ar
                    ? "سبب التفعيل وتبرير الاعتماد (إلزامي للتدقيق):"
                    : "Audit Justification / Approval Reason:"}
                </Label>
                <Textarea
                  id="activation-reason"
                  rows={3}
                  value={activationReason}
                  onChange={(e) => setActivationReason(e.target.value)}
                  placeholder={
                    ar
                      ? "مثال: اعتماد مجلس الكلية لتحديث اللائحة الأكاديمية للفصل الدراسي القادم"
                      : "e.g. Approved by Academic Council for Fall 2026 semester rollout"
                  }
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivateDialogOpen(false)}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={confirmActivate}
              disabled={patchMutation.isPending || !activationReason.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {patchMutation.isPending
                ? ar
                  ? "جاري التفعيل..."
                  : "Activating..."
                : ar
                  ? "تأكيد وتفعيل"
                  : "Confirm & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* 3. View Schema JSON Dialog */}
      {/* =================================================================== */}
      <Dialog open={viewJsonDialogOpen} onOpenChange={setViewJsonDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-muted-foreground" />
              {ar ? "معاينة بنية المخطط التشفيرية" : "Inspect Profile Schema Payload"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {targetProfile && (
                <span>
                  {targetProfile.profileType} · v{targetProfile.version} ({targetProfile.status})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {targetProfile && (
            <div className="flex-1 overflow-y-auto space-y-3 py-2">
              {targetProfile.profileHash && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <span className="font-mono text-muted-foreground">SHA-256 Fingerprint:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold select-all">
                      {targetProfile.profileHash}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => handleCopyHash(targetProfile.profileHash!)}
                    >
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )}
              <pre className="p-3 rounded-lg bg-muted/30 border border-border/60 font-mono text-xs leading-relaxed overflow-x-auto select-all">
                {JSON.stringify(targetProfile.schema, null, 2)}
              </pre>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewJsonDialogOpen(false)}
            >
              {ar ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
