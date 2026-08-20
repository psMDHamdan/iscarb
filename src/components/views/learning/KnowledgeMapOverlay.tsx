"use client";

import React from "react";
import { X, Network, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConceptNode {
  id: string;
  name: string;
  masteryState?: "NOT_STARTED" | "INTRODUCED" | "PRACTICED" | "MASTERED";
}

interface KnowledgeMapOverlayProps {
  nodes: ConceptNode[];
  onClose: () => void;
  onNodeClick?: (id: string) => void;
}

export function KnowledgeMapOverlay({
  nodes,
  onClose,
  onNodeClick,
}: KnowledgeMapOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border border-emerald-500/20 bg-zinc-950 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Network className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Interactive Knowledge Map</h2>
              <p className="text-xs text-zinc-400">
                Visualizing concept dependencies and mastery progression
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-5" />
          </Button>
        </div>

        {nodes.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            No concept nodes mapped for this lecture module.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {nodes.map((node, i) => (
              <button
                key={node.id || i}
                onClick={() => onNodeClick?.(node.id)}
                className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition-all hover:border-emerald-500/50 hover:bg-zinc-900 hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Node #{i + 1}
                  </span>
                  {node.masteryState === "MASTERED" ? (
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-zinc-500 shrink-0" />
                  )}
                </div>
                <h3 className="my-2 text-sm font-medium text-zinc-100 group-hover:text-emerald-300">
                  {node.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-emerald-400">
                  <span>View Concept</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
