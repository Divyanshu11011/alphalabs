/**
 * Shared WebSocket Connection Manager
 * 
 * Prevents multiple WebSocket connections to the same session by sharing
 * a single connection across all components that need it.
 */

// No imports needed - token is passed as a function

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:5000";

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

type EventHandler = (event: WebSocketEvent) => void;
export type SessionType = "backtest" | "forward";

interface ConnectionState {
  ws: WebSocket;
  sessionId: string;
  sessionType: SessionType;
  subscribers: Set<EventHandler>;
  reconnectAttempts: number;
  isConnecting: boolean;
  reconnectTimeout: NodeJS.Timeout | null;
}

class WebSocketManager {
  private connections: Map<string, ConnectionState> = new Map();
  private maxReconnectAttempts = 5;

  /**
   * Get connection key from session type and ID
   */
  private getConnectionKey(sessionType: SessionType, sessionId: string): string {
    return `${sessionType}:${sessionId}`;
  }

  /**
   * Subscribe to a WebSocket connection for a session
   * Returns a cleanup function to unsubscribe
   */
  async subscribe(
    sessionType: SessionType,
    sessionId: string,
    onEvent: EventHandler,
    getTokenFn: () => Promise<string | null>
  ): Promise<() => void> {
    const connectionKey = this.getConnectionKey(sessionType, sessionId);
    
    // If connection already exists, just add subscriber
    const existing = this.connections.get(connectionKey);
    if (existing) {
      existing.subscribers.add(onEvent);
      return () => {
        existing.subscribers.delete(onEvent);
        // If no more subscribers, close connection after a delay
        if (existing.subscribers.size === 0) {
          setTimeout(() => {
            const conn = this.connections.get(connectionKey);
            if (conn && conn.subscribers.size === 0) {
              this.disconnect(sessionType, sessionId);
            }
          }, 1000); // Give a small delay in case component remounts quickly
        }
      };
    }

    // Create new connection
    const token = await getTokenFn();
    if (!token) {
      throw new Error("Authentication required");
    }

    const wsUrl = `${WS_BASE_URL}/ws/${sessionType}/${sessionId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    const state: ConnectionState = {
      ws,
      sessionId,
      sessionType,
      subscribers: new Set([onEvent]),
      reconnectAttempts: 0,
      isConnecting: true,
      reconnectTimeout: null,
    };

    this.connections.set(connectionKey, state);

    ws.onopen = () => {
      state.isConnecting = false;
      state.reconnectAttempts = 0;
      console.log(`[WS Manager] Connected to ${sessionType} session ${sessionId} (${state.subscribers.size} subscribers)`);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketEvent = JSON.parse(event.data);
        // Broadcast to all subscribers
        state.subscribers.forEach((handler) => {
          try {
            handler(message);
          } catch (err) {
            console.error("[WS Manager] Error in subscriber handler:", err);
          }
        });
      } catch (err) {
        console.error("[WS Manager] Error parsing message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error(`[WS Manager] WebSocket error for session ${sessionId}:`, err);
      state.isConnecting = false;
    };

    ws.onclose = (event) => {
      state.isConnecting = false;
      console.log(`[WS Manager] WebSocket closed for ${sessionType} session ${sessionId}`, event.code, event.reason);

      // Only reconnect if not a normal closure and we still have subscribers
      if (
        event.code !== 1000 &&
        event.code !== 1001 &&
        state.reconnectAttempts < this.maxReconnectAttempts &&
        state.subscribers.size > 0
      ) {
        state.reconnectAttempts += 1;
        const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
        console.log(
          `[WS Manager] Reconnecting to ${sessionType} session ${sessionId} in ${delay}ms (attempt ${state.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        state.reconnectTimeout = setTimeout(async () => {
          if (state.subscribers.size === 0) return; // No subscribers, don't reconnect

          try {
            const token = await getTokenFn();
            if (!token) return;

            const wsUrl = `${WS_BASE_URL}/ws/${sessionType}/${sessionId}?token=${encodeURIComponent(token)}`;
            const newWs = new WebSocket(wsUrl);

            // Update state with new connection
            state.ws = newWs;
            state.isConnecting = true;

            newWs.onopen = () => {
              state.isConnecting = false;
              state.reconnectAttempts = 0;
              console.log(`[WS Manager] Reconnected to ${sessionType} session ${sessionId}`);
            };

            newWs.onmessage = (event) => {
              try {
                const message: WebSocketEvent = JSON.parse(event.data);
                state.subscribers.forEach((handler) => {
                  try {
                    handler(message);
                  } catch (err) {
                    console.error("[WS Manager] Error in subscriber handler:", err);
                  }
                });
              } catch (err) {
                console.error("[WS Manager] Error parsing message:", err);
              }
            };

            newWs.onerror = (err) => {
              console.error(`[WS Manager] WebSocket error for ${sessionType} session ${sessionId}:`, err);
              state.isConnecting = false;
            };

            newWs.onclose = ws.onclose; // Reuse the same close handler
          } catch (err) {
            console.error(`[WS Manager] Error reconnecting to ${sessionType} session ${sessionId}:`, err);
            state.isConnecting = false;
          }
        }, delay);
      }
    };

    // Return unsubscribe function
    return () => {
      state.subscribers.delete(onEvent);
      // If no more subscribers, close connection after a delay
      if (state.subscribers.size === 0) {
        setTimeout(() => {
          const conn = this.connections.get(connectionKey);
          if (conn && conn.subscribers.size === 0) {
            this.disconnect(sessionType, sessionId);
          }
        }, 1000);
      }
    };
  }

  /**
   * Disconnect and remove a connection
   */
  disconnect(sessionType: SessionType, sessionId: string): void {
    const connectionKey = this.getConnectionKey(sessionType, sessionId);
    const state = this.connections.get(connectionKey);
    if (!state) return;

    if (state.reconnectTimeout) {
      clearTimeout(state.reconnectTimeout);
    }

    state.ws.onclose = null;
    state.ws.onerror = null;
    state.ws.close();
    this.connections.delete(connectionKey);
    console.log(`[WS Manager] Disconnected from ${sessionType} session ${sessionId}`);
  }

  /**
   * Check if a connection exists and is connected
   */
  isConnected(sessionType: SessionType, sessionId: string): boolean {
    const connectionKey = this.getConnectionKey(sessionType, sessionId);
    const state = this.connections.get(connectionKey);
    return state?.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(sessionType: SessionType, sessionId: string): {
    isConnected: boolean;
    isConnecting: boolean;
    subscriberCount: number;
  } | null {
    const connectionKey = this.getConnectionKey(sessionType, sessionId);
    const state = this.connections.get(connectionKey);
    if (!state) return null;

    return {
      isConnected: state.ws.readyState === WebSocket.OPEN,
      isConnecting: state.isConnecting,
      subscriberCount: state.subscribers.size,
    };
  }

  /**
   * Disconnect all connections (cleanup)
   */
  disconnectAll(): void {
    this.connections.forEach((state) => {
      this.disconnect(state.sessionType, state.sessionId);
    });
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();

