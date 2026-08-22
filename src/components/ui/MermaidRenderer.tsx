"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
  suppressErrorRendering: true,
});

interface MermaidRendererProps {
  chart: string;
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    async function renderChart() {
      if (!chart) return;
      try {
        setError(false);
        const id = `mermaid-chart-${Math.random().toString(36).substring(7)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error("Mermaid parsing error:", err);
        // Mermaid injects an error SVG directly into the DOM (often with id or d{id}) when syntax is invalid.
        // We must clean it up so it doesn't float on the screen.
        const errorNode = document.getElementById(id);
        if (errorNode) errorNode.remove();
        const dErrorNode = document.getElementById(`d${id}`);
        if (dErrorNode) dErrorNode.remove();

        if (isMounted) {
          setError(true);
        }
      }
    }

    renderChart();
    
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    // Silently fallback — show a clean placeholder instead of an error
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-sm flex items-center justify-center">
        Visual diagram
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Rendering Diagram...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center overflow-x-auto p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
