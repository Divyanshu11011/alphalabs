import { useCallback } from "react";
import { API_BASE_URL, useApiClient } from "@/lib/api";
import type {
  ResultListItem,
  ResultListResponse,
  ResultStatsResponse,
  ResultDetailResponse,
  ResultTradesResponse,
  ReasoningResponse,
  ResultPagination,
} from "@/types/result";

type ResultPaginationApi = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

const mapPagination = (payload: ResultPaginationApi): ResultPagination => ({
  page: payload.page,
  limit: payload.limit,
  total: payload.total,
  totalPages: payload.total_pages,
});

export interface ResultListParams {
  page?: number;
  limit?: number;
  type?: "backtest" | "forward";
  agentId?: string;
  asset?: string;
  mode?: "monk" | "omni";
  profitable?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ResultTradesParams {
  page?: number;
  limit?: number;
  direction?: "long" | "short";
  outcome?: "win" | "loss";
  search?: string;
}

export interface ReasoningParams {
  page?: number;
  limit?: number;
  candleFrom?: number;
  candleTo?: number;
  decision?: string;
}

const mapListItem = (item: any): ResultListItem => ({
  id: item.id,
  type: item.type,
  agentId: item.agent_id,
  agentName: item.agent_name,
  asset: item.asset,
  mode: item.mode,
  createdAt: item.created_at,
  durationDisplay: item.duration_display,
  totalTrades: item.total_trades,
  totalPnlPct: item.total_pnl_pct,
  winRate: item.win_rate,
  maxDrawdownPct: item.max_drawdown_pct,
  sharpeRatio: item.sharpe_ratio,
  isProfitable: item.is_profitable,
  hasCertificate: item.has_certificate,
});

export function useResultsApi() {
  const { get } = useApiClient();

  const fetchResults = useCallback(
    async (params: ResultListParams = {}): Promise<ResultListResponse> => {
      const qs = new URLSearchParams();
      if (params.page) qs.append("page", params.page.toString());
      if (params.limit) qs.append("limit", params.limit.toString());
      if (params.type) qs.append("type", params.type);
      if (params.agentId) qs.append("agent_id", params.agentId);
      if (params.asset) qs.append("asset", params.asset);
      if (params.mode) qs.append("mode", params.mode);
      if (params.profitable !== undefined) {
        qs.append("profitable", String(params.profitable));
      }
      if (params.search) qs.append("search", params.search);
      if (params.dateFrom) qs.append("date_from", params.dateFrom);
      if (params.dateTo) qs.append("date_to", params.dateTo);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      const response = await get<{ results: any[]; pagination: ResultPaginationApi }>(
        `/api/results${query}`
      );
      return {
        results: response.results.map(mapListItem),
        pagination: mapPagination(response.pagination),
      };
    },
    [get]
  );

  const fetchStats = useCallback(async () => {
    return get<ResultStatsResponse>("/api/results/stats");
  }, [get]);

  const fetchResultDetail = useCallback(
    async (id: string) => {
      return get<ResultDetailResponse>(`/api/results/${id}`);
    },
    [get]
  );

  const fetchTrades = useCallback(
    async (id: string, params: ResultTradesParams = {}) => {
      const qs = new URLSearchParams();
      if (params.page) qs.append("page", params.page.toString());
      if (params.limit) qs.append("limit", params.limit.toString());
      if (params.direction) qs.append("direction", params.direction);
      if (params.outcome) qs.append("outcome", params.outcome);
      if (params.search) qs.append("search", params.search);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      const response = await get<{ trades: ResultTradesResponse["trades"]; pagination: ResultPaginationApi }>(
        `/api/results/${id}/trades${query}`
      );
      return {
        ...response,
        pagination: mapPagination(response.pagination),
      };
    },
    [get]
  );

  const fetchReasoning = useCallback(
    async (id: string, params: ReasoningParams = {}) => {
      const qs = new URLSearchParams();
      if (params.page) qs.append("page", params.page.toString());
      if (params.limit) qs.append("limit", params.limit.toString());
      if (params.candleFrom !== undefined)
        qs.append("candle_from", params.candleFrom.toString());
      if (params.candleTo !== undefined)
        qs.append("candle_to", params.candleTo.toString());
      if (params.decision) qs.append("decision", params.decision);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      const response = await get<{ thoughts: ReasoningResponse["thoughts"]; pagination: ResultPaginationApi }>(
        `/api/results/${id}/reasoning${query}`
      );
      return {
        ...response,
        pagination: mapPagination(response.pagination),
      };
    },
    [get]
  );

  const getExportUrl = useCallback(
    (id: string) => `${API_BASE_URL}/api/results/${id}/export`,
    []
  );

  return {
    fetchResults,
    fetchStats,
    fetchResultDetail,
    fetchTrades,
    fetchReasoning,
    getExportUrl,
  };
}

