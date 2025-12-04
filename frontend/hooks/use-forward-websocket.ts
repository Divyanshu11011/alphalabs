"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:5000";

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface ForwardSessionState {
  status: "initializing" | "running" | "paused" | "completed" | "failed";
  currentCandle: number;
  totalCandles: number;
  progressPct: number;
  currentEquity: number;
  currentPnlPct: number;
  tradesCount: number;
  winRate: number;
  maxDrawdownPct: number;
  openPosition: {
    type: "long" | "short";
    entry_price: number;
    unrealized_pnl: number;
  } | null;
}

export interface UseForwardWebSocketReturn {
  isConnected: boolean;
  sessionState: ForwardSessionState | null;
  error: string | null;
  reconnect: () => void;
}

function createInitialSessionState(
  overrides?: Partial<ForwardSessionState>
): ForwardSessionState {
  return {
    status: "running",
    currentCandle: 0,
    totalCandles: 0,
    progressPct: 0,
    currentEquity: 0,
    currentPnlPct: 0,
    tradesCount: 0,
    winRate: 0,
    maxDrawdownPct: 0,
    openPosition: null,
    ...(overrides || {}),
  };
}

export function useForwardWebSocket(
  sessionId: string | null,
  onEvent?: (event: WebSocketEvent) => void
): UseForwardWebSocketReturn {
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<ForwardSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const onEventRef = useRef(onEvent);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const connect = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    if (isConnectingRef.current) {
      return;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onclose = null;
      ws.onerror = null;
      ws.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isConnectingRef.current = true;

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        isConnectingRef.current = false;
        return;
      }

      const wsUrl = `${WS_BASE_URL}/ws/forward/${currentSessionId}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);

          switch (message.type) {
            case "session_initialized": {
              const totalCandles =
                message.data.total_candles ??
                message.data.config?.total_candles ??
                0;
              setSessionState((prev) => ({
                ...(prev ?? createInitialSessionState()),
                status: "running",
                totalCandles,
              }));
              break;
            }
            case "candle": {
              setSessionState((prev) => {
                const base = prev ?? createInitialSessionState();
                const index = message.data.candle_index ?? message.data.candle_number ?? base.currentCandle + 1;
                const totalCandles = base.totalCandles || message.data.total_candles || 0;
                const progressPct =
                  totalCandles > 0 ? (index / totalCandles) * 100 : 0;
                return {
                  ...base,
                  currentCandle: index,
                  totalCandles,
                  progressPct,
                };
              });
              break;
            }
            case "stats_update":
              if (message.data) {
                setSessionState((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    currentEquity: message.data.current_equity ?? prev.currentEquity,
                    currentPnlPct: message.data.equity_change_pct ?? prev.currentPnlPct,
                    tradesCount: message.data.total_trades ?? prev.tradesCount,
                    winRate: message.data.win_rate ?? prev.winRate,
                  };
                });
              }
              break;
            case "position_opened":
              if (message.data) {
                setSessionState((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    openPosition: {
                      type: message.data.action?.toLowerCase() === "short" ? "short" : "long",
                      entry_price: message.data.entry_price || 0,
                      unrealized_pnl: message.data.unrealized_pnl || 0,
                    },
                  };
                });
              }
              break;
            case "position_closed":
              setSessionState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  openPosition: null,
                };
              });
              break;
            case "session_completed":
              setSessionState((prev) => {
                if (!prev) return prev;
                return { ...prev, status: "completed", progressPct: 100 };
              });
              break;
            case "session_paused":
              setSessionState((prev) => (prev ? { ...prev, status: "paused" } : prev));
              break;
            case "session_resumed":
              setSessionState((prev) => (prev ? { ...prev, status: "running" } : prev));
              break;
            case "error":
              setError(message.data.message || "WebSocket error occurred");
              break;
            case "heartbeat":
              break;
          }

          if (onEventRef.current) {
            onEventRef.current(message);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        setError("WebSocket connection error");
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        isConnectingRef.current = false;

        if (
          event.code !== 1000 &&
          event.code !== 1001 &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          sessionIdRef.current === currentSessionId
        ) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Failed to reconnect after multiple attempts");
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [getToken]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (!sessionId) {
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
      return;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        wsRef.current = null;
      }
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
    };
  }, [sessionId, connect]);

  return {
    isConnected,
    sessionState,
    error,
    reconnect,
  };
}

