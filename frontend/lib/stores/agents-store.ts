/**
 * Agents Store - Agent list, filters, selection
 */

import { create } from "zustand";
import type { Agent, AgentListFilters, AgentMode } from "@/types";
import { DUMMY_AGENTS } from "@/lib/dummy-data";

interface AgentsState {
  // Data
  agents: Agent[];
  selectedAgentId: string | null;
  
  // Filters
  filters: AgentListFilters;
  setSearchQuery: (query: string) => void;
  toggleModelFilter: (model: string) => void;
  toggleModeFilter: (mode: AgentMode) => void;
  setSortBy: (sort: AgentListFilters["sortBy"]) => void;
  clearFilters: () => void;
  
  // Selection
  selectAgent: (id: string | null) => void;
  
  // Computed
  filteredAgents: () => Agent[];
  
  // Actions (simulated)
  deleteAgent: (id: string) => void;
  duplicateAgent: (id: string) => void;
}

const defaultFilters: AgentListFilters = {
  search: "",
  models: [],
  modes: [],
  sortBy: "newest",
};

export const useAgentsStore = create<AgentsState>((set, get) => ({
  // Data - using dummy data
  agents: DUMMY_AGENTS,
  selectedAgentId: null,

  // Filters
  filters: defaultFilters,
  setSearchQuery: (query) =>
    set((state) => ({ filters: { ...state.filters, search: query } })),
  toggleModelFilter: (model) =>
    set((state) => ({
      filters: {
        ...state.filters,
        models: state.filters.models.includes(model)
          ? state.filters.models.filter((m) => m !== model)
          : [...state.filters.models, model],
      },
    })),
  toggleModeFilter: (mode) =>
    set((state) => ({
      filters: {
        ...state.filters,
        modes: state.filters.modes.includes(mode)
          ? state.filters.modes.filter((m) => m !== mode)
          : [...state.filters.modes, mode],
      },
    })),
  setSortBy: (sort) =>
    set((state) => ({ filters: { ...state.filters, sortBy: sort } })),
  clearFilters: () => set({ filters: defaultFilters }),

  // Selection
  selectAgent: (id) => set({ selectedAgentId: id }),

  // Computed - returns filtered & sorted agents
  filteredAgents: () => {
    const { agents, filters } = get();
    let result = [...agents];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.model.toLowerCase().includes(query)
      );
    }

    // Model filter
    if (filters.models.length > 0) {
      result = result.filter((a) =>
        filters.models.some((m) => a.model.toLowerCase().includes(m.toLowerCase()))
      );
    }

    // Mode filter
    if (filters.modes.length > 0) {
      result = result.filter((a) => filters.modes.includes(a.mode));
    }

    // Sort
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

  // Actions
  deleteAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
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
      return { agents: [...state.agents, newAgent] };
    }),
}));

