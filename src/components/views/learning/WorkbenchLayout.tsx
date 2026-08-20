"use client";

/**
 * WorkbenchLayout — root two-panel layout container for the Student Workbench.
 *
 * Renders:
 *   - Collapsible `aside` (RoadmapSidebar) — w-72 on desktop, hidden on mobile
 *   - `main` (SlideCanvas) — flex-[55] or flex-[60] when sidebar is collapsed
 *   - `aside` (InteractiveZone) — flex-[40] to flex-[45]
 *
 * Sidebar collapse animates with CSS `transition-all duration-300`.
 * Below 1024 px: single-column stacked layout (canvas above interactive zone).
 * Fullscreen toggle covering 100 vw × 100 vh.
 *
 * Validates: Requirements 1.1, 1.2, 1.6, 1.7, 1.8
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkbenchLayoutProps {
  /** Whether the sidebar starts collapsed */
  sidebarDefaultCollapsed?: boolean;
  /** Full-screen toggle state managed by parent */
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  interactiveZone: React.ReactNode;
  /** Whether the sidebar is currently collapsed (controlled from parent) */
  sidebarCollapsed: boolean;
  onSidebarCollapse: () => void;
}

// ---------------------------------------------------------------------------
// WorkbenchLayout
// ---------------------------------------------------------------------------

export function WorkbenchLayout({
  isFullscreen,
  onFullscreenToggle,
  sidebar,
  canvas,
  interactiveZone,
  sidebarCollapsed,
  onSidebarCollapse,
}: WorkbenchLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-gradient-to-br from-emerald-50/50 via-slate-50/80 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased",
        isFullscreen
          ? "fixed inset-0 z-50"
          : "-m-6 h-[calc(100vh-48px)]"
      )}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Fullscreen toggle button                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={onFullscreenToggle}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 backdrop-blur-sm"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <Maximize2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Main flex row: Sidebar + Canvas + InteractiveZone                  */}
      {/* On mobile (< lg): stacks vertically (canvas then interactive zone) */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-1 min-h-0 lg:flex-row flex-col overflow-hidden">

        {/* Sidebar — hidden on mobile, collapsible on desktop */}
        {/* Req 1.6: default expanded; Req 1.7: collapses with CSS transition ≤300ms */}
        <div
          className={cn(
            // Always hidden on small screens (< lg)
            "hidden lg:flex flex-col shrink-0 overflow-hidden",
            // CSS transition on width — Req 1.7
            "transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-72 opacity-100"
          )}
          aria-hidden={sidebarCollapsed}
        >
          {/* Sidebar content is injected by parent */}
          <div className="flex flex-col h-full overflow-hidden">
            {sidebar}
          </div>
        </div>

        {/* Canvas — flex-[55] normally; expands to flex-[60] when sidebar collapsed */}
        {/* Req 1.1: 55–60% width on desktop */}
        <main
          className={cn(
            "flex flex-col min-w-0 overflow-hidden",
            // On desktop: flex sizing
            sidebarCollapsed ? "lg:flex-[60]" : "lg:flex-[55]",
            // Transition so canvas expands smoothly when sidebar collapses
            "transition-all duration-300 ease-in-out",
            // On mobile: full width in stacked layout
            "flex-1 lg:flex-initial"
          )}
        >
          {/* Sidebar re-expand button — visible only on desktop when collapsed */}
          {sidebarCollapsed && (
            <div className="hidden lg:flex items-center px-2 pt-2 shrink-0">
              <button
                type="button"
                onClick={onSidebarCollapse}
                aria-label="Expand roadmap sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-xs font-medium"
              >
                ≡
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {canvas}
          </div>
        </main>

        {/* Interactive Zone — flex-[40] to flex-[45] on desktop */}
        {/* Req 1.1: 40–45% width on desktop */}
        <aside
          className={cn(
            "flex flex-col min-w-0 overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700/60",
            "lg:flex-[40]",
            // On mobile: some min height
            "min-h-[360px] lg:min-h-0"
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {interactiveZone}
          </div>
        </aside>
      </div>
    </div>
  );
}
