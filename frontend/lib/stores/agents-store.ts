/**
 * Agents Store - Agent list, filters, selection
 */

import { create } from "zustand";
import type { Agent, AgentMode } from "@/types/agent";

type SortOption = "newest" | "oldest" | "performance" | "tests" | "alpha";

interface AgentsFilterState {
  search: string;
  mode?: AgentMode;
  model?: string;
  modes: AgentMode[];
  models: string[];
  sortBy: SortOption;
  sort?: SortOption;
}

interface AgentsState {
  agents: Agent[];
  total: number;
  selectedAgentId: string | null;
  filters: AgentsFilterState;
  isLoading: boolean;
  error: string | null;
  lastQueryKey: string | null;
  setAgents: (agents: Agent[]) => void;
  setTotal: (total: number) => void;
  setLoading: (flag: boolean) => void;
  setError: (message: string | null) => void;
  setFilters: (filters: Partial<AgentsFilterState>) => void;
  setSearchQuery: (query: string) => void;
  toggleModelFilter: (model: string) => void;
  toggleModeFilter: (mode: AgentMode) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
  selectAgent: (id: string | null) => void;
  filteredAgents: () => Agent[];
  deleteAgent: (id: string) => void;
  duplicateAgent: (id: string) => void;
  setLastQueryKey: (key: string) => void;
}

const defaultFilters: AgentsFilterState = {
  search: "",
  mode: undefined,
  model: undefined,
  modes: [],
  models: [],
  sortBy: "newest",
  sort: "newest",
};

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  total: 0,
  selectedAgentId: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,
  lastQueryKey: null,
  setAgents: (agents) => set({ agents }),
  setTotal: (total) => set({ total }),
  setLoading: (flag) => set({ isLoading: flag }),
  setError: (message) => set({ error: message }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSearchQuery: (query) =>
    set((state) => ({ filters: { ...state.filters, search: query } })),
  toggleModelFilter: (model) =>
    set((state) => {
      const exists = state.filters.models.includes(model);
      const models = exists
        ? state.filters.models.filter((m) => m !== model)
        : [...state.filters.models, model];
      return {
        filters: {
          ...state.filters,
          models,
          model: models[models.length - 1],
        },
      };
    }),
  toggleModeFilter: (mode) =>
    set((state) => {
      const exists = state.filters.modes.includes(mode);
      const modes = exists
        ? state.filters.modes.filter((m) => m !== mode)
        : [...state.filters.modes, mode];
      return {
        filters: {
          ...state.filters,
          modes,
          mode: modes[modes.length - 1],
        },
      };
    }),
  setSortBy: (sort) =>
    set((state) => ({ filters: { ...state.filters, sortBy: sort, sort } })),
  clearFilters: () => set({ filters: defaultFilters }),
  selectAgent: (id) => set({ selectedAgentId: id }),
  filteredAgents: () => {
    const { agents, filters } = get();
    let result = [...agents];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.model.toLowerCase().includes(query)
      );
    }

    if (filters.models.length > 0) {
      result = result.filter((a) =>
        filters.models.some((m) => a.model.toLowerCase().includes(m.toLowerCase()))
      );
    }

    if (filters.modes.length > 0) {
      result = result.filter((a) => filters.modes.includes(a.mode));
    }

    switch (filters.sortBy) {
      case "newest":
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "oldest":
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case "performance":
        result.sort((a, b) => (b.bestPnL || -Infinity) - (a.bestPnL || -Infinity));
        break;
      case "tests":
        result.sort((a, b) => b.testsRun - a.testsRun);
        break;
      case "alpha":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  },
  deleteAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
      total: Math.max(0, state.total - 1),
    })),
  duplicateAgent: (id) =>
    set((state) => {
      const agent = state.agents.find((a) => a.id === id);
      if (!agent) return state;
      const newAgent: Agent = {
        ...agent,
        id: `agent-${Date.now()}`,
        name: `${agent.name}-copy`,
        testsRun: 0,
        bestPnL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { agents: [...state.agents, newAgent], total: state.total + 1 };
    }),
  setLastQueryKey: (key) => set({ lastQueryKey: key }),
}));

