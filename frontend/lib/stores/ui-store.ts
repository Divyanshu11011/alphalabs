/**
 * UI Store - Theme, sidebar, modals, notifications
 * Lightweight state for UI concerns only
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, AccentColor } from "@/types";

interface UIState {
  // Theme
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Modals
  quickTestModalOpen: boolean;
  setQuickTestModalOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme defaults
      theme: "dark",
      accentColor: "cyan",
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),

      // Sidebar defaults
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Modals
      quickTestModalOpen: false,
      setQuickTestModalOpen: (open) => set({ quickTestModalOpen: open }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Notifications (handled via API now)
    }),
    {
      name: "alphalab-ui",
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

