import { useState, useCallback, useEffect } from "react";
import { useApiClient } from "@/lib/api";

export interface ForwardSession {
  id: string;
  agentId: string;
  agentName: string;
  asset: string;
  status: "running" | "paused" | "initializing";
  startedAt: string;
  durationDisplay: string;
  currentPnlPct: number;
  tradesCount: number;
  winRate: number;
}

interface ForwardActiveResponse {
  sessions: Array<{
    id: string;
    agent_id: string;
    agent_name: string;
    asset: string;
    status: "running" | "paused" | "initializing";
    started_at: string;
    duration_display: string;
    current_pnl_pct: number;
    trades_count: number;
    win_rate: number;
  }>;
}

const mapSession = (session: ForwardActiveResponse["sessions"][number]): ForwardSession => ({
  id: session.id,
  agentId: session.agent_id,
  agentName: session.agent_name,
  asset: session.asset,
  status: session.status,
  startedAt: session.started_at,
  durationDisplay: session.duration_display,
  currentPnlPct: session.current_pnl_pct,
  tradesCount: session.trades_count,
  winRate: session.win_rate,
});

export function useForwardSessions(pollInterval = 15000) {
  const { get } = useApiClient();
  const [sessions, setSessions] = useState<ForwardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await get<ForwardActiveResponse>("/api/arena/forward/active");
      setSessions(response.sessions.map(mapSession));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load sessions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchSessions();
    if (!pollInterval) {
      return;
    }
    const id = setInterval(() => {
      void fetchSessions();
    }, pollInterval);
    return () => clearInterval(id);
  }, [fetchSessions, pollInterval]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions,
  };
}

