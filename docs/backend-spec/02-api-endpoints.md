# AlphaLab Backend Specification
## Part 2: FastAPI Endpoints

---

## 🏗️ API ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ALPHALAB API STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  /api                                                                            │
│  ├── /health                    Health check                                    │
│  ├── /webhooks/clerk            Clerk webhook handler                           │
│  │                                                                               │
│  ├── /users                     User management                                  │
│  │   ├── /sync                  POST - Sync from Clerk                          │
│  │   ├── /me                    GET - Current user                              │
│  │   └── /me/settings           GET/PUT - User settings                         │
│  │                                                                               │
│  ├── /api-keys                  API key management                               │
│  │   ├── /                      GET - List, POST - Create                       │
│  │   ├── /{id}                  GET/PUT/DELETE - Single key                     │
│  │   ├── /{id}/validate         POST - Test key validity                        │
│  │   └── /{id}/set-default      POST - Set as default                           │
│  │                                                                               │
│  ├── /agents                    Agent CRUD                                       │
│  │   ├── /                      GET - List, POST - Create                       │
│  │   ├── /{id}                  GET/PUT/DELETE - Single agent                   │
│  │   ├── /{id}/duplicate        POST - Clone agent                              │
│  │   └── /{id}/stats            GET - Agent performance stats                   │
│  │                                                                               │
│  ├── /arena                     Test execution                                   │
│  │   ├── /backtest                                                               │
│  │   │   ├── /start             POST - Start backtest                           │
│  │   │   ├── /{id}              GET - Session status                            │
│  │   │   ├── /{id}/pause        POST - Pause                                    │
│  │   │   ├── /{id}/resume       POST - Resume                                   │
│  │   │   └── /{id}/stop         POST - Stop                                     │
│  │   │                                                                           │
│  │   └── /forward                                                                │
│  │       ├── /start             POST - Start forward test                       │
│  │       ├── /active            GET - List active sessions                      │
│  │       ├── /{id}              GET - Session status                            │
│  │       └── /{id}/stop         POST - Stop                                     │
│  │                                                                               │
│  ├── /results                   Test results                                     │
│  │   ├── /                      GET - List with filters                         │
│  │   ├── /stats                 GET - Aggregate stats                           │
│  │   ├── /{id}                  GET - Full result detail                        │
│  │   ├── /{id}/trades           GET - Trade list                                │
│  │   ├── /{id}/reasoning        GET - AI thoughts log                           │
│  │   └── /{id}/export           GET - Export data (CSV/JSON)                    │
│  │                                                                               │
│  ├── /certificates              Certificate generation                           │
│  │   ├── /                      POST - Generate certificate                     │
│  │   ├── /{id}                  GET - Certificate data                          │
│  │   ├── /{id}/pdf              GET - Download PDF                              │
│  │   ├── /{id}/image            GET - Download image                            │
│  │   └── /verify/{code}         GET - Public verification (no auth)             │
│  │                                                                               │
│  ├── /dashboard                 Dashboard data                                   │
│  │   ├── /stats                 GET - Overview stats                            │
│  │   ├── /activity              GET - Recent activity                           │
│  │   └── /quick-start           GET - Onboarding progress                       │
│  │                                                                               │
│  ├── /notifications             User notifications                               │
│  │   ├── /                      GET - List                                      │
│  │   ├── /unread-count          GET - Count                                     │
│  │   ├── /{id}/read             POST - Mark read                                │
│  │   ├── /mark-all-read         POST - Mark all read                            │
│  │   └── /clear                 DELETE - Clear all                              │
│  │                                                                               │
│  ├── /data                      Market data                                      │
│  │   ├── /assets                GET - Available assets                          │
│  │   ├── /timeframes            GET - Available timeframes                      │
│  │   ├── /candles               GET - Historical candles                        │
│  │   └── /indicators            GET - Calculate indicators                      │
│  │                                                                               │
│  └── /export                    Data export                                      │
│      └── /                      POST - Generate export package                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION

All endpoints except `/health`, `/webhooks/*`, and `/certificates/verify/*` require authentication.

**Headers:**
```
Authorization: Bearer <clerk_jwt_token>
```

**Dependency:**
```python
from fastapi import Depends, HTTPException, Header
from typing import Optional

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify Clerk JWT and return user data.
    Raises 401 if invalid/missing.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = await verify_clerk_token(token)
    user_id = get_user_id_from_token(payload)
    
    # Fetch user from DB
    user = await get_user_by_clerk_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
```

---

## 📋 ENDPOINT SPECIFICATIONS

---

### 🏥 Health Check

#### `GET /api/health`
```python
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "alphalab-api", "version": "1.0.0"}
```

---

### 👤 USER ENDPOINTS

#### `POST /api/users/sync`
Sync user from Clerk to Supabase.

**Request:** None (uses JWT)

**Response:**
```json
{
  "message": "User created" | "User updated",
  "user": {
    "id": "uuid",
    "clerk_id": "user_xxx",
    "email": "user@example.com",
    "first_name": "Alex",
    "last_name": "Verma",
    "username": "alexv",
    "image_url": "https://...",
    "plan": "free",
    "created_at": "2025-11-27T10:00:00Z"
  }
}
```

---

#### `GET /api/users/me`
Get current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "clerk_id": "user_xxx",
    "email": "user@example.com",
    "first_name": "Alex",
    "last_name": "Verma",
    "username": "alexv",
    "image_url": "https://...",
    "timezone": "Asia/Kolkata",
    "plan": "pro",
    "created_at": "2025-11-27T10:00:00Z"
  }
}
```

---

#### `GET /api/users/me/settings`
Get user settings.

**Response:**
```json
{
  "settings": {
    "theme": "dark",
    "accent_color": "cyan",
    "sidebar_collapsed": false,
    "chart_grid_lines": true,
    "chart_crosshair": true,
    "email_notifications": {
      "test_completed": true,
      "trade_executed": true,
      "daily_summary": false,
      "stop_loss_hit": true,
      "marketing": false
    },
    "inapp_notifications": {
      "show_toasts": true,
      "sound_effects": true,
      "desktop_notifications": false
    },
    "default_asset": "BTC/USDT",
    "default_timeframe": "1h",
    "default_capital": 10000.00,
    "default_playback_speed": "normal",
    "safety_mode_default": true,
    "allow_leverage_default": false,
    "max_position_size_pct": 50,
    "max_leverage": 5,
    "max_loss_per_trade_pct": 5.00,
    "max_daily_loss_pct": 10.00,
    "max_total_drawdown_pct": 20.00
  }
}
```

---

#### `PUT /api/users/me/settings`
Update user settings.

**Request:**
```json
{
  "theme": "dark",
  "accent_color": "purple",
  "default_capital": 25000.00,
  "max_leverage": 3
}
```
*Only include fields to update.*

**Response:** Same as GET

---

### 🔑 API KEY ENDPOINTS

#### `GET /api/api-keys`
List user's API keys.

**Response:**
```json
{
  "api_keys": [
    {
      "id": "uuid",
      "provider": "openrouter",
      "label": "Default",
      "key_prefix": "sk-or-v1-••••••••",
      "is_default": true,
      "status": "valid",
      "last_used_at": "2025-11-27T08:00:00Z",
      "used_by": ["α-prime", "β-2"],
      "created_at": "2025-11-15T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/api-keys`
Create new API key.

**Request:**
```json
{
  "provider": "openrouter",
  "label": "Work Account",
  "api_key": "sk-or-v1-xxxxxxxxxxxxx",
  "set_as_default": true
}
```

**Response:**
```json
{
  "api_key": {
    "id": "uuid",
    "provider": "openrouter",
    "label": "Work Account",
    "key_prefix": "sk-or-v1-••••••••",
    "is_default": true,
    "status": "untested",
    "created_at": "2025-11-27T10:00:00Z"
  }
}
```

---

#### `POST /api/api-keys/{id}/validate`
Test API key validity.

**Response:**
```json
{
  "valid": true,
  "status": "valid",
  "models_available": ["deepseek-r1", "claude-3.5-sonnet", "gemini-1.5-pro"]
}
```
or
```json
{
  "valid": false,
  "status": "invalid",
  "error": "Invalid API key or insufficient credits"
}
```

---

#### `DELETE /api/api-keys/{id}`
Delete API key.

**Response:**
```json
{
  "message": "API key deleted",
  "affected_agents": ["agent-uuid-1", "agent-uuid-2"]
}
```

---

### 🤖 AGENT ENDPOINTS

#### `GET /api/agents`
List agents with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by name/model |
| mode | string | Filter by 'monk' or 'omni' |
| model | string | Filter by model |
| sort | string | 'newest', 'oldest', 'performance', 'tests', 'alpha' |
| include_archived | boolean | Include archived agents (default: false) |

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "α-prime",
      "mode": "monk",
      "model": "deepseek-r1",
      "api_key_masked": "sk-or-v1-••••••••",
      "indicators": ["rsi", "macd", "ema", "atr", "volume"],
      "custom_indicators": [
        {"name": "Secret_Sauce", "formula": "(close - sma_50) / atr_14"}
      ],
      "strategy_prompt": "My trading philosophy...",
      "tests_run": 12,
      "best_pnl": 47.2,
      "total_profitable_tests": 8,
      "avg_win_rate": 58.0,
      "avg_drawdown": -8.3,
      "created_at": "2025-11-15T10:00:00Z",
      "updated_at": "2025-11-24T15:00:00Z"
    }
  ],
  "total": 3
}
```

---

#### `POST /api/agents`
Create new agent.

**Request:**
```json
{
  "name": "α-prime",
  "mode": "monk",
  "model": "deepseek-r1",
  "api_key_id": "uuid-of-api-key",
  "indicators": ["rsi", "macd", "ema_20", "ema_50", "atr", "volume"],
  "custom_indicators": [
    {"name": "Secret_Sauce", "formula": "(close - sma_50) / atr_14"}
  ],
  "strategy_prompt": "My trading philosophy:\n\n1. Only enter LONG..."
}
```

**Validation:**
- `name`: Required, 2-100 chars, unique per user
- `mode`: Required, 'monk' or 'omni'
- `model`: Required, valid model ID
- `api_key_id`: Required, must belong to user
- `indicators`: At least 1 required
- `strategy_prompt`: Required, 50-4000 chars

**Response:**
```json
{
  "agent": { /* full agent object */ },
  "message": "Agent created successfully"
}
```

---

#### `GET /api/agents/{id}`
Get single agent with full details.

**Response:** Full agent object

---

#### `PUT /api/agents/{id}`
Update agent.

**Request:** Partial agent object (only fields to update)

**Response:** Updated agent object

---

#### `DELETE /api/agents/{id}`
Delete agent.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| archive | boolean | Soft delete (default: true) |

**Response:**
```json
{
  "message": "Agent archived" | "Agent deleted",
  "id": "uuid"
}
```

---

#### `POST /api/agents/{id}/duplicate`
Duplicate agent.

**Request:**
```json
{
  "new_name": "α-prime-copy"
}
```

**Response:**
```json
{
  "agent": { /* new agent object */ },
  "message": "Agent duplicated"
}
```

---

#### `GET /api/agents/{id}/stats`
Get detailed agent performance statistics.

**Response:**
```json
{
  "stats": {
    "total_tests": 12,
    "profitable_tests": 8,
    "profit_rate": 66.67,
    "best_pnl": 47.2,
    "worst_pnl": -8.3,
    "avg_pnl": 12.4,
    "avg_win_rate": 58.0,
    "avg_drawdown": -8.3,
    "total_trades": 156,
    "best_sharpe": 2.4,
    "performance_by_asset": {
      "BTC/USDT": {"tests": 8, "avg_pnl": 15.2},
      "ETH/USDT": {"tests": 4, "avg_pnl": 6.8}
    }
  }
}
```

---

### ⚔️ ARENA ENDPOINTS (BACKTEST)

#### `POST /api/arena/backtest/start`
Start a new backtest session.

**Request:**
```json
{
  "agent_id": "uuid",
  "asset": "BTC/USDT",
  "timeframe": "1h",
  "date_preset": "30d",
  "start_date": "2025-10-01",
  "end_date": "2025-11-01",
  "starting_capital": 10000.00,
  "playback_speed": "normal",
  "safety_mode": true,
  "allow_leverage": false
}
```

**Validation:**
- `agent_id`: Must exist and belong to user
- `date_preset`: Optional, one of '7d', '30d', '90d', 'bull', 'crash', 'custom'
- `start_date/end_date`: Required if date_preset is 'custom'
- `starting_capital`: Min 100, Max 1,000,000

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "status": "initializing",
    "agent_id": "uuid",
    "agent_name": "α-prime",
    "asset": "BTC/USDT",
    "timeframe": "1h",
    "total_candles": 720,
    "websocket_url": "wss://api.alphalab.io/ws/backtest/uuid"
  },
  "message": "Backtest session created"
}
```

---

#### `GET /api/arena/backtest/{id}`
Get backtest session status.

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "status": "running",
    "current_candle": 234,
    "total_candles": 720,
    "progress_pct": 32.5,
    "elapsed_seconds": 117,
    "current_equity": 10234.00,
    "current_pnl_pct": 2.34,
    "max_drawdown_pct": -1.2,
    "trades_count": 5,
    "win_rate": 60.0,
    "open_position": {
      "type": "long",
      "entry_price": 64200,
      "unrealized_pnl": 1.5
    }
  }
}
```

---

#### `POST /api/arena/backtest/{id}/pause`
Pause running backtest.

**Response:**
```json
{
  "session_id": "uuid",
  "status": "paused",
  "paused_at": "2025-11-27T10:15:00Z"
}
```

---

#### `POST /api/arena/backtest/{id}/resume`
Resume paused backtest.

**Response:**
```json
{
  "session_id": "uuid",
  "status": "running"
}
```

---

#### `POST /api/arena/backtest/{id}/stop`
Stop backtest (force complete).

**Request:**
```json
{
  "close_position": true
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "result_id": "uuid",
  "final_pnl": 2.34
}
```

---

### ⚔️ ARENA ENDPOINTS (FORWARD TEST)

#### `POST /api/arena/forward/start`
Start forward test session.

**Request:**
```json
{
  "agent_id": "uuid",
  "asset": "BTC/USDT",
  "timeframe": "1h",
  "starting_capital": 10000.00,
  "safety_mode": true,
  "email_notifications": true,
  "auto_stop_on_loss": true,
  "auto_stop_loss_pct": 10.00
}
```

**Validation:**
- Agent must have at least 1 profitable backtest

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "status": "running",
    "agent_id": "uuid",
    "agent_name": "α-prime",
    "asset": "BTC/USDT",
    "timeframe": "1h",
    "websocket_url": "wss://api.alphalab.io/ws/forward/uuid"
  },
  "message": "Forward test started"
}
```

---

#### `GET /api/arena/forward/active`
List active forward test sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "agent_id": "uuid",
      "agent_name": "α-prime",
      "asset": "BTC/USDT",
      "status": "running",
      "started_at": "2025-11-27T06:00:00Z",
      "duration_display": "4h 23m",
      "current_pnl_pct": 2.3,
      "trades_count": 3,
      "win_rate": 66.67
    }
  ]
}
```

---

#### `POST /api/arena/forward/{id}/stop`
Stop forward test.

**Request:**
```json
{
  "close_position": true
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "result_id": "uuid",
  "final_pnl": 8.2,
  "position_closed": true
}
```

---

### 📊 RESULTS ENDPOINTS

#### `GET /api/results`
List test results with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by agent name/asset |
| type | string | 'all', 'backtest', 'forward' |
| result | string | 'all', 'profitable', 'loss' |
| agent_id | uuid | Filter by agent |
| from_date | date | Start date |
| to_date | date | End date |
| page | int | Page number (default: 1) |
| limit | int | Per page (default: 10, max: 50) |

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "backtest",
      "agent_id": "uuid",
      "agent_name": "α-prime",
      "asset": "BTC/USDT",
      "mode": "monk",
      "created_at": "2025-11-25T10:00:00Z",
      "duration_display": "30 days",
      "total_trades": 45,
      "total_pnl_pct": 23.4,
      "win_rate": 62.0,
      "max_drawdown_pct": -4.2,
      "sharpe_ratio": 1.8,
      "is_profitable": true,
      "has_certificate": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 27,
    "total_pages": 3
  }
}
```

---

#### `GET /api/results/stats`
Get aggregate result statistics.

**Response:**
```json
{
  "stats": {
    "total_tests": 27,
    "profitable": 18,
    "profitable_pct": 66.67,
    "best_result": 47.2,
    "worst_result": -12.3,
    "avg_pnl": 8.3,
    "by_type": {
      "backtest": {"count": 22, "profitable": 15},
      "forward": {"count": 5, "profitable": 3}
    }
  }
}
```

---

#### `GET /api/results/{id}`
Get full result detail.

**Response:**
```json
{
  "result": {
    "id": "uuid",
    "session_id": "uuid",
    "type": "backtest",
    "agent_id": "uuid",
    "agent_name": "α-prime",
    "model": "deepseek-r1",
    "asset": "BTC/USDT",
    "mode": "monk",
    "timeframe": "1h",
    "start_date": "2025-10-01T00:00:00Z",
    "end_date": "2025-11-01T00:00:00Z",
    "duration_display": "30 days",
    "starting_capital": 10000.00,
    "ending_capital": 12340.00,
    "total_pnl_amount": 2340.00,
    "total_pnl_pct": 23.4,
    "total_trades": 45,
    "winning_trades": 28,
    "losing_trades": 17,
    "win_rate": 62.22,
    "max_drawdown_pct": -4.2,
    "sharpe_ratio": 1.8,
    "profit_factor": 2.1,
    "avg_trade_pnl": 0.52,
    "best_trade_pnl": 5.8,
    "worst_trade_pnl": -2.1,
    "avg_holding_time_display": "6 hours",
    "config": {
      "safety_mode": true,
      "leverage_enabled": false
    },
    "equity_curve": [
      {"time": 1727740800000, "value": 10000, "drawdown": 0},
      {"time": 1727744400000, "value": 10120, "drawdown": 0}
    ],
    "ai_summary": "The agent performed well..."
  }
}
```

---

#### `GET /api/results/{id}/trades`
Get trade list for result.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number |
| limit | int | Per page |

**Response:**
```json
{
  "trades": [
    {
      "id": "uuid",
      "trade_number": 45,
      "type": "long",
      "entry_price": 68200.00,
      "entry_time": "2025-11-01T14:00:00Z",
      "exit_price": 69100.00,
      "exit_time": "2025-11-01T20:00:00Z",
      "exit_type": "take_profit",
      "size": 0.5,
      "leverage": 1,
      "pnl_amount": 450.00,
      "pnl_pct": 1.32,
      "duration_display": "6 hours",
      "entry_reasoning": "RSI oversold...",
      "exit_reasoning": "TP hit..."
    }
  ],
  "summary": {
    "total": 45,
    "wins": 28,
    "losses": 17,
    "avg_win": 1.8,
    "avg_loss": -1.1
  }
}
```

---

#### `GET /api/results/{id}/reasoning`
Get AI reasoning trace.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| candle_start | int | Start candle number |
| candle_end | int | End candle number |
| decisions_only | bool | Only show decision entries |

**Response:**
```json
{
  "reasoning": [
    {
      "id": "uuid",
      "candle_number": 720,
      "timestamp": "2025-11-01T14:00:00Z",
      "candle_data": {
        "open": 68150, "high": 68320, "low": 67980, "close": 68200
      },
      "indicators": {
        "rsi_14": 58.2,
        "macd": 0.12,
        "ema_20": 67890,
        "atr_14": 420
      },
      "thought_type": "decision",
      "reasoning": "Market is showing continued strength...",
      "decision": "hold",
      "confidence": 75.0
    }
  ],
  "total_entries": 720
}
```

---

#### `GET /api/results/{id}/export`
Export result data.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| format | string | 'json', 'csv' |
| include | string[] | 'trades', 'reasoning', 'equity' |

**Response:**
- Returns file download (Content-Disposition: attachment)

---

### 📜 CERTIFICATE ENDPOINTS

#### `POST /api/certificates`
Generate certificate for result.

**Request:**
```json
{
  "result_id": "uuid",
  "include_reasoning_trace": false
}
```

**Validation:**
- Result must be profitable (pnl >= 0)

**Response:**
```json
{
  "certificate": {
    "id": "uuid",
    "verification_code": "ALX-2025-1127-A3F8K",
    "share_url": "https://alphalab.io/verify/ALX-2025-1127-A3F8K",
    "pdf_url": "https://storage.../certificates/ALX-2025-1127-A3F8K.pdf",
    "image_url": "https://storage.../certificates/ALX-2025-1127-A3F8K.png"
  }
}
```

---

#### `GET /api/certificates/{id}`
Get certificate details.

**Response:** Full certificate object

---

#### `GET /api/certificates/{id}/pdf`
Download certificate PDF.

**Response:** PDF file

---

#### `GET /api/certificates/{id}/image`
Download certificate image.

**Response:** PNG file

---

#### `GET /api/certificates/verify/{code}`
Public verification endpoint (no auth required).

**Response:**
```json
{
  "verified": true,
  "certificate": {
    "verification_code": "ALX-2025-1127-A3F8K",
    "agent_name": "α-prime",
    "model": "DeepSeek-R1",
    "mode": "monk",
    "test_type": "backtest",
    "asset": "BTC/USDT",
    "pnl_pct": 23.4,
    "win_rate": 62.0,
    "max_drawdown_pct": -4.2,
    "total_trades": 45,
    "duration_display": "30 days",
    "test_period": "Oct 1 - Nov 1, 2025",
    "issued_at": "2025-11-27T10:00:00Z"
  }
}
```

---

### 📊 DASHBOARD ENDPOINTS

#### `GET /api/dashboard/stats`
Get dashboard overview stats.

**Response:**
```json
{
  "stats": {
    "total_agents": 3,
    "tests_run": 27,
    "best_pnl": 47.2,
    "avg_win_rate": 62.0,
    "trends": {
      "agents_this_week": 1,
      "tests_today": 5,
      "win_rate_change": 3.0
    },
    "best_agent": {
      "id": "uuid",
      "name": "α-prime"
    }
  }
}
```

---

#### `GET /api/dashboard/activity`
Get recent activity feed.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| limit | int | Max items (default: 10) |

**Response:**
```json
{
  "activity": [
    {
      "id": "uuid",
      "type": "test_completed",
      "agent_name": "α-prime",
      "description": "Backtest completed",
      "pnl": 23.4,
      "result_id": "uuid",
      "timestamp": "2025-11-27T08:00:00Z"
    }
  ]
}
```

---

#### `GET /api/dashboard/quick-start`
Get onboarding progress.

**Response:**
```json
{
  "steps": [
    {
      "id": "create_agent",
      "label": "Create your first agent",
      "description": "Configure an AI trading agent",
      "is_complete": true,
      "href": "/dashboard/agents/new",
      "cta_text": "Create"
    },
    {
      "id": "run_backtest",
      "label": "Run a backtest",
      "is_complete": false,
      "href": "/dashboard/arena/backtest",
      "cta_text": "Start Test"
    },
    {
      "id": "get_certificate",
      "label": "Generate your first certificate",
      "is_complete": false,
      "href": "/dashboard/results",
      "cta_text": "View Results"
    }
  ],
  "progress_pct": 33.33
}
```

---

### 🔔 NOTIFICATION ENDPOINTS

#### `GET /api/notifications`
List notifications.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| unread_only | bool | Filter unread |
| limit | int | Max items |

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "success",
      "category": "test_complete",
      "title": "Backtest Complete",
      "message": "α-1 finished backtest with +23.4% PnL",
      "action_url": "/dashboard/results/uuid",
      "is_read": false,
      "created_at": "2025-11-27T08:00:00Z"
    }
  ]
}
```

---

#### `GET /api/notifications/unread-count`
```json
{"count": 3}
```

---

#### `POST /api/notifications/{id}/read`
```json
{"message": "Marked as read"}
```

---

#### `POST /api/notifications/mark-all-read`
```json
{"message": "All notifications marked as read", "count": 3}
```

---

### 📈 DATA ENDPOINTS

#### `GET /api/data/assets`
Get available trading assets.

**Response:**
```json
{
  "assets": [
    {"id": "btc-usdt", "name": "BTC/USDT", "icon": "₿", "available": true},
    {"id": "eth-usdt", "name": "ETH/USDT", "icon": "Ξ", "available": true},
    {"id": "sol-usdt", "name": "SOL/USDT", "icon": "◎", "available": true},
    {"id": "bnb-usdt", "name": "BNB/USDT", "icon": "B", "available": false}
  ]
}
```

---

#### `GET /api/data/timeframes`
Get available timeframes.

**Response:**
```json
{
  "timeframes": [
    {"id": "15m", "name": "15 Minutes", "minutes": 15},
    {"id": "1h", "name": "1 Hour", "minutes": 60},
    {"id": "4h", "name": "4 Hours", "minutes": 240},
    {"id": "1d", "name": "1 Day", "minutes": 1440}
  ]
}
```

---

#### `GET /api/data/candles`
Get historical candle data.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| asset | string | Required |
| timeframe | string | Required |
| start | datetime | Required |
| end | datetime | Required |
| limit | int | Max candles (default: 1000) |

**Response:**
```json
{
  "candles": [
    {
      "time": 1727740800000,
      "open": 67150.00,
      "high": 67320.00,
      "low": 66980.00,
      "close": 67200.00,
      "volume": 12450.50
    }
  ],
  "count": 720
}
```

---

#### `GET /api/data/indicators`
Calculate indicators for candle data.

**Request:**
```json
{
  "asset": "BTC/USDT",
  "timeframe": "1h",
  "start": "2025-10-01T00:00:00Z",
  "end": "2025-11-01T00:00:00Z",
  "indicators": ["rsi_14", "macd", "ema_20", "ema_50", "atr_14"]
}
```

**Response:**
```json
{
  "data": [
    {
      "time": 1727740800000,
      "rsi_14": 58.2,
      "macd": 0.12,
      "macd_signal": 0.08,
      "macd_histogram": 0.04,
      "ema_20": 67890.00,
      "ema_50": 67200.00,
      "atr_14": 420.00
    }
  ]
}
```

---

### 📦 EXPORT ENDPOINTS

#### `POST /api/export`
Generate data export package.

**Request:**
```json
{
  "include": {
    "agent_configs": true,
    "test_results": true,
    "trade_history": true,
    "reasoning_traces": false,
    "account_settings": true
  },
  "format": "zip"
}
```

**Response:**
```json
{
  "export_id": "uuid",
  "status": "processing",
  "estimated_size_mb": 2.4,
  "download_url": null
}
```

---

#### `GET /api/export/{id}`
Check export status / download.

**Response (processing):**
```json
{
  "export_id": "uuid",
  "status": "processing",
  "progress_pct": 45
}
```

**Response (ready):**
```json
{
  "export_id": "uuid",
  "status": "ready",
  "download_url": "https://storage.../exports/uuid.zip",
  "expires_at": "2025-11-28T10:00:00Z",
  "size_mb": 2.3
}
```

---

## 📋 ERROR RESPONSE FORMAT

All errors follow consistent format:

```json
{
  "detail": "Human readable error message",
  "error_code": "AGENT_NOT_FOUND",
  "status_code": 404
}
```

**Common Error Codes:**
| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing/invalid auth token |
| FORBIDDEN | 403 | Access denied to resource |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

**Continue to Part 3: WebSocket Events →**

