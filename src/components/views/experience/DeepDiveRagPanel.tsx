"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DeepDiveRagPanelProps {
  conceptTitle: string;
  stageName: string;
  coreInsight: string;
}

export function DeepDiveRagPanel({ conceptTitle, stageName, coreInsight }: DeepDiveRagPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function fetchDeepDive() {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch("/api/iscarb/student/lecture/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conceptTitle, stageName, coreInsight }),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (active && data.result) {
          setContent(data.result);
        }
      } catch (err) {
        console.error("Failed to fetch deep dive", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDeepDive();
    return () => {
      active = false;
    };
  }, [conceptTitle, stageName, coreInsight]);

  return (
    <div className="h-full flex flex-col p-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 rounded-r-2xl overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
        <BookOpen className="w-5 h-5" />
        <h3 className="font-bold">Deep Dive (Textbook & Case Studies)</h3>
      </div>
      
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Retrieving verified academic sources...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          Unable to retrieve academic sources right now.
        </div>
      )}

      {!loading && !error && content && (
        <div className="prose prose-sm dark:prose-invert prose-emerald max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
