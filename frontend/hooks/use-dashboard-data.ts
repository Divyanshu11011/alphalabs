import { useApiClient } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityItem, DashboardStats, QuickStartStep } from "@/types";

interface DashboardDataState {
  stats: DashboardStats | null;
  averageProfit: number | null;
  activity: ActivityItem[];
  quickStartSteps: QuickStartStep[];
  quickStartProgress: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface DashboardStatsResponse {
  stats: {
    total_agents: number;
    tests_run: number;
    best_pnl: number | string | null;
    avg_win_rate: number | string | null;
    trends: {
      agents_this_week: number;
      tests_today: number;
      win_rate_change: number | null;
    };
    best_agent?: {
      id: string;
      name: string;
    } | null;
  };
}

interface ResultsStatsResponse {
  stats: {
    avg_pnl: number | string | null;
  };
}

interface ActivityResponse {
  activity: Array<{
    id: string;
    type: string;
    agent_name?: string | null;
    description: string;
    timestamp: string;
    pnl?: number | string | null;
    result_id?: string | null;
    action_url?: string | null;
  }>;
}

interface QuickStartResponse {
  steps: Array<{
    id: string;
    label: string;
    description: string;
    is_complete: boolean;
    href: string;
    cta_text: string;
  }>;
  progress_pct: number;
}

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const mapStats = (payload: DashboardStatsResponse["stats"]): DashboardStats => ({
  totalAgents: payload.total_agents,
  testsRun: payload.tests_run,
  bestPnL: toNumber(payload.best_pnl) ?? undefined,
  avgWinRate: toNumber(payload.avg_win_rate) ?? undefined,
  trends: {
    agentsThisWeek: payload.trends.agents_this_week,
    testsToday: payload.trends.tests_today,
    winRateChange: payload.trends.win_rate_change ?? undefined,
  },
  bestAgent: payload.best_agent
    ? {
        id: payload.best_agent.id,
        name: payload.best_agent.name,
      }
    : undefined,
});

const mapActivity = (item: ActivityResponse["activity"][number]): ActivityItem => ({
  id: item.id,
  type: item.type as ActivityItem["type"],
  agentName: item.agent_name ?? "Unknown Agent",
  description: item.description,
  timestamp: new Date(item.timestamp),
  pnl: toNumber(item.pnl) ?? undefined,
  resultId: item.result_id ?? undefined,
  actionUrl: item.action_url ?? undefined,
});

const mapQuickStart = (item: QuickStartResponse["steps"][number]): QuickStartStep => ({
  id: item.id,
  label: item.label,
  description: item.description,
  isComplete: item.is_complete,
  href: item.href,
  ctaText: item.cta_text,
});

export function useDashboardData(): DashboardDataState {
  const { get } = useApiClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [averageProfit, setAverageProfit] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [quickStartSteps, setQuickStartSteps] = useState<QuickStartStep[]>([]);
  const [quickStartProgress, setQuickStartProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, resultsRes, activityRes, quickStartRes] = await Promise.all([
        get<DashboardStatsResponse>("/api/dashboard/stats"),
        get<ResultsStatsResponse>("/api/results/stats"),
        get<ActivityResponse>("/api/dashboard/activity?limit=5"),
        get<QuickStartResponse>("/api/dashboard/quick-start"),
      ]);

      setStats(mapStats(statsRes.stats));
      setAverageProfit(toNumber(resultsRes.stats?.avg_pnl) ?? null);
      setActivity(activityRes.activity.map(mapActivity));
      setQuickStartSteps(quickStartRes.steps.map(mapQuickStart));
      setQuickStartProgress(quickStartRes.progress_pct ?? 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return useMemo(
    () => ({
      stats,
      averageProfit,
      activity,
      quickStartSteps,
      quickStartProgress,
      isLoading,
      error,
      refresh: fetchAll,
    }),
    [
      stats,
      averageProfit,
      activity,
      quickStartSteps,
      quickStartProgress,
      isLoading,
      error,
      fetchAll,
    ]
  );
}

