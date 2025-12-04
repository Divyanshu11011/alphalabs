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

function createInitialSessionState(
  overrides?: Partial<BacktestSessionState>
): BacktestSessionState {
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
  const onEventRef = useRef(onEvent);
  const isConnectingRef = useRef(false);

  // Keep the ref updated with the latest callback without triggering reconnections
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const sessionIdRef = useRef(sessionId);
  
  // Keep sessionId ref updated
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const connect = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("Connection already in progress, skipping...");
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onclose = null; // Prevent reconnect loop
      ws.onerror = null;
      ws.close();
      wsRef.current = null;
    }

    // Clear any pending reconnect timeout
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

      // Build WebSocket URL with token
      const wsUrl = `${WS_BASE_URL}/ws/backtest/${currentSessionId}?token=${encodeURIComponent(token)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        console.log(`WebSocket connected for session ${currentSessionId}`);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          
          // Handle different event types
          switch (message.type) {
            case "session_initialized": {
              // Session is ready. Backend may send either a flat payload
              // with `total_candles` or a nested `config.total_candles`.
              const totalCandles =
                message.data.total_candles ??
                message.data.config?.total_candles ??
                0;

              setSessionState((prev) => {
                const base = prev ?? createInitialSessionState();
                return {
                  ...base,
                  status: "running",
                  totalCandles,
                };
              });
              break;
            }

            case "candle":
              // New candle processed
              setSessionState((prev) => {
                const indexFromMessage =
                  message.data.candle_index ??
                  message.data.candle_number ??
                  (prev ? prev.currentCandle + 1 : 0);

                const base = prev ?? createInitialSessionState();
                const totalCandles =
                  base.totalCandles ||
                  message.data.total_candles ||
                  0;

                const progressPct =
                  totalCandles > 0
                    ? (indexFromMessage / totalCandles) * 100
                    : 0;

                return {
                  ...base,
                  currentCandle: indexFromMessage,
                  totalCandles,
                  progressPct,
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

          // Call custom event handler if provided (use ref to get latest callback)
          if (onEventRef.current) {
            onEventRef.current(message);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection error");
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        isConnectingRef.current = false;
        console.log(`WebSocket closed for session ${currentSessionId}`, event.code, event.reason);

        // Only attempt to reconnect if not a normal closure and sessionId hasn't changed
        if (
          event.code !== 1000 && 
          event.code !== 1001 && 
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          sessionIdRef.current === currentSessionId // Only reconnect if sessionId hasn't changed
        ) {
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
      // Clean up if sessionId is cleared
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

    // Connect when sessionId is available
      connect();

    return () => {
      // Cleanup on unmount or sessionId change
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onclose = null; // Prevent reconnect on cleanup
        ws.onerror = null;
        ws.close();
        wsRef.current = null;
      }
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only depend on sessionId, connect is stable

  return {
    isConnected,
    sessionState,
    error,
    reconnect,
  };
}

