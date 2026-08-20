"use client";

import { create } from "zustand";

/**
 * AppState — UI preferences only (persisted to localStorage).
 * Context state (selectedStudentId, selectedCourseId) moved to URL params.
 * See: docs/PHASE2_URL_STATE_CONTRACT.md
 */
interface AppState {
  lang: "en" | "ar";
  setLang: (l: "en" | "ar") => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (b: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useApp = create<AppState>((set) => ({
  lang: "en",
  setLang: (l) => set({ lang: l }),
  theme: "light",
  setTheme: (t) => set({ theme: t }),
  sidebarOpen: false,
  setSidebarOpen: (b) => set({ sidebarOpen: b }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (b) => set({ sidebarCollapsed: b }),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));