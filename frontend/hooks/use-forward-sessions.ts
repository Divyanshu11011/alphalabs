import { useState, useCallback, useEffect, useRef } from "react";
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

// Global request deduplication cache
const requestCache = new Map<string, { promise: Promise<ForwardActiveResponse>; timestamp: number }>();
const CACHE_TTL = 2000; // 2 seconds cache to prevent duplicate simultaneous requests

// Deep equality check for sessions array
function sessionsEqual(a: ForwardSession[], b: ForwardSession[]): boolean {
  if (a.length !== b.length) return false;
  
  // Create maps for quick lookup
  const aMap = new Map(a.map(s => [s.id, s]));
  const bMap = new Map(b.map(s => [s.id, s]));
  
  // Check if all sessions in a exist in b with same values
  for (const session of a) {
    const other = bMap.get(session.id);
    if (!other) return false;
    
    // Compare all relevant fields
    if (
      session.agentId !== other.agentId ||
      session.agentName !== other.agentName ||
      session.asset !== other.asset ||
      session.status !== other.status ||
      session.startedAt !== other.startedAt ||
      session.durationDisplay !== other.durationDisplay ||
      Math.abs(session.currentPnlPct - other.currentPnlPct) > 0.0001 || // Float comparison
      session.tradesCount !== other.tradesCount ||
      Math.abs(session.winRate - other.winRate) > 0.0001 // Float comparison
    ) {
      return false;
    }
  }
  
  // Check if b has any sessions not in a
  for (const session of b) {
    if (!aMap.has(session.id)) return false;
  }
  
  return true;
}

export function useForwardSessions(pollInterval = 15000) {
  const { get } = useApiClient();
  const [sessions, setSessions] = useState<ForwardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousSessionsRef = useRef<ForwardSession[]>([]);

  const fetchSessions = useCallback(async () => {
    const cacheKey = "/api/arena/forward/active";
    const now = Date.now();
    
    // Check cache for recent request
    const cached = requestCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      try {
        const response = await cached.promise;
        if (isMountedRef.current) {
          const newSessions = response.sessions.map(mapSession);
          // Only update if data actually changed
          if (!sessionsEqual(newSessions, previousSessionsRef.current)) {
            previousSessionsRef.current = newSessions;
            setSessions(newSessions);
          }
          setIsLoading(false);
        }
        return;
      } catch (err) {
        // Cache failed, continue with new request
        requestCache.delete(cacheKey);
      }
    }

    // Create new request and cache it
    setIsLoading(true);
    setError(null);
    
    const requestPromise = get<ForwardActiveResponse>(cacheKey);
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });
    
    // Clean up old cache entries
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        requestCache.delete(key);
      }
    }

    try {
      const response = await requestPromise;
      if (isMountedRef.current) {
        const newSessions = response.sessions.map(mapSession);
        // Only update if data actually changed (memoization)
        if (!sessionsEqual(newSessions, previousSessionsRef.current)) {
          previousSessionsRef.current = newSessions;
          setSessions(newSessions);
        }
        setIsLoading(false);
      }
    } catch (err) {
      requestCache.delete(cacheKey);
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

