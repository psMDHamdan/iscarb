"use client";

import { useState } from "react";
import {
  HandCoins, ExternalLink, Bookmark, BookmarkCheck, Loader2,
  GraduationCap, Rocket, Briefcase,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface FundingProgram {
  id: string;
  code: string;
  provider: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: string;
  stage: string;
  sector: string | null;
  amountNote: string;
  url: string;
  saved: { status: string; notes: string | null } | null;
}
interface FundingResponse {
  programs: FundingProgram[];
  total: number;
}

const STAGE_ICON: Record<string, typeof GraduationCap> = {
  student: GraduationCap,
  graduate: Briefcase,
  entrepreneur: Rocket,
};
const STAGE_LABEL: Record<string, { en: string; ar: string }> = {
  student: { en: "While you're studying", ar: "أثناء دراستك" },
  graduate: { en: "After graduation", ar: "بعد التخرّج" },
  entrepreneur: { en: "Starting a company", ar: "تأسيس مشروع" },
};
const STATUS_OPTIONS = ["saved", "applied", "received", "rejected"] as const;
const STATUS_LABEL: Record<string, { en: string; ar: string }> = {
  saved: { en: "Saved", ar: "محفوظ" },
  applied: { en: "Applied", ar: "تم التقديم" },
  received: { en: "Received", ar: "تم الحصول عليه" },
  rejected: { en: "Not this time", ar: "لم يُقبل" },
};

/**
 * Government Funding Tracker (P2): a curated, VERIFIED catalogue of real
 * Saudi support programmes — HRDF (Hafiz/Tamheer/Doroob), Badir, Monsha'at,
 * SVC, Wa'ed Ventures — see scripts/seed.ts for sourcing. Grouped by life
 * stage so a first-year sees training stipends while a founder sees venture
 * capital, not a flat undifferentiated list.
 */
export function FundingView() {
  const { ar } = useI18n();
  const { selectedStudentId } = useApp();
  const sid = selectedStudentId;
  const [stage, setStage] = useState<string>("all");

  const path = `/api/iscarb/funding${sid ? `?studentId=${sid}` : ""}`;
  const { data, isLoading } = useApiQuery<FundingResponse>(["funding", sid ?? ""], path);

  const track = useApiMutation<{ ok: boolean }, { studentId: string; programId: string; action: string; status?: string }>(
    "/api/iscarb/funding",
    { invalidateKeys: (vars) => [["funding", vars.studentId]] },
  );

  const programs = data?.programs ?? [];
  const filtered = stage === "all" ? programs : programs.filter((p) => p.stage === stage);
  const stages = ["all", "student", "graduate", "entrepreneur"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-gold-soft text-iscarb-gold-dark">
          <HandCoins className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
            {L(ar, "Funding & Support", "فرص التمويل والدعم")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {L(ar, "Real Saudi government programmes — HRDF, Badir, Monsha'at, SVC, Wa'ed.", "برامج سعودية حكومية حقيقية — هدف، بادر، منشآت، SVC، واعد.")}
          </p>
        </div>
      </div>

      <Tabs value={stage} onValueChange={setStage} className="w-full">
        <TabsList className="mb-5 flex w-full flex-wrap justify-start gap-1">
          {stages.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s === "all" ? L(ar, "All", "الكل") : L(ar, STAGE_LABEL[s].en, STAGE_LABEL[s].ar)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={stage}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{L(ar, "No programmes in this category yet.", "لا توجد برامج في هذه الفئة حالياً.")}</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((p) => {
                const Icon = STAGE_ICON[p.stage] ?? HandCoins;
                return (
                  <Card key={p.id} className="flex flex-col border-iscarb-gold/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-iscarb-gold-dark" />
                          <Badge variant="outline" className="text-[10px]">{p.provider}</Badge>
                        </div>
                        {p.saved && (
                          <Badge className="bg-iscarb-green-soft text-iscarb-green-dark text-[10px]">
                            {L(ar, STATUS_LABEL[p.saved.status]?.en ?? p.saved.status, STATUS_LABEL[p.saved.status]?.ar ?? p.saved.status)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{ar ? p.nameAr : p.nameEn}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3">
                      <p className="text-sm text-muted-foreground" dir="auto">{ar ? p.descriptionAr : p.descriptionEn}</p>
                      <p className="text-xs font-medium text-iscarb-gold-dark" dir="auto">{p.amountNote}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                        <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-xs">
                          <a href={p.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3" />{L(ar, "Visit", "زيارة")}
                          </a>
                        </Button>
                        {sid && (
                          <>
                            {!p.saved ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs"
                                disabled={track.isPending}
                                onClick={() => track.mutate({ studentId: sid, programId: p.id, action: "save" })}
                              >
                                <Bookmark className="size-3" />{L(ar, "Save", "حفظ")}
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <BookmarkCheck className="size-3.5 text-iscarb-green" />
                                <select
                                  className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px]"
                                  value={p.saved.status}
                                  disabled={track.isPending}
                                  onChange={(e) =>
                                    track.mutate({ studentId: sid, programId: p.id, action: "status", status: e.target.value })
                                  }
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{L(ar, STATUS_LABEL[s].en, STATUS_LABEL[s].ar)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FundingView;
