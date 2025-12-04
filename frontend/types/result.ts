// Result & Certificate Types

import type { TestType, Trade } from "./arena";

export interface TestResult {
  id: string;
  type: TestType;
  agentId: string;
  agentName: string;
  asset: string;
  mode: "monk" | "omni";
  date: Date;
  duration: string;
  trades: number;
  pnl: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  profitFactor?: number;
  avgTradeSize?: number;
  avgHoldingTime?: string;
}

export interface ResultDetail extends TestResult {
  startingCapital: number;
  endingCapital: number;
  totalTrades: Trade[];
  equityCurve: EquityPoint[];
  reasoningTrace: ReasoningEntry[];
  aiAnalysis?: string;
  config: {
    timeframe: string;
    safetyMode: boolean;
    leverage: boolean;
  };
}

export interface EquityPoint {
  timestamp: Date;
  equity: number;
  drawdown: number;
}

export interface Certificate {
  id: string;
  resultId: string;
  agentName: string;
  asset: string;
  mode: "monk" | "omni";
  testType: TestType;
  pnl: number;
  winRate: number;
  duration: string;
  trades: number;
  issuedAt: Date;
  verificationCode: string;
  verificationUrl: string;
}

export interface ResultFilters {
  search: string;
  type: "all" | "backtest" | "forward";
  result: "all" | "profitable" | "loss";
  agentId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ResultsStats {
  totalTests: number;
  profitable: number;
  profitablePercent: number;
  bestResult: number;
  avgPnL: number;
}

export interface ResultPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResultListItem {
  id: string;
  type: TestType;
  agentId: string;
  agentName: string;
  asset: string;
  mode: string;
  createdAt: string;
  durationDisplay?: string;
  totalTrades: number;
  totalPnlPct: number;
  winRate: number;
  maxDrawdownPct: number;
  sharpeRatio?: number;
  profitFactor?: number;
  isProfitable: boolean;
  hasCertificate: boolean;
}

export interface ResultListResponse {
  results: ResultListItem[];
  pagination: ResultPagination;
}

export interface ResultStatsPayload {
  total_tests: number;
  profitable: number;
  profitable_pct: number;
  best_result: number;
  worst_result?: number | null;
  avg_pnl: number;
  by_type: Record<string, { count: number; profitable: number }>;
}

export interface ResultStatsResponse {
  stats: ResultStatsPayload;
}

export interface ResultDetailResponse {
  result: {
    id: string;
    session_id: string;
    type: TestType;
    agent_id: string;
    agent_name: string;
    model: string;
    asset: string;
    mode: string;
    start_date: string | null;
    end_date: string | null;
    starting_capital: number;
    ending_capital: number;
    total_pnl_pct: number;
    total_trades: number;
    win_rate: number;
    max_drawdown_pct: number;
    sharpe_ratio?: number;
    profit_factor?: number;
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
  pagination: ResultPagination;
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
  pagination: ResultPagination;
}

