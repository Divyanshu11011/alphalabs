import { useState, useCallback, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/api";
import type { ForwardSession } from "./use-forward-sessions";

interface BacktestActiveResponse {
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

const mapSession = (session: BacktestActiveResponse["sessions"][number]): ForwardSession => ({
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

// Deep equality check for sessions array (reuse from use-forward-sessions logic)
function sessionsEqual(a: ForwardSession[], b: ForwardSession[]): boolean {
  if (a.length !== b.length) return false;
  
  const aMap = new Map(a.map(s => [s.id, s]));
  const bMap = new Map(b.map(s => [s.id, s]));
  
  for (const session of a) {
    const other = bMap.get(session.id);
    if (!other) return false;
    
    if (
      session.agentId !== other.agentId ||
      session.agentName !== other.agentName ||
      session.asset !== other.asset ||
      session.status !== other.status ||
      session.startedAt !== other.startedAt ||
      session.durationDisplay !== other.durationDisplay ||
      Math.abs(session.currentPnlPct - other.currentPnlPct) > 0.0001 ||
      session.tradesCount !== other.tradesCount ||
      Math.abs(session.winRate - other.winRate) > 0.0001
    ) {
      return false;
    }
  }
  
  for (const session of b) {
    if (!aMap.has(session.id)) return false;
  }
  
  return true;
}

export function useBacktestSessions(pollInterval = 15000) {
  const { get } = useApiClient();
  const [sessions, setSessions] = useState<ForwardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousSessionsRef = useRef<ForwardSession[]>([]);

  const fetchSessions = useCallback(async () => {
    const cacheKey = "/api/arena/backtest/active";
    const now = Date.now();
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await get<BacktestActiveResponse>(cacheKey);
      if (isMountedRef.current) {
        const newSessions = response.sessions.map(mapSession);
        // Only update if data actually changed
        if (!sessionsEqual(newSessions, previousSessionsRef.current)) {
          previousSessionsRef.current = newSessions;
          setSessions(newSessions);
        }
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to load sessions";
        setError(message);
        setIsLoading(false);
      }
    }
  }, [get]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchSessions();
    
    if (pollInterval > 0) {
      intervalRef.current = setInterval(() => {
        void fetchSessions();
      }, pollInterval);
    }
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSessions, pollInterval]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions,
  };
}

