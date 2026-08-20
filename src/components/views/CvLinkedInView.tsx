"use client";

import { useEffect, useCallback, useState } from "react";
import {
  FileUser, Loader2, RefreshCw, Copy, Check, Linkedin, FileText, Lightbulb,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiMutation } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface CvResult {
  headline: string;
  sections: { heading: string; lines: string[] }[];
  atsKeywords: string[];
}
interface LinkedinResult {
  headline: string;
  about: string;
  topSkills: string[];
  featuredProjects: string[];
  recommendations: string[];
}

function CopyButton({ text, ar }: { text: string; ar: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 gap-1 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? L(ar, "Copied", "تم النسخ") : L(ar, "Copy", "نسخ")}
    </Button>
  );
}

/**
 * CV & LinkedIn — both builders surfaced as one first-class destination (P0
 * fix: the CV builder existed but was buried as tab 6 of "Journey & Growth";
 * P1 fix: LinkedIn had no builder at all). Both read from the SAME live
 * portfolio via student-profile.ts's shared gatherer, so the headline,
 * skills, and projects can never drift between the two documents.
 */
export function CvLinkedInView() {
  const { ar } = useI18n();
  const { selectedStudentId } = useApp();
  const sid = selectedStudentId;

  const [cv, setCv] = useState<CvResult | null>(null);
  const [linkedin, setLinkedin] = useState<LinkedinResult | null>(null);

  const genCv = useApiMutation<CvResult, { studentId: string }>("/api/iscarb/cv/generate", {
    onSuccess: (r) => setCv(r),
  });
  const genLinkedin = useApiMutation<LinkedinResult, { studentId: string }>("/api/iscarb/linkedin/optimize", {
    invalidateKeys: (vars) => [["dashboard", vars.studentId]],
    onSuccess: (r) => setLinkedin(r),
  });

  const generateBoth = useCallback(() => {
    if (!sid) return;
    genCv.mutate({ studentId: sid });
    genLinkedin.mutate({ studentId: sid });
  }, [sid]);

  useEffect(() => {
    generateBoth();
  }, [sid]);

  if (!sid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          {L(ar, "Select a student to build their CV and LinkedIn profile.", "اختر طالباً لبناء سيرته الذاتية وملف LinkedIn.")}
        </CardContent></Card>
      </div>
    );
  }

  const busy = genCv.isPending || genLinkedin.isPending;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-cyan-soft text-iscarb-cyan-dark">
            <FileUser className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
              {L(ar, "CV & LinkedIn", "السيرة الذاتية و LinkedIn")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {L(ar, "Built from your live portfolio — always current, never hand-typed.", "مبنيّان من ملفّك الحيّ — محدَّثان دائماً ولا يُكتبان يدوياً.")}
            </p>
          </div>
        </div>
        <Button onClick={generateBoth} disabled={busy} variant="outline" size="sm" className="gap-1.5">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {L(ar, "Regenerate both", "أعد التوليد")}
        </Button>
      </div>

      <Tabs defaultValue="cv" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cv"><FileText className="me-1.5 size-3.5" />{L(ar, "ATS CV", "السيرة الذاتية")}</TabsTrigger>
          <TabsTrigger value="linkedin"><Linkedin className="me-1.5 size-3.5" />{L(ar, "LinkedIn", "LinkedIn")}</TabsTrigger>
        </TabsList>

        <TabsContent value="cv">
          {!cv ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{L(ar, "ATS-ready CV", "سيرة ذاتية متوافقة مع ATS")}</CardTitle>
                  <CopyButton
                    text={`${cv.headline}\n\n${cv.sections.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n\n")}`}
                    ar={ar}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/60 bg-card p-5 font-mono text-sm leading-relaxed">
                  <div className="mb-3 font-display text-lg font-bold text-iscarb-ink dark:text-white">{cv.headline}</div>
                  {cv.sections.map((s) => (
                    <div key={s.heading} className="mb-3">
                      <div className="mb-1 text-xs font-bold tracking-wider text-iscarb-green">{s.heading}</div>
                      {s.lines.map((ln, i) => <div key={i} className="text-muted-foreground">• {ln}</div>)}
                    </div>
                  ))}
                  <div className="mt-2 border-t border-border/40 pt-2">
                    <div className="mb-1 text-xs font-bold tracking-wider text-iscarb-green">ATS KEYWORDS</div>
                    <div className="flex flex-wrap gap-1">{cv.atsKeywords.map((k) => <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="linkedin">
          {!linkedin ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{L(ar, "Headline", "العنوان المهني")}</CardTitle>
                    <CopyButton text={linkedin.headline} ar={ar} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" dir="auto">{linkedin.headline}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{linkedin.headline.length}/220</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{L(ar, "About", "نبذة عني")}</CardTitle>
                    <CopyButton text={linkedin.about} ar={ar} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed" dir="auto">{linkedin.about}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">{L(ar, "Top skills to pin", "المهارات الأساسية للتثبيت")}</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {linkedin.topSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </CardContent>
              </Card>

              {linkedin.featuredProjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{L(ar, "Featured projects", "المشاريع المميَّزة")}</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {linkedin.featuredProjects.map((p, i) => <p key={i} className="text-sm text-muted-foreground">• {p}</p>)}
                  </CardContent>
                </Card>
              )}

              <Card className="border-iscarb-gold/30 bg-iscarb-gold-soft/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-base"><Lightbulb className="size-4 text-iscarb-gold-dark" />{L(ar, "Do this next", "افعل هذا تالياً")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {linkedin.recommendations.map((r, i) => (
                    <p key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-iscarb-gold-dark" />
                      {r}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CvLinkedInView;
