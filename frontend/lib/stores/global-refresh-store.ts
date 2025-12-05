/**
 * Global Refresh Store - Centralized refresh mechanism for all Zustand stores
 * 
 * Call refreshAll() or specific domain refreshers after:
 * - Agent creation/update/deletion
 * - Trade completion
 * - Session completion
 * - Any other event that requires fresh data
 */

import { create } from "zustand";

interface GlobalRefreshState {
    // Refresh keys for each domain (increment to trigger refetch)
    agentsKey: number;
    resultsKey: number;
    dashboardKey: number;
    arenaKey: number;

    // Timestamp of last global refresh
    lastRefreshAt: number;

    // Individual domain refreshers
    refreshAgents: () => void;
    refreshResults: () => void;
    refreshDashboard: () => void;
    refreshArena: () => void;

    // Global refresh - triggers all domains
    refreshAll: () => void;
}

export const useGlobalRefreshStore = create<GlobalRefreshState>((set) => ({
    agentsKey: 0,
    resultsKey: 0,
    dashboardKey: 0,
    arenaKey: 0,
    lastRefreshAt: Date.now(),

    refreshAgents: () => set((s) => ({
        agentsKey: s.agentsKey + 1,
        lastRefreshAt: Date.now()
    })),

    refreshResults: () => set((s) => ({
        resultsKey: s.resultsKey + 1,
        lastRefreshAt: Date.now()
    })),

    refreshDashboard: () => set((s) => ({
        dashboardKey: s.dashboardKey + 1,
        lastRefreshAt: Date.now()
    })),

    refreshArena: () => set((s) => ({
        arenaKey: s.arenaKey + 1,
        lastRefreshAt: Date.now()
    })),

    refreshAll: () => set((s) => ({
        agentsKey: s.agentsKey + 1,
        resultsKey: s.resultsKey + 1,
        dashboardKey: s.dashboardKey + 1,
        arenaKey: s.arenaKey + 1,
        lastRefreshAt: Date.now(),
    })),
}));

/**
 * Convenience hook for components that need to trigger refreshes
 * Uses getState() to avoid SSR hydration issues with object selectors
 */
export function useGlobalRefresh() {
    const store = useGlobalRefreshStore;
    return {
        refreshAll: store.getState().refreshAll,
        refreshAgents: store.getState().refreshAgents,
        refreshResults: store.getState().refreshResults,
        refreshDashboard: store.getState().refreshDashboard,
        refreshArena: store.getState().refreshArena,
        get lastRefreshAt() { return store.getState().lastRefreshAt; },
    };
}

