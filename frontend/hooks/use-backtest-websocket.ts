import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { websocketManager, type WebSocketEvent as ManagerWebSocketEvent } from "@/lib/websocket-manager";

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
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onEventRef = useRef(onEvent);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Keep the ref updated with the latest callback without triggering reconnections
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  
  // Clear processed messages when session changes
  useEffect(() => {
    processedMessagesRef.current.clear();
  }, [sessionId]);

  // Handle WebSocket events with state management
  const handleWebSocketEvent = useCallback((message: ManagerWebSocketEvent) => {
    // Create a unique key for deduplication based on event type and identifying data
    let messageKey: string;
    if (message.type === "ai_decision" || message.type === "candle") {
      // Use candle_index for these events
      const candleIndex = message.data?.candle_index ?? message.data?.candle_number ?? -1;
      messageKey = `${message.type}-${candleIndex}-${message.timestamp || Date.now()}`;
    } else if (message.type === "stats_update") {
      // Use current_candle for stats updates
      const candleIndex = message.data?.current_candle ?? -1;
      messageKey = `${message.type}-${candleIndex}-${message.timestamp || Date.now()}`;
    } else {
      // For other events, use type + timestamp
      messageKey = `${message.type}-${message.timestamp || Date.now()}`;
    }
    
    // Skip if we've already processed this message
    if (processedMessagesRef.current.has(messageKey)) {
      console.debug(`Skipping duplicate message: ${messageKey}`);
      return;
    }
    
    // Mark as processed
    processedMessagesRef.current.add(messageKey);
    
    // Clean up old messages (keep only last 1000 to prevent memory leak)
    if (processedMessagesRef.current.size > 1000) {
      const entries = Array.from(processedMessagesRef.current);
      processedMessagesRef.current = new Set(entries.slice(-500));
    }
    
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
  }, []);

  const reconnect = useCallback(() => {
    if (sessionId) {
      // Disconnect and let the effect reconnect
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      websocketManager.disconnect("backtest", sessionId);
      // Trigger reconnection by updating state
      setIsConnected(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      // Clean up if sessionId is cleared
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsConnected(false);
      setSessionState(null);
      setError(null);
      return;
    }

    // Subscribe to shared WebSocket connection
    let mounted = true;
    let connectionCheckInterval: NodeJS.Timeout | null = null;
    
    websocketManager
      .subscribe("backtest", sessionId, handleWebSocketEvent, getToken)
      .then((unsubscribe) => {
        if (mounted) {
          unsubscribeRef.current = unsubscribe;
          // Check connection state
          const state = websocketManager.getConnectionState("backtest", sessionId);
          if (state) {
            setIsConnected(state.isConnected);
          }
          
          // Poll connection state (since we can't directly listen to it)
          connectionCheckInterval = setInterval(() => {
            const currentState = websocketManager.getConnectionState("backtest", sessionId);
            if (currentState && mounted) {
              setIsConnected(currentState.isConnected);
            }
          }, 1000);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Error subscribing to WebSocket:", err);
          setError(err instanceof Error ? err.message : "Failed to connect");
          setIsConnected(false);
        }
      });

    return () => {
      mounted = false;
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [sessionId, handleWebSocketEvent, getToken]);

  return {
    isConnected,
    sessionState,
    error,
    reconnect,
  };
}

