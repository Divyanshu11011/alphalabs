import { useCallback, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/api";
import { useAgentsStore } from "@/lib/stores/agents-store";
import type { Agent, AgentMode } from "@/types/agent";

export interface CustomIndicator {
  name: string;
  formula: string;
}

export interface AgentCreate {
  name: string;
  mode: AgentMode;
  model: string;
  api_key_id: string;
  indicators: string[];
  custom_indicators?: CustomIndicator[];
  strategy_prompt: string;
}

export interface AgentUpdate {
  name?: string;
  mode?: AgentMode;
  model?: string;
  api_key_id?: string;
  indicators?: string[];
  custom_indicators?: CustomIndicator[];
  strategy_prompt?: string;
}

export type AgentFilters = {
  search?: string;
  mode?: AgentMode;
  model?: string;
  sort?: "newest" | "oldest" | "performance" | "tests" | "alpha";
};

const mapAgentResponse = (payload: any): Agent => ({
  id: payload.id,
  name: payload.name,
  model: payload.model,
  mode: payload.mode,
  indicators: payload.indicators ?? [],
  customIndicators: payload.custom_indicators ?? [],
  strategyPrompt: payload.strategy_prompt ?? "",
  apiKeyMasked: payload.api_key_masked ?? "",
  testsRun: payload.tests_run ?? 0,
  bestPnL: payload.best_pnl ?? null,
  createdAt: payload.created_at ? new Date(payload.created_at) : new Date(),
  updatedAt: payload.updated_at ? new Date(payload.updated_at) : new Date(),
  stats: {
    totalTests: payload.tests_run ?? 0,
    profitableTests: payload.total_profitable_tests ?? 0,
    bestPnL: payload.best_pnl ?? 0,
    avgWinRate: payload.avg_win_rate ?? 0,
    avgDrawdown: payload.avg_drawdown ?? 0,
  },
});

const buildQueryString = (filters: AgentFilters) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.mode) params.append("mode", filters.mode);
  if (filters.model) params.append("model", filters.model);
  if (filters.sort) params.append("sort", filters.sort);
  return params.toString() ? `?${params.toString()}` : "";
};

export function useAgents(initialFilters?: AgentFilters) {
  const { get, post, put, del } = useApiClient();
  const {
    agents,
    total,
    filters,
    isLoading,
    error,
    lastQueryKey,
    setAgents,
    setTotal,
    setLoading,
    setError,
    setFilters,
    setSearchQuery,
    toggleModelFilter,
    toggleModeFilter,
    setSortBy,
    clearFilters,
    filteredAgents,
    setLastQueryKey,
  } = useAgentsStore((state) => state);

  const appliedInitialFilters = useRef(false);
  useEffect(() => {
    if (initialFilters && !appliedInitialFilters.current) {
      setFilters(initialFilters);
      appliedInitialFilters.current = true;
    }
  }, [initialFilters, setFilters]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryString = buildQueryString({
        search: filters.search,
        mode: filters.mode,
        model: filters.model,
        sort: filters.sort,
      });
      if (lastQueryKey === queryString && agents.length > 0) {
        setLoading(false);
        return;
      }
      setLastQueryKey(queryString);
      const response = await get<{ agents: any[]; total: number }>(
        `/api/agents${queryString}`
      );
      setAgents(response.agents.map(mapAgentResponse));
      setTotal(response.total ?? response.agents.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, [agents.length, filters, get, lastQueryKey, setAgents, setError, setLastQueryKey, setLoading, setTotal]);

  useEffect(() => {
    void fetchAgents();
  }, [fetchAgents]);

  const updateFilters = useCallback(
    (partial: AgentFilters) => {
      setFilters(partial);
    },
    [setFilters]
  );

  const createAgent = useCallback(
    async (data: AgentCreate) => {
      setError(null);
      try {
        const response = await post<{ agent: Agent; message: string }>(
          "/api/agents",
          data
        );
        await fetchAgents();
        return response.agent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create agent";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchAgents, post, setError]
  );

  const getAgent = useCallback(
    async (id: string) => {
      setError(null);
      try {
        return await get<Agent>(`/api/agents/${id}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch agent";
        setError(errorMessage);
        throw err;
      }
    },
    [get, setError]
  );

  const updateAgent = useCallback(
    async (id: string, data: AgentUpdate) => {
      setError(null);
      try {
        const response = await put<Agent>(`/api/agents/${id}`, data);
        await fetchAgents();
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update agent";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchAgents, put, setError]
  );

  const deleteAgent = useCallback(
    async (id: string, archive: boolean = true) => {
      setError(null);
      try {
        const queryString = archive ? "?archive=true" : "?archive=false";
        await del(`/api/agents/${id}${queryString}`);
        await fetchAgents();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete agent";
        setError(errorMessage);
        throw err;
      }
    },
    [del, fetchAgents, setError]
  );

  const duplicateAgent = useCallback(
    async (id: string, newName: string) => {
      setError(null);
      try {
        const response = await post<{ agent: Agent; message: string }>(
          `/api/agents/${id}/duplicate`,
          { new_name: newName }
        );
        await fetchAgents();
        return response.agent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to duplicate agent";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchAgents, post, setError]
  );

  const getAgentStats = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const response = await get<{ stats: any }>(`/api/agents/${id}/stats`);
        return response.stats;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch agent stats";
        setError(errorMessage);
        throw err;
      }
    },
    [get, setError]
  );

  return {
    agents,
    total,
    isLoading,
    error,
    filters,
    updateFilters,
    setSearchQuery,
    toggleModelFilter,
    toggleModeFilter,
    setSortBy,
    clearFilters,
    filteredAgents: filteredAgents(),
    createAgent,
    getAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    getAgentStats,
    refetch: fetchAgents,
  };
}
