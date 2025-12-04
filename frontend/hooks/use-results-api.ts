import { useCallback } from "react";
import { API_BASE_URL, useApiClient } from "@/lib/api";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ResultListItem {
  id: string;
  type: string;
  agentId: string;
  agentName: string;
  asset: string;
  mode: string;
  createdAt: string;
  durationDisplay: string;
  totalTrades: number;
  totalPnlPct: number;
  winRate: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  isProfitable: boolean;
  hasCertificate: boolean;
}

export interface ResultListResponse {
  results: ResultListItem[];
  pagination: Pagination;
}

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

export interface ResultStatsResponse {
  stats: {
    total_tests: number;
    profitable: number;
    profitable_pct: number;
    best_result: number;
    worst_result: number;
    avg_pnl: number;
    by_type: Record<string, { count: number; profitable: number }>;
  };
}

export interface ResultDetailResponse {
  result: {
    id: string;
    session_id: string;
    type: string;
    agent_id: string;
    agent_name: string;
    model: string;
    asset: string;
    mode: string;
    start_date: string;
    end_date: string;
    starting_capital: number;
    ending_capital: number;
    total_pnl_pct: number;
    total_trades: number;
    win_rate: number;
    max_drawdown_pct: number;
    sharpe_ratio: number;
    profit_factor: number;
    avg_trade_pnl?: number;
    best_trade_pnl?: number;
    worst_trade_pnl?: number;
    avg_holding_time_display?: string;
    equity_curve?: Array<Record<string, unknown>>;
    ai_summary?: string;
    trades: ResultTrade[];
  };
}

export interface ResultTrade {
  trade_number: number;
  type: string;
  entry_price: number;
  exit_price?: number | null;
  entry_time: string;
  exit_time?: string | null;
  pnl_amount?: number | null;
  pnl_pct?: number | null;
  entry_reasoning?: string | null;
  exit_reasoning?: string | null;
  exit_type?: string | null;
}

export interface ResultTradesResponse {
  trades: ResultTrade[];
  pagination: Pagination;
}

export interface ReasoningEntry {
  candle_number: number;
  timestamp: string;
  decision: string;
  reasoning: string;
  indicator_values: Record<string, number>;
}

export interface ReasoningResponse {
  thoughts: ReasoningEntry[];
  pagination: Pagination;
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
      const response = await get<{ results: any[]; pagination: Pagination }>(
        `/api/results${query}`
      );
      return {
        results: response.results.map(mapListItem),
        pagination: response.pagination,
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
      return get<ResultTradesResponse>(`/api/results/${id}/trades${query}`);
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
      return get<ReasoningResponse>(`/api/results/${id}/reasoning${query}`);
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

