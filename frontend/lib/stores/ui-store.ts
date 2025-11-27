/**
 * UI Store - Theme, sidebar, modals, notifications
 * Lightweight state for UI concerns only
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, AccentColor, Notification } from "@/types";

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

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
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

      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            read: false,
          };
          return {
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
            unreadCount: state.unreadCount + 1,
          };
        }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
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

