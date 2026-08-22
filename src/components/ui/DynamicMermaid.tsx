"use client";

import React, { useEffect, useState } from "react";
import { MermaidRenderer } from "./MermaidRenderer";

export function DynamicMermaid({
  conceptTitle,
  explanation,
  mechanismSteps,
}: {
  conceptTitle: string;
  explanation: string;
  mechanismSteps: string[];
}) {
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchDiagram() {
      try {
        const res = await fetch("/api/iscarb/student/lecture/mermaid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conceptTitle, explanation, mechanismSteps }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.mermaidCode) {
          setMermaidCode(data.mermaidCode);
        }
      } catch (err) {
        console.error("Failed to fetch mermaid diagram", err);
      }
    }
    fetchDiagram();
    return () => {
      active = false;
    };
  }, [conceptTitle, explanation, mechanismSteps]);

  if (!mermaidCode) return <MermaidRenderer chart="" />;

  return <MermaidRenderer chart={mermaidCode} />;
}
