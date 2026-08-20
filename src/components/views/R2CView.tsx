"use client";

import { useState, useEffect } from "react";
import { Workflow, Wand2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { R2COutputPanel, type R2COutputResult } from "@/components/iscarb/R2COutputPanel";

type R2CResult = R2COutputResult & { id?: string };

const EXAMPLE = "Design a database for an e-learning system with ACID compliance";

export function R2CView() {
  const { t, ar, lang } = useI18n();
  const { selectedStudentId, r2cSeed, setR2cSeed } = useApp();
  const [requirement, setRequirement] = useState("");

  // Consume a one-shot handoff from the Capstone view: pre-fill the textarea with
  // the capstone brief, then clear the seed so it doesn't re-apply on revisit.
  useEffect(() => {
    if (r2cSeed) {
      setRequirement(r2cSeed);
      setR2cSeed(null);
    }
  }, [r2cSeed, setR2cSeed]);

  const [result, setResult] = useState<R2CResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (requirement.trim().length < 8) {
      notify.fail(lang, { en: "Write a longer requirement first.", ar: "اكتب متطلباً أطول أولاً." });
      return;
    }
    setBusy(true);
    const h = notify.generating(lang);
    try {
      const r = await fetch("/api/iscarb/r2c/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: requirement.trim(), studentId: selectedStudentId ?? undefined }),
      });
      const j = await r.json();
      h.dismiss();
      if (r.ok) {
        setResult(j as R2CResult);
        if (j.source !== "ai") notify.fallback(lang);
        else notify.ok(lang, { en: "Starter generated", ar: "تم توليد البداية" });
      } else {
        notify.fail(lang);
      }
    } catch {
      h.dismiss();
      notify.fail(lang);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-2 flex items-center gap-2">
        <Workflow className="size-6 text-iscarb-cyan" />
        <h1 className="text-2xl font-bold text-iscarb-ink dark:text-white">{t("r2c.title")}</h1>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{t("r2c.subtitle")}</p>

      {/* Input */}
      <Card>
        <CardContent className="p-4">
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={3}
            placeholder={t("r2c.placeholder")}
            className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm"
            dir="auto"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setRequirement(EXAMPLE)}
              className="text-xs text-iscarb-cyan hover:underline"
            >
              {t("r2c.useExample")}
            </button>
            <Button onClick={generate} disabled={busy} className="bg-iscarb-cyan text-white hover:bg-iscarb-cyan-dark">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {t("r2c.generate")}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("r2c.imageNote")}</p>
        </CardContent>
      </Card>

      {/* Output */}
      {result && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{ar ? result.titleAr : result.titleEn}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{result.stack}</Badge>
                {result.source !== "ai" && (
                  <Badge variant="secondary" className="bg-iscarb-gold-soft text-iscarb-gold-dark text-xs">
                    {t("r2c.fallbackBadge")}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <R2COutputPanel result={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default R2CView;
