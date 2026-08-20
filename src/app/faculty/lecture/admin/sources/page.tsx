"use client";

import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw, Globe, AlertCircle, CheckCircle2, FileUp, X } from "lucide-react";
import { useState } from "react";

interface SourceSnapshotView {
  id: string;
  sourceKey: string;
  sourceType: string;
  originalLanguage: string;
  originalUrl: string;
  activeSnapshotId: string | null;
  snapshots: {
    id: string;
    url: string;
    language: string;
    retrievedAt: string;
    contentHash: string;
    approvalStatus: string;
    translationStatus: string | null;
  }[];
}

interface SourcesResponse {
  sources: SourceSnapshotView[];
}

function getDaysSinceSync(retrievedAt: string | null): number | null {
  if (!retrievedAt) return null;
  return Math.floor((Date.now() - new Date(retrievedAt).getTime()) / 86_400_000);
}

function getFreshnessConfig(days: number | null, ar: boolean) {
  if (days === null) {
    return {
      color: "text-muted-foreground border-muted-foreground/40",
      label: ar ? "لم تتم المزامنة" : "Never synced",
      icon: "⚠️",
      urgent: true,
    };
  }
  if (days > 90) {
    return {
      color: "text-red-600 dark:text-red-400 border-red-500/40 bg-red-500/10",
      label: ar ? `${days} يوماً — قديم جداً` : `${days}d ago — STALE`,
      icon: "🔴",
      urgent: true,
    };
  }
  if (days > 30) {
    return {
      color: "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10",
      label: ar ? `${days} يوماً — متوسط` : `${days}d ago — aging`,
      icon: "🟡",
      urgent: false,
    };
  }
  return {
    color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    label: ar ? `${days} يوماً — حديث` : `${days}d ago — fresh`,
    icon: "🟢",
    urgent: false,
  };
}

export default function AdminSourcesPage() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [loadOpen, setLoadOpen] = useState<string | null>(null);
  const [loadContent, setLoadContent] = useState("");
  const [loadUrl, setLoadUrl] = useState("");

  const { data, isLoading, error } = useApiQuery<SourcesResponse>(
    ["lecture", "sources"],
    "/api/iscarb/lecture/admin/sources",
  );

  const sync = useApiMutation<{ snapshotId: string; status: string }, { sourceKey: string }>(
    (vars) => `/api/iscarb/lecture/admin/sources/${vars.sourceKey}/sync`,
    { invalidateKeys: () => [["lecture", "sources"]] },
  );

  const approve = useApiMutation<{ snapshotId: string }, { id: string }>(
    (vars) => `/api/iscarb/lecture/admin/source-snapshots/${vars.id}/approve`,
    { invalidateKeys: () => [["lecture", "sources"]] },
  );

  const loadDoc = useApiMutation<{ snapshotId: string; status: string }, { sourceKey: string; content: string; url?: string }>(
    (vars) => `/api/iscarb/lecture/admin/sources/${vars.sourceKey}/snapshots`,
    {
      invalidateKeys: () => [["lecture", "sources"]],
      onSuccess: () => {
        setLoadOpen(null);
        setLoadContent("");
        setLoadUrl("");
      },
    },
  );

  const sources = data?.sources ?? [];

  const staleSources = sources.filter((src) => {
    const active = src.snapshots.find((s) => s.id === src.activeSnapshotId);
    const days = getDaysSinceSync(active?.retrievedAt ?? null);
    return days === null || days > 90;
  });

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={ar ? "المصادر الرسمية الوطنية" : "Official National Sources"}
        description={
          ar
            ? "مزامنة واعتماد لقطات المصادر الرسمية (NCAAA، جاهزية، رؤية 2030) ومراقبة الحداثة النمطية NFR-12."
            : "Sync and approve official source snapshots (NCAAA, Jaheziah, Vision 2030) with NFR-12 freshness indicators."
        }
        breadcrumbs={[
          { label: ar ? "الإدارة" : "Admin", href: "/faculty/lecture/admin" },
          { label: ar ? "المصادر الرسمية" : "Official Sources" },
        ]}
      />

      {/* Global Stale Warning Banner */}
      {staleSources.length > 0 && !isLoading && (
        <Card className="border-red-500/40 bg-red-500/10 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-300 font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p>
              <strong>
                {staleSources.length} {ar ? "مصدر رسمياً بحاجة إلى تحديث (>90 يوماً)" : `source${staleSources.length > 1 ? "s" : ""} stale (>90 days)`}
              </strong>
              .{" "}
              {ar
                ? "حسب معيار NFR-12، سيستخدم النظام اللقطات المعتمدة الأخيرة مع تنبيه قدَم البيانات."
                : "Per NFR-12, system uses last approved snapshot with a visible stale warning in output."}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-64 rounded-2xl" />}

      {error && !isLoading && (
        <Card className="border-red-500/50">
          <CardContent className="p-4 text-sm text-red-500 font-semibold">{error.message}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => {
          const active = s.snapshots.find((sn) => sn.id === s.activeSnapshotId);
          const pending = s.snapshots.find((sn) => sn.approvalStatus === "pending");
          const days = getDaysSinceSync(active?.retrievedAt ?? null);
          const freshness = getFreshnessConfig(days, ar);

          return (
            <Card
              key={s.sourceKey}
              className={cn(
                "border rounded-2xl transition-all shadow-sm",
                freshness.urgent ? "border-red-500/40 bg-red-500/5" : "border-border/80 bg-card"
              )}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-[#0F7B8A] dark:text-[#58CE95] shrink-0" />
                    <span className="font-display text-base font-bold capitalize">{s.sourceKey}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5", freshness.color)}>
                    {freshness.icon} {freshness.label}
                  </Badge>
                </div>

                <p className="break-all font-mono text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
                  {s.originalUrl}
                </p>

                {/* Stale Alert Box */}
                {freshness.urgent && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {days === null
                        ? ar
                          ? "لم يتم مزامنة هذا المصدر بعد. يُرجى المزامنة والاعتماد."
                          : "This source has never been synced. Sync before production use."
                        : ar
                        ? `اللقطة المعتمدة مضى عليها ${days} يوماً (NFR-12).`
                        : `Snapshot is ${days} days old (NFR-12 compliant fallback).`}
                    </span>
                  </div>
                )}

                {/* Snapshots List */}
                {s.snapshots.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {ar ? "اللقطات المعتمدة:" : "Snapshots:"}
                    </p>
                    {s.snapshots.slice(0, 3).map((snap) => (
                      <div key={snap.id} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              snap.id === s.activeSnapshotId ? "bg-emerald-500 shadow-sm" : "bg-muted-foreground/30"
                            )}
                          />
                          <span className="font-mono text-muted-foreground truncate max-w-[120px]">
                            {snap.contentHash.slice(0, 8)}...
                          </span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 capitalize">
                            {snap.approvalStatus}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                          {new Date(snap.retrievedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sync.isPending}
                    onClick={() => sync.mutate({ sourceKey: s.sourceKey })}
                    className="rounded-xl text-xs font-semibold h-9"
                  >
                    <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5 text-[#0F7B8A]", sync.isPending ? "animate-spin" : "")} />
                    {sync.isPending ? (ar ? "جاري المزامنة..." : "Syncing...") : ar ? "مزامنة الآن" : "Sync Now"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setLoadOpen(loadOpen === s.sourceKey ? null : s.sourceKey);
                      setLoadContent("");
                      setLoadUrl("");
                    }}
                    className="rounded-xl text-xs font-semibold h-9"
                  >
                    <FileUp className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    {ar ? "تحميل وثيقة رسمية" : "Load Official Document"}
                  </Button>
                  {pending && (
                    <Button
                      size="sm"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate({ id: pending.id })}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-4 shadow-sm"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      {ar ? "اعتماد اللقطة" : "Approve Pending"}
                    </Button>
                  )}
                </div>

                {/* Manual load form — works even when the official portal blocks
                    automated fetching (Cloudflare/geo). Content is PENDING until
                    approved (AC-17), then parsed into real rows. */}
                {loadOpen === s.sourceKey && (
                  <div className="pt-3 border-t border-border/60 space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                      {ar
                        ? "الصق نص الوثيقة الرسمية (مثال: كل سطر بصيغة «اسم المبادرة | الوصف» لرؤية 2030). ستُحفظ كلقطة قيد الانتظار ثم تعتمدها."
                        : "Paste the official document text (for Vision 2030: one initiative per line as «Name | Description»). It is saved as a pending snapshot, then approved."}
                    </p>
                    <textarea
                      value={loadContent}
                      onChange={(e) => setLoadContent(e.target.value)}
                      rows={5}
                      placeholder={ar ? "الصق نص الوثيقة الرسمية هنا..." : "Paste the official document text here..."}
                      className="w-full p-2.5 text-xs rounded-xl border border-border bg-background font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      value={loadUrl}
                      onChange={(e) => setLoadUrl(e.target.value)}
                      placeholder={ar ? "رابط الوثيقة (اختياري)" : "Document URL (optional)"}
                      className="w-full p-2.5 text-xs rounded-xl border border-border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={loadDoc.isPending || loadContent.trim().length < 20}
                        onClick={() =>
                          loadDoc.mutate({
                            sourceKey: s.sourceKey,
                            content: loadContent.trim(),
                            url: loadUrl.trim() || undefined,
                          })
                        }
                        className="bg-[#0F7B8A] hover:bg-[#0F7B8A]/90 text-white rounded-xl text-xs font-bold h-9"
                      >
                        {loadDoc.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ كلقطة قيد الانتظار" : "Save as Pending Snapshot")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setLoadOpen(null)} className="rounded-xl text-xs h-9">
                        <X className="mr-1 h-3.5 w-3.5" />
                        {ar ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                    {loadDoc.isError && (
                      <p className="text-[11px] text-red-600 font-semibold">{loadDoc.error?.message}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
