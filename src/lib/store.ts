import { create } from "zustand";

interface AppState {
  lang: "en" | "ar" | "fr";
  dir: "ltr" | "rtl";
  theme: "light" | "dark";
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setLang: (lang: "en" | "ar" | "fr") => void;
  setTheme: (theme: "light" | "dark") => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useApp = create<AppState>((set) => ({
  lang: "en",
  dir: "ltr",
  theme: "light",
  sidebarOpen: false,
  sidebarCollapsed: false,
  setLang: (lang) => set({ lang, dir: lang === "ar" ? "rtl" : "ltr" }),
  setTheme: (theme) => set({ theme }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
