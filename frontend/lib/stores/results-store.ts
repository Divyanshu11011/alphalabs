/**
 * Results Store - Test results, filters
 */

import { create } from "zustand";
import type { TestResult, ResultFilters, ResultsStats, ResultListItem } from "@/types";

const DEFAULT_STATS: ResultsStats = {
  totalTests: 0,
  profitable: 0,
  profitablePercent: 0,
  bestResult: 0,
  avgPnL: 0,
};

interface ResultsState {
  // Data
  results: TestResult[];
  stats: ResultsStats;
  setResults: (results: TestResult[] | ResultListItem[]) => void;
  setStats: (stats: ResultsStats) => void;
  selectedResultId: string | null;
  
  // Filters
  filters: ResultFilters;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: ResultFilters["type"]) => void;
  setResultFilter: (result: ResultFilters["result"]) => void;
  setAgentFilter: (agentId: string | undefined) => void;
  clearFilters: () => void;
  
  // Selection
  selectResult: (id: string | null) => void;
  
  // Refresh trigger - increment to trigger refresh
  refreshKey: number;
  triggerRefresh: () => void;
  
  // Computed
  filteredResults: () => TestResult[];
  
  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  totalPages: () => number;
  paginatedResults: () => TestResult[];
}

const defaultFilters: ResultFilters = {
  search: "",
  type: "all",
  result: "all",
  agentId: undefined,
};

/**
 * Convert ResultListItem from API to TestResult for store compatibility
 */
const mapListItemToTestResult = (item: ResultListItem): TestResult => ({
  id: item.id,
  type: item.type,
  agentId: item.agentId,
  agentName: item.agentName,
  asset: item.asset,
  mode: item.mode as "monk" | "omni",
  date: new Date(item.createdAt),
  duration: item.durationDisplay || "–",
  trades: item.totalTrades,
  pnl: item.totalPnlPct,
  winRate: item.winRate,
  maxDrawdown: item.maxDrawdownPct,
  sharpeRatio: item.sharpeRatio,
  profitFactor: item.profitFactor,
});

export const useResultsStore = create<ResultsState>((set, get) => ({
  // Data
  results: [],
  stats: DEFAULT_STATS,
  selectedResultId: null,

  // Refresh trigger
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

  // Filters
  filters: defaultFilters,
  setSearchQuery: (query) =>
    set((state) => ({ filters: { ...state.filters, search: query }, page: 1 })),
  setTypeFilter: (type) =>
    set((state) => ({ filters: { ...state.filters, type }, page: 1 })),
  setResultFilter: (result) =>
    set((state) => ({ filters: { ...state.filters, result }, page: 1 })),
  setAgentFilter: (agentId) =>
    set((state) => ({ filters: { ...state.filters, agentId }, page: 1 })),
  clearFilters: () => set({ filters: defaultFilters, page: 1 }),

  // Selection
  selectResult: (id) => set({ selectedResultId: id }),
  setResults: (results: TestResult[] | ResultListItem[]) => {
    // Accept both TestResult[] and ResultListItem[] for flexibility
    const mappedResults: TestResult[] = results.map((r) => {
      // Check if it's already a TestResult (has date as Date)
      if ('date' in r && r.date instanceof Date) {
        return r as TestResult;
      }
      // Otherwise it's a ResultListItem, map it
      return mapListItemToTestResult(r as ResultListItem);
    });
    set({ results: mappedResults });
  },
  setStats: (stats) => set({ stats }),

  // Computed - returns filtered results
  filteredResults: () => {
    const { results, filters } = get();
    let filtered = [...results];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.agentName.toLowerCase().includes(query) ||
          r.asset.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((r) => r.type === filters.type);
    }

    // Result filter
    if (filters.result === "profitable") {
      filtered = filtered.filter((r) => r.pnl >= 0);
    } else if (filters.result === "loss") {
      filtered = filtered.filter((r) => r.pnl < 0);
    }

    // Agent filter
    if (filters.agentId) {
      filtered = filtered.filter((r) => r.agentId === filters.agentId);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    return filtered;
  },

  // Pagination
  page: 1,
  pageSize: 10,
  setPage: (page) => set({ page }),
  totalPages: () => {
    const filtered = get().filteredResults();
    return Math.ceil(filtered.length / get().pageSize);
  },
  paginatedResults: () => {
    const { page, pageSize, filteredResults } = get();
    const filtered = filteredResults();
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  },
}));

