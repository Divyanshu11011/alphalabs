# AlphaLab Backend Specification
## Part 1: Supabase Database Schema

---

## 🏗️ SCHEMA OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ALPHALAB DATABASE SCHEMA                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                    │
│  │    users     │────<│    agents    │────<│  api_keys    │                    │
│  └──────────────┘     └──────────────┘     └──────────────┘                    │
│         │                    │                                                   │
│         │                    │                                                   │
│         ▼                    ▼                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                    │
│  │user_settings │     │test_sessions │────<│   trades     │                    │
│  └──────────────┘     └──────────────┘     └──────────────┘                    │
│         │                    │                    │                             │
│         │                    │                    │                             │
│         ▼                    ▼                    ▼                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                    │
│  │notifications │     │ test_results │     │ ai_thoughts  │                    │
│  └──────────────┘     └──────────────┘     └──────────────┘                    │
│                              │                                                   │
│                              ▼                                                   │
│                       ┌──────────────┐     ┌──────────────┐                    │
│                       │ certificates │     │activity_log  │                    │
│                       └──────────────┘     └──────────────┘                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 TABLE: `users`

Synced from Clerk authentication. Primary identity table.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100) UNIQUE,
    image_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Internal DB identifier |
| clerk_id | VARCHAR(255) | UNIQUE, NOT NULL | Clerk authentication ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| first_name | VARCHAR(100) | - | First name |
| last_name | VARCHAR(100) | - | Last name |
| username | VARCHAR(100) | UNIQUE | Display username |
| image_url | TEXT | - | Avatar URL |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | User timezone |
| plan | VARCHAR(20) | CHECK | Subscription tier |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

## 📦 TABLE: `user_settings`

All user preferences and configurations.

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Appearance
    theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    accent_color VARCHAR(20) DEFAULT 'cyan' CHECK (accent_color IN ('cyan', 'purple', 'green', 'amber')),
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    
    -- Chart preferences
    chart_grid_lines BOOLEAN DEFAULT TRUE,
    chart_crosshair BOOLEAN DEFAULT TRUE,
    chart_candle_colors VARCHAR(20) DEFAULT 'green_red',
    
    -- Notification settings (JSONB for flexibility)
    email_notifications JSONB DEFAULT '{
        "test_completed": true,
        "trade_executed": true,
        "daily_summary": false,
        "stop_loss_hit": true,
        "marketing": false
    }'::jsonb,
    
    inapp_notifications JSONB DEFAULT '{
        "show_toasts": true,
        "sound_effects": true,
        "desktop_notifications": false
    }'::jsonb,
    
    -- Trading defaults
    default_asset VARCHAR(20) DEFAULT 'BTC/USDT',
    default_timeframe VARCHAR(10) DEFAULT '1h',
    default_capital DECIMAL(15,2) DEFAULT 10000.00,
    default_playback_speed VARCHAR(10) DEFAULT 'normal',
    safety_mode_default BOOLEAN DEFAULT TRUE,
    allow_leverage_default BOOLEAN DEFAULT FALSE,
    
    -- Risk limits
    max_position_size_pct INTEGER DEFAULT 50 CHECK (max_position_size_pct BETWEEN 1 AND 100),
    max_leverage INTEGER DEFAULT 5 CHECK (max_leverage BETWEEN 1 AND 10),
    max_loss_per_trade_pct DECIMAL(5,2) DEFAULT 5.00,
    max_daily_loss_pct DECIMAL(5,2) DEFAULT 10.00,
    max_total_drawdown_pct DECIMAL(5,2) DEFAULT 20.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_settings UNIQUE (user_id)
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);
```

---

## 📦 TABLE: `api_keys`

Encrypted storage for OpenRouter API keys.

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'openrouter',
    label VARCHAR(100),
    encrypted_key TEXT NOT NULL,  -- AES-256 encrypted
    key_prefix VARCHAR(20),       -- First 10 chars for display: "sk-or-v1-..."
    is_default BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'untested' CHECK (status IN ('valid', 'invalid', 'untested')),
    last_used_at TIMESTAMPTZ,
    last_validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_default ON api_keys(user_id, is_default) WHERE is_default = TRUE;
```

| Column | Type | Description |
|--------|------|-------------|
| encrypted_key | TEXT | AES-256 encrypted API key (server-side encryption) |
| key_prefix | VARCHAR(20) | Display prefix "sk-or-v1-••••" |
| is_default | BOOLEAN | Default key for new agents |
| status | VARCHAR(20) | Validation status |

---

## 📦 TABLE: `agents`

AI trading agent configurations.

```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    
    -- Identity
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('monk', 'omni')),
    
    -- Model config
    model VARCHAR(100) NOT NULL,  -- e.g., "deepseek-r1", "claude-3.5-sonnet"
    
    -- Data buffet
    indicators TEXT[] DEFAULT '{}',  -- Array of indicator IDs
    custom_indicators JSONB DEFAULT '[]'::jsonb,  -- [{name, formula}]
    
    -- Strategy
    strategy_prompt TEXT NOT NULL,
    
    -- Computed stats (updated after each test)
    tests_run INTEGER DEFAULT 0,
    best_pnl DECIMAL(10,2),
    total_profitable_tests INTEGER DEFAULT 0,
    avg_win_rate DECIMAL(5,2),
    avg_drawdown DECIMAL(5,2),
    
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_active ON agents(user_id) WHERE is_archived = FALSE;
```

**Custom Indicators JSONB Structure:**
```json
[
  {
    "name": "Secret_Sauce",
    "formula": "(close - sma_50) / atr_14"
  }
]
```

---

## 📦 TABLE: `test_sessions`

Active and completed test sessions (backtest + forward).

```sql
CREATE TABLE test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Session type
    type VARCHAR(10) NOT NULL CHECK (type IN ('backtest', 'forward')),
    status VARCHAR(20) NOT NULL DEFAULT 'configuring' 
        CHECK (status IN ('configuring', 'initializing', 'running', 'paused', 'completed', 'failed', 'stopped')),
    
    -- Configuration
    asset VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    starting_capital DECIMAL(15,2) NOT NULL,
    safety_mode BOOLEAN DEFAULT TRUE,
    allow_leverage BOOLEAN DEFAULT FALSE,
    
    -- Backtest specific
    date_preset VARCHAR(20),           -- '7d', '30d', 'bull', 'crash', 'custom'
    start_date DATE,
    end_date DATE,
    playback_speed VARCHAR(10),        -- 'slow', 'normal', 'fast', 'instant'
    total_candles INTEGER,
    current_candle INTEGER DEFAULT 0,
    
    -- Forward test specific
    email_notifications BOOLEAN DEFAULT FALSE,
    auto_stop_on_loss BOOLEAN DEFAULT FALSE,
    auto_stop_loss_pct DECIMAL(5,2),
    
    -- Runtime state
    current_equity DECIMAL(15,2),
    current_pnl_pct DECIMAL(10,4),
    max_drawdown_pct DECIMAL(10,4),
    elapsed_seconds INTEGER DEFAULT 0,
    
    -- Position state (for active sessions)
    open_position JSONB,  -- Current position if any
    
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON test_sessions(user_id);
CREATE INDEX idx_sessions_agent ON test_sessions(agent_id);
CREATE INDEX idx_sessions_active ON test_sessions(user_id, status) WHERE status IN ('running', 'paused');
CREATE INDEX idx_sessions_type ON test_sessions(type, status);
```

**Open Position JSONB Structure:**
```json
{
  "type": "long",
  "entry_price": 67234.50,
  "size": 0.5,
  "leverage": 1,
  "stop_loss": 66500.00,
  "take_profit": 69000.00,
  "unrealized_pnl": 656.00,
  "opened_at": "2025-11-27T14:00:00Z"
}
```

---

## 📦 TABLE: `trades`

Individual trade records within sessions.

```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    
    -- Trade details
    trade_number INTEGER NOT NULL,  -- Sequential within session
    type VARCHAR(10) NOT NULL CHECK (type IN ('long', 'short')),
    
    -- Entry
    entry_price DECIMAL(20,8) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    entry_candle INTEGER,
    entry_reasoning TEXT,
    
    -- Exit (null if position still open)
    exit_price DECIMAL(20,8),
    exit_time TIMESTAMPTZ,
    exit_candle INTEGER,
    exit_type VARCHAR(20) CHECK (exit_type IN ('take_profit', 'stop_loss', 'manual', 'signal')),
    exit_reasoning TEXT,
    
    -- Size & leverage
    size DECIMAL(20,8) NOT NULL,
    leverage INTEGER DEFAULT 1,
    
    -- Results
    pnl_amount DECIMAL(15,2),
    pnl_pct DECIMAL(10,4),
    
    -- Risk management
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_session ON trades(session_id);
CREATE INDEX idx_trades_session_time ON trades(session_id, entry_time);
```

---

## 📦 TABLE: `ai_thoughts`

AI reasoning log for each candle/decision point.

```sql
CREATE TABLE ai_thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    
    candle_number INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Input data snapshot
    candle_data JSONB NOT NULL,  -- OHLCV
    indicator_values JSONB NOT NULL,  -- All indicator values at this point
    
    -- AI output
    thought_type VARCHAR(20) NOT NULL CHECK (thought_type IN ('analysis', 'decision', 'execution')),
    reasoning TEXT NOT NULL,
    decision VARCHAR(10) CHECK (decision IN ('long', 'short', 'hold', 'close')),
    confidence DECIMAL(5,2),  -- 0-100
    
    -- Order generated (if any)
    order_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thoughts_session ON ai_thoughts(session_id);
CREATE INDEX idx_thoughts_session_candle ON ai_thoughts(session_id, candle_number);
CREATE INDEX idx_thoughts_trade ON ai_thoughts(trade_id) WHERE trade_id IS NOT NULL;
```

**Candle Data JSONB:**
```json
{
  "open": 67150.00,
  "high": 67320.00,
  "low": 66980.00,
  "close": 67200.00,
  "volume": 12450.5
}
```

**Indicator Values JSONB:**
```json
{
  "rsi_14": 58.2,
  "macd": 0.12,
  "macd_signal": 0.08,
  "macd_histogram": 0.04,
  "ema_20": 67890.00,
  "ema_50": 67200.00,
  "atr_14": 420.00,
  "volume_sma": 10200.00
}
```

---

## 📦 TABLE: `test_results`

Finalized test results with full metrics.

```sql
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Test info
    type VARCHAR(10) NOT NULL,
    asset VARCHAR(20) NOT NULL,
    mode VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    
    -- Time range
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL,
    duration_display VARCHAR(50),  -- "30 days", "48 hours"
    
    -- Capital
    starting_capital DECIMAL(15,2) NOT NULL,
    ending_capital DECIMAL(15,2) NOT NULL,
    
    -- Primary metrics
    total_pnl_amount DECIMAL(15,2) NOT NULL,
    total_pnl_pct DECIMAL(10,4) NOT NULL,
    total_trades INTEGER NOT NULL,
    winning_trades INTEGER NOT NULL,
    losing_trades INTEGER NOT NULL,
    win_rate DECIMAL(5,2) NOT NULL,
    
    -- Advanced metrics
    max_drawdown_pct DECIMAL(10,4),
    sharpe_ratio DECIMAL(6,3),
    profit_factor DECIMAL(6,3),
    avg_trade_pnl DECIMAL(10,4),
    best_trade_pnl DECIMAL(10,4),
    worst_trade_pnl DECIMAL(10,4),
    avg_holding_time_seconds INTEGER,
    avg_holding_time_display VARCHAR(50),
    
    -- Equity curve (sampled points for chart)
    equity_curve JSONB,  -- [{time, value, drawdown}]
    
    -- AI analysis summary (optional)
    ai_summary TEXT,
    
    is_profitable BOOLEAN GENERATED ALWAYS AS (total_pnl_pct >= 0) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_results_user ON test_results(user_id);
CREATE INDEX idx_results_agent ON test_results(agent_id);
CREATE INDEX idx_results_profitable ON test_results(user_id, is_profitable);
CREATE INDEX idx_results_type ON test_results(user_id, type);
CREATE INDEX idx_results_date ON test_results(user_id, created_at DESC);
```

---

## 📦 TABLE: `certificates`

Shareable performance certificates.

```sql
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID UNIQUE NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Certificate data
    verification_code VARCHAR(30) UNIQUE NOT NULL,  -- "ALX-2025-1127-A3F8K"
    
    -- Cached display data (for public verification page)
    agent_name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    mode VARCHAR(10) NOT NULL,
    test_type VARCHAR(10) NOT NULL,
    asset VARCHAR(20) NOT NULL,
    
    pnl_pct DECIMAL(10,4) NOT NULL,
    win_rate DECIMAL(5,2) NOT NULL,
    total_trades INTEGER NOT NULL,
    max_drawdown_pct DECIMAL(10,4),
    sharpe_ratio DECIMAL(6,3),
    duration_display VARCHAR(50) NOT NULL,
    test_period VARCHAR(100) NOT NULL,  -- "Oct 1 - Nov 1, 2025"
    
    -- Generated assets
    pdf_url TEXT,
    image_url TEXT,
    qr_code_url TEXT,
    
    -- Sharing
    share_url TEXT NOT NULL,  -- "alphalab.io/verify/ALX-2025-1127-A3F8K"
    view_count INTEGER DEFAULT 0,
    
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_code ON certificates(verification_code);
CREATE INDEX idx_certificates_result ON certificates(result_id);
```

---

## 📦 TABLE: `notifications`

User notification history.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    category VARCHAR(30) NOT NULL,  -- 'test_complete', 'trade_executed', 'system'
    
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Optional links
    action_url TEXT,
    session_id UUID REFERENCES test_sessions(id) ON DELETE SET NULL,
    result_id UUID REFERENCES test_results(id) ON DELETE SET NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_date ON notifications(user_id, created_at DESC);
```

---

## 📦 TABLE: `activity_log`

User activity feed for dashboard.

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(30) NOT NULL,
    -- Types: 'test_completed', 'test_failed', 'test_started', 'agent_created', 
    --        'agent_updated', 'agent_deleted', 'certificate_generated'
    
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    agent_name VARCHAR(100),  -- Cached for display after agent deletion
    
    session_id UUID REFERENCES test_sessions(id) ON DELETE SET NULL,
    result_id UUID REFERENCES test_results(id) ON DELETE SET NULL,
    
    description TEXT NOT NULL,
    pnl DECIMAL(10,4),  -- If applicable
    
    metadata JSONB DEFAULT '{}'::jsonb,  -- Additional context
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_date ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON activity_log(user_id, activity_type);
```

---

## 📦 TABLE: `market_data_cache`

Cached historical market data (for backtesting).

```sql
CREATE TABLE market_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    asset VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(30,8) NOT NULL,
    
    -- Pre-calculated indicators (optional, for performance)
    indicators JSONB,
    
    CONSTRAINT unique_candle UNIQUE (asset, timeframe, timestamp)
);

CREATE INDEX idx_market_asset_tf ON market_data_cache(asset, timeframe);
CREATE INDEX idx_market_timestamp ON market_data_cache(asset, timeframe, timestamp);
```

---

## 🔧 COMMON FUNCTIONS

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_timestamp 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_timestamp 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_api_keys_timestamp 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_timestamp 
    BEFORE UPDATE ON agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_timestamp 
    BEFORE UPDATE ON test_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update agent stats after test completion
CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE agents SET
        tests_run = (SELECT COUNT(*) FROM test_results WHERE agent_id = NEW.agent_id),
        total_profitable_tests = (SELECT COUNT(*) FROM test_results WHERE agent_id = NEW.agent_id AND is_profitable = TRUE),
        best_pnl = (SELECT MAX(total_pnl_pct) FROM test_results WHERE agent_id = NEW.agent_id),
        avg_win_rate = (SELECT AVG(win_rate) FROM test_results WHERE agent_id = NEW.agent_id),
        avg_drawdown = (SELECT AVG(max_drawdown_pct) FROM test_results WHERE agent_id = NEW.agent_id),
        updated_at = NOW()
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_stats_trigger
    AFTER INSERT ON test_results
    FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

-- Generate verification code for certificates
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    year_month TEXT;
    random_suffix TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYY-MMDD');
    random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
    code := 'ALX-' || year_month || '-' || random_suffix;
    RETURN code;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 ROW LEVEL SECURITY (RLS)

```sql
-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
-- (Applied via service role in FastAPI, user_id passed from Clerk token)

CREATE POLICY users_own_data ON users
    FOR ALL USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_settings_own_data ON user_settings
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY api_keys_own_data ON api_keys
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY agents_own_data ON agents
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY sessions_own_data ON test_sessions
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY results_own_data ON test_results
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Certificates: Public read for verification, private write
CREATE POLICY certificates_public_read ON certificates
    FOR SELECT USING (TRUE);

CREATE POLICY certificates_owner_write ON certificates
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
```

---

## 📊 SCHEMA SUMMARY

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User accounts (Clerk sync) | Root entity |
| `user_settings` | Preferences, risk limits | 1:1 with users |
| `api_keys` | Encrypted API keys | N:1 with users |
| `agents` | AI agent configs | N:1 with users, N:1 with api_keys |
| `test_sessions` | Active/completed tests | N:1 with agents |
| `trades` | Individual trades | N:1 with sessions |
| `ai_thoughts` | AI reasoning log | N:1 with sessions, N:1 with trades |
| `test_results` | Finalized metrics | 1:1 with sessions |
| `certificates` | Shareable proofs | 1:1 with results |
| `notifications` | User alerts | N:1 with users |
| `activity_log` | Dashboard feed | N:1 with users |
| `market_data_cache` | Historical OHLCV | Standalone |

---

**Continue to Part 2: API Endpoints →**

