"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { websocketManager, type WebSocketEvent as ManagerWebSocketEvent } from "@/lib/websocket-manager";

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
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Handle WebSocket events with state management
  const handleWebSocketEvent = useCallback((message: ManagerWebSocketEvent) => {
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
  }, []);

  const reconnect = useCallback(() => {
    if (sessionId) {
      // Disconnect and let the effect reconnect
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      websocketManager.disconnect("forward", sessionId);
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
      .subscribe("forward", sessionId, handleWebSocketEvent, getToken)
      .then((unsubscribe) => {
        if (mounted) {
          unsubscribeRef.current = unsubscribe;
          // Check connection state
          const state = websocketManager.getConnectionState("forward", sessionId);
          if (state) {
            setIsConnected(state.isConnected);
          }
          
          // Poll connection state (since we can't directly listen to it)
          connectionCheckInterval = setInterval(() => {
            const currentState = websocketManager.getConnectionState("forward", sessionId);
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

