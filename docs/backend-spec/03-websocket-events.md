# AlphaLab Backend Specification
## Part 3: WebSocket Events

---

## 🏗️ WEBSOCKET ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WEBSOCKET CONNECTIONS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CLIENT (Next.js)                         SERVER (FastAPI)                      │
│  ─────────────────                        ────────────────                      │
│                                                                                  │
│  ┌──────────────┐                         ┌──────────────┐                      │
│  │              │    wss://api/ws/        │              │                      │
│  │   Browser    │ ◄───────────────────────► WebSocket    │                      │
│  │   Client     │    bidirectional        │   Handler    │                      │
│  │              │                         │              │                      │
│  └──────────────┘                         └──────────────┘                      │
│                                                  │                               │
│                                                  ▼                               │
│                                           ┌──────────────┐                      │
│                                           │   Session    │                      │
│                                           │   Manager    │                      │
│                                           └──────────────┘                      │
│                                                  │                               │
│                                    ┌─────────────┼─────────────┐                │
│                                    ▼             ▼             ▼                │
│                              ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│                              │ Backtest │ │ Forward  │ │   Live   │            │
│                              │  Engine  │ │  Engine  │ │  Prices  │            │
│                              └──────────┘ └──────────┘ └──────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 CONNECTION ENDPOINTS

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `wss://api/ws/backtest/{session_id}` | Backtest battle events | Yes |
| `wss://api/ws/forward/{session_id}` | Forward test events | Yes |
| `wss://api/ws/prices/{asset}` | Live price feed | No |

---

## 🔐 AUTHENTICATION

WebSocket connections authenticated via query parameter:

```
wss://api.alphalab.io/ws/backtest/{session_id}?token={clerk_jwt}
```

**Connection Flow:**
```python
from fastapi import WebSocket, WebSocketDisconnect, Query

async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...)
):
    # 1. Verify JWT token
    try:
        payload = await verify_clerk_token(f"Bearer {token}")
        user_id = get_user_id_from_token(payload)
    except:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    # 2. Verify session belongs to user
    session = await get_session(session_id)
    if not session or session.user_id != user_id:
        await websocket.close(code=4003, reason="Access denied")
        return
    
    # 3. Accept connection
    await websocket.accept()
    
    # 4. Register in session manager
    await session_manager.connect(session_id, websocket)
```

---

## 📨 MESSAGE FORMAT

All WebSocket messages use JSON with consistent structure:

**Server → Client:**
```json
{
  "event": "event_name",
  "data": { /* event-specific payload */ },
  "timestamp": "2025-11-27T10:15:00.000Z"
}
```

**Client → Server:**
```json
{
  "action": "action_name",
  "data": { /* action-specific payload */ }
}
```

---

## ⚔️ BACKTEST EVENTS

### Server → Client Events

#### `session_initialized`
Sent when backtest is ready to run.

```json
{
  "event": "session_initialized",
  "data": {
    "session_id": "uuid",
    "agent_name": "α-prime",
    "asset": "BTC/USDT",
    "timeframe": "1h",
    "total_candles": 720,
    "start_date": "2025-10-01T00:00:00Z",
    "end_date": "2025-11-01T00:00:00Z",
    "starting_capital": 10000.00,
    "playback_speed": "normal"
  }
}
```

---

#### `candle`
New candle data with indicators.

```json
{
  "event": "candle",
  "data": {
    "index": 234,
    "total": 720,
    "progress_pct": 32.5,
    "candle": {
      "time": 1727740800000,
      "open": 67150.00,
      "high": 67320.00,
      "low": 66980.00,
      "close": 67200.00,
      "volume": 12450.50
    },
    "indicators": {
      "rsi_14": 28.0,
      "macd": 0.02,
      "macd_signal": -0.05,
      "macd_histogram": 0.07,
      "ema_20": 67890.00,
      "ema_50": 67200.00,
      "atr_14": 450.00,
      "volume_sma": 10200.00
    }
  }
}
```

---

#### `ai_thinking`
AI reasoning stream (can be multiple messages).

```json
{
  "event": "ai_thinking",
  "data": {
    "candle_index": 234,
    "text": "RSI at 28 indicates oversold conditions. MACD histogram is turning positive...",
    "is_complete": false
  }
}
```

Final message:
```json
{
  "event": "ai_thinking",
  "data": {
    "candle_index": 234,
    "text": "RSI at 28 indicates oversold conditions. MACD histogram is turning positive, suggesting momentum shift. I am entering a LONG position with 1% risk.",
    "is_complete": true
  }
}
```

---

#### `ai_decision`
Final AI decision for candle.

```json
{
  "event": "ai_decision",
  "data": {
    "candle_index": 234,
    "action": "long",
    "reasoning": "RSI oversold + MACD bullish crossover",
    "confidence": 78.5,
    "order": {
      "type": "long",
      "entry_price": 64200.00,
      "size": 0.5,
      "leverage": 1,
      "stop_loss": 63500.00,
      "take_profit": 65500.00
    }
  }
}
```

**Action Values:** `long`, `short`, `hold`, `close`

---

#### `position_opened`
New position opened.

```json
{
  "event": "position_opened",
  "data": {
    "trade_id": "uuid",
    "type": "long",
    "entry_price": 64200.00,
    "size": 0.5,
    "leverage": 1,
    "stop_loss": 63500.00,
    "take_profit": 65500.00,
    "candle_index": 234,
    "timestamp": "2025-10-15T14:00:00Z"
  }
}
```

---

#### `position_closed`
Position closed (TP/SL/Signal).

```json
{
  "event": "position_closed",
  "data": {
    "trade_id": "uuid",
    "type": "long",
    "entry_price": 64200.00,
    "exit_price": 65500.00,
    "exit_type": "take_profit",
    "pnl_amount": 650.00,
    "pnl_pct": 2.03,
    "candle_index": 240,
    "timestamp": "2025-10-15T20:00:00Z"
  }
}
```

**Exit Types:** `take_profit`, `stop_loss`, `signal`, `manual`

---

#### `stats_update`
Updated session statistics.

```json
{
  "event": "stats_update",
  "data": {
    "equity": 10650.00,
    "pnl_amount": 650.00,
    "pnl_pct": 6.50,
    "trades_total": 5,
    "trades_won": 3,
    "trades_lost": 2,
    "win_rate": 60.00,
    "max_drawdown_pct": -1.2,
    "current_position": {
      "type": "long",
      "entry_price": 64200.00,
      "unrealized_pnl": 1.5
    }
  }
}
```

---

#### `session_paused`
Session paused by user.

```json
{
  "event": "session_paused",
  "data": {
    "paused_at": "2025-11-27T10:15:00Z",
    "current_candle": 234,
    "current_equity": 10650.00
  }
}
```

---

#### `session_resumed`
Session resumed.

```json
{
  "event": "session_resumed",
  "data": {
    "resumed_at": "2025-11-27T10:20:00Z"
  }
}
```

---

#### `session_completed`
Backtest finished.

```json
{
  "event": "session_completed",
  "data": {
    "session_id": "uuid",
    "result_id": "uuid",
    "final_stats": {
      "ending_capital": 12340.00,
      "total_pnl_pct": 23.4,
      "total_trades": 45,
      "winning_trades": 28,
      "losing_trades": 17,
      "win_rate": 62.22,
      "max_drawdown_pct": -4.2,
      "sharpe_ratio": 1.8,
      "profit_factor": 2.1
    },
    "is_profitable": true,
    "can_generate_certificate": true
  }
}
```

---

#### `session_error`
Error occurred during session.

```json
{
  "event": "session_error",
  "data": {
    "error_code": "AI_API_ERROR",
    "message": "OpenRouter API rate limit exceeded",
    "candle_index": 234,
    "recoverable": true
  }
}
```

---

### Client → Server Actions

#### `pause`
Pause the backtest.

```json
{
  "action": "pause",
  "data": {}
}
```

---

#### `resume`
Resume paused backtest.

```json
{
  "action": "resume",
  "data": {}
}
```

---

#### `stop`
Stop the backtest.

```json
{
  "action": "stop",
  "data": {
    "close_position": true
  }
}
```

---

#### `change_speed`
Change playback speed.

```json
{
  "action": "change_speed",
  "data": {
    "speed": "fast"
  }
}
```

**Speed Values:** `slow` (1000ms), `normal` (500ms), `fast` (200ms), `instant` (0ms)

---

## ▶️ FORWARD TEST EVENTS

### Server → Client Events

#### `session_started`
Forward test started.

```json
{
  "event": "session_started",
  "data": {
    "session_id": "uuid",
    "agent_name": "α-prime",
    "asset": "BTC/USDT",
    "timeframe": "1h",
    "starting_capital": 10000.00,
    "started_at": "2025-11-27T10:00:00Z"
  }
}
```

---

#### `price_update`
Real-time price tick.

```json
{
  "event": "price_update",
  "data": {
    "price": 67890.45,
    "change_24h_pct": 1.2,
    "volume_24h": 45000.50,
    "timestamp": "2025-11-27T10:15:30.500Z"
  }
}
```

---

#### `candle_closed`
Timeframe candle closed (AI will evaluate).

```json
{
  "event": "candle_closed",
  "data": {
    "candle": {
      "time": 1732705200000,
      "open": 67800.00,
      "high": 68100.00,
      "low": 67650.00,
      "close": 67890.00,
      "volume": 2450.50
    },
    "indicators": {
      "rsi_14": 52.0,
      "macd": 0.08
    },
    "ai_evaluating": true
  }
}
```

---

#### `countdown_update`
Time until next candle close.

```json
{
  "event": "countdown_update",
  "data": {
    "seconds_remaining": 2205,
    "next_candle_at": "2025-11-27T11:00:00Z",
    "display": "36:45"
  }
}
```

---

#### `ai_decision`
Same as backtest (see above).

---

#### `position_opened`
Same as backtest (see above).

---

#### `position_closed`
Same as backtest (see above).

---

#### `position_update`
Unrealized PnL update for open position.

```json
{
  "event": "position_update",
  "data": {
    "current_price": 67890.00,
    "entry_price": 67234.00,
    "unrealized_pnl_amount": 656.00,
    "unrealized_pnl_pct": 0.97,
    "distance_to_sl_pct": -1.1,
    "distance_to_tp_pct": 2.6
  }
}
```

---

#### `stats_update`
Same as backtest (see above).

---

#### `session_stopped`
Forward test stopped by user.

```json
{
  "event": "session_stopped",
  "data": {
    "session_id": "uuid",
    "result_id": "uuid",
    "stopped_at": "2025-11-28T14:23:15Z",
    "reason": "user_requested",
    "position_closed": true,
    "final_stats": {
      "duration_seconds": 101595,
      "duration_display": "28h 13m",
      "total_pnl_pct": 8.2,
      "total_trades": 12,
      "win_rate": 66.67
    }
  }
}
```

---

#### `auto_stopped`
Forward test auto-stopped due to limits.

```json
{
  "event": "auto_stopped",
  "data": {
    "session_id": "uuid",
    "result_id": "uuid",
    "reason": "max_loss_exceeded",
    "threshold": -10.00,
    "actual": -10.5,
    "final_stats": { /* ... */ }
  }
}
```

**Reasons:** `max_loss_exceeded`, `max_drawdown_exceeded`, `api_error`, `system_error`

---

### Client → Server Actions

#### `stop`
Stop forward test.

```json
{
  "action": "stop",
  "data": {
    "close_position": true
  }
}
```

---

## 📈 LIVE PRICE FEED

Public endpoint for real-time prices.

### Connection
```
wss://api.alphalab.io/ws/prices/btc-usdt
```

### Events

#### `price`
```json
{
  "event": "price",
  "data": {
    "asset": "BTC/USDT",
    "price": 67890.45,
    "bid": 67890.00,
    "ask": 67891.00,
    "change_24h": 1.2,
    "high_24h": 68500.00,
    "low_24h": 66800.00,
    "volume_24h": 45000.50,
    "timestamp": "2025-11-27T10:15:30.500Z"
  }
}
```

#### `heartbeat`
```json
{
  "event": "heartbeat",
  "data": {
    "server_time": "2025-11-27T10:15:30.500Z"
  }
}
```

---

## 🔄 CONNECTION MANAGEMENT

### Reconnection Strategy (Client)

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string, token: string) {
    this.ws = new WebSocket(`${url}?token=${token}`);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('Connected');
    };
    
    this.ws.onclose = (event) => {
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(url, token);
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  send(action: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, data }));
    }
  }
  
  close() {
    this.ws?.close(1000, 'User closed');
  }
}
```

### Server Heartbeat

Server sends heartbeat every 30 seconds:

```json
{
  "event": "heartbeat",
  "data": {
    "server_time": "2025-11-27T10:15:30.500Z"
  }
}
```

Client should respond within 10 seconds:

```json
{
  "action": "pong",
  "data": {}
}
```

---

## 🔒 CLOSE CODES

| Code | Meaning |
|------|---------|
| 1000 | Normal closure |
| 1001 | Going away (page unload) |
| 4001 | Invalid/expired token |
| 4003 | Access denied |
| 4004 | Session not found |
| 4005 | Session already completed |
| 4010 | Rate limited |
| 4500 | Server error |

---

## 📋 RATE LIMITS

| Endpoint | Limit |
|----------|-------|
| Backtest WS | 1 connection per session |
| Forward WS | 1 connection per session |
| Price feed | 5 connections per IP |
| Client actions | 10 per second |

---

**Continue to Part 4: Implementation Guide →**

