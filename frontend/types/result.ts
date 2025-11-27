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

export interface ReasoningEntry {
  id: string;
  timestamp: Date;
  candle: number;
  indicators: Record<string, number>;
  reasoning: string;
  decision: "long" | "short" | "hold" | "close";
  confidence: number;
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

