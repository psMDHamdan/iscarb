"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, FileCode, Network, Container, FlaskConical, ListChecks, Code2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export interface R2COutputResult {
  titleEn: string;
  titleAr: string;
  stack: string;
  prismaSchema: string;
  mermaidDiagram: string;
  dockerCompose: string;
  testsCode: string;
  checklist: string[];
  source: "ai" | "fallback";
}

type TabId = "schema" | "diagram" | "docker" | "tests" | "checklist";

/**
 * The tabbed R2C output (schema / architecture diagram / docker / tests /
 * checklist), extracted out of R2CView so the SAME rendering — including the
 * lazy mermaid diagram render — can be reused inline inside the AI Project
 * Builder's "Step 2: Code" panel (the Capstone+R2C merge) without
 * duplicating the mermaid-loading logic in two places.
 */
export function R2COutputPanel({ result }: { result: R2COutputResult }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("schema");
  const [copied, setCopied] = useState<string | null>(null);
  const [diagramMode, setDiagramMode] = useState<"rendered" | "source">("rendered");
  const [renderError, setRenderError] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab !== "diagram" || diagramMode !== "rendered") return;
    let cancelled = false;
    const code = result.mermaidDiagram;
    setRenderError(false);
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "default" });
        const id = `r2c-mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && mermaidRef.current) mermaidRef.current.innerHTML = svg;
      } catch {
        if (!cancelled) setRenderError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, diagramMode, result]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof FileCode }[] = [
    { id: "schema", label: t("r2c.tab.schema"), icon: FileCode },
    { id: "diagram", label: t("r2c.tab.diagram"), icon: Network },
    { id: "docker", label: t("r2c.tab.docker"), icon: Container },
    { id: "tests", label: t("r2c.tab.tests"), icon: FlaskConical },
    { id: "checklist", label: t("r2c.tab.checklist"), icon: ListChecks },
  ];

  const codeFor = (id: TabId): string => {
    switch (id) {
      case "schema": return result.prismaSchema;
      case "diagram": return result.mermaidDiagram;
      case "docker": return result.dockerCompose;
      case "tests": return result.testsCode;
      default: return result.checklist.join("\n");
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="mb-3 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                active ? "border-b-2 border-iscarb-cyan text-iscarb-cyan" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" /> {tb.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      {tab === "checklist" ? (
        <ol className="space-y-2">
          {result.checklist.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-iscarb-cyan-soft text-xs font-bold text-iscarb-cyan">{i + 1}</span>
              <span className="text-iscarb-ink dark:text-white/90" dir="auto">{c}</span>
            </li>
          ))}
        </ol>
      ) : tab === "diagram" ? (
        <div className="relative">
          <div className="absolute end-2 top-2 z-10 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDiagramMode((m) => (m === "rendered" ? "source" : "rendered"))}
              className="h-7 gap-1 px-2 text-xs"
            >
              {diagramMode === "rendered" ? <Code2 className="size-3" /> : <Network className="size-3" />}
              {diagramMode === "rendered" ? t("r2c.viewSource") : t("r2c.viewDiagram")}
            </Button>
            {diagramMode === "source" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(codeFor("diagram"), "diagram")}
                className="h-7 gap-1 px-2 text-xs"
              >
                {copied === "diagram" ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied === "diagram" ? t("r2c.copied") : t("r2c.copy")}
              </Button>
            )}
          </div>
          {diagramMode === "rendered" && !renderError ? (
            <div className="overflow-auto rounded-lg border border-border bg-white p-4">
              <div
                ref={mermaidRef}
                className="flex min-h-[140px] items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full"
              />
            </div>
          ) : (
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-iscarb-ink p-4 text-xs leading-relaxed text-slate-100" dir="ltr">
              <code>{codeFor("diagram")}</code>
            </pre>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {renderError ? t("r2c.mermaidError") : diagramMode === "rendered" ? t("r2c.mermaidRendered") : t("r2c.mermaidNote")}
          </p>
        </div>
      ) : (
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copy(codeFor(tab), tab)}
            className="absolute end-2 top-2 z-10 h-7 gap-1 px-2 text-xs"
          >
            {copied === tab ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied === tab ? t("r2c.copied") : t("r2c.copy")}
          </Button>
          <pre className="max-h-[420px] overflow-auto rounded-lg bg-iscarb-ink p-4 text-xs leading-relaxed text-slate-100" dir="ltr">
            <code>{codeFor(tab)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default R2COutputPanel;
