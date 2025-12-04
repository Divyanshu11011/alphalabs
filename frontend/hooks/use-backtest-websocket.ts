import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:5000";

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface BacktestSessionState {
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

export interface UseBacktestWebSocketReturn {
  isConnected: boolean;
  sessionState: BacktestSessionState | null;
  error: string | null;
  reconnect: () => void;
}

export function useBacktestWebSocket(
  sessionId: string | null,
  onEvent?: (event: WebSocketEvent) => void
): UseBacktestWebSocketReturn {
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<BacktestSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    if (!sessionId) return;

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Build WebSocket URL with token
      const wsUrl = `${WS_BASE_URL}/ws/backtest/${sessionId}?token=${encodeURIComponent(token)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log(`WebSocket connected for session ${sessionId}`);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          
          // Handle different event types
          switch (message.type) {
            case "session_initialized":
              // Session is ready
              if (message.data.config) {
                setSessionState((prev) => ({
                  ...prev,
                  status: "running",
                  totalCandles: message.data.config.total_candles || 0,
                } as BacktestSessionState));
              }
              break;

            case "candle":
              // New candle processed
              setSessionState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  currentCandle: message.data.candle_index || message.data.candle_number || (prev.currentCandle + 1),
                  progressPct: prev.totalCandles > 0 
                    ? ((message.data.candle_index || message.data.candle_number || prev.currentCandle + 1) / prev.totalCandles) * 100
                    : 0,
                };
              });
              break;

            case "stats_update":
              // Stats updated
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
              // Position opened
              if (message.data) {
                setSessionState((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    openPosition: {
                      type: message.data.type?.toLowerCase() === "short" ? "short" : "long",
                      entry_price: message.data.entry_price || 0,
                      unrealized_pnl: message.data.unrealized_pnl || 0,
                    },
                  };
                });
              }
              break;

            case "position_closed":
              // Position closed
              setSessionState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  openPosition: null,
                };
              });
              break;

            case "session_completed":
              // Session finished
              setSessionState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  status: "completed",
                  progressPct: 100,
                };
              });
              break;

            case "session_paused":
              setSessionState((prev) => {
                if (!prev) return prev;
                return { ...prev, status: "paused" };
              });
              break;

            case "session_resumed":
              setSessionState((prev) => {
                if (!prev) return prev;
                return { ...prev, status: "running" };
              });
              break;

            case "error":
              setError(message.data.message || "WebSocket error occurred");
              break;

            case "heartbeat":
              // Just acknowledge, no state change needed
              break;
          }

          // Call custom event handler if provided
          if (onEvent) {
            onEvent(message);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.log(`WebSocket closed for session ${sessionId}`, event.code, event.reason);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Failed to reconnect after multiple attempts");
        }
      };
    } catch (err) {
      console.error("Error connecting WebSocket:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnected(false);
    }
  }, [sessionId, getToken, onEvent]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (sessionId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [sessionId, connect]);

  return {
    isConnected,
    sessionState,
    error,
    reconnect,
  };
}

