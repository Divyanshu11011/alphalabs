# AlphaLab Backend Specification
## Part 4: Implementation Guide

---

## 🏗️ PROJECT STRUCTURE

```
backend/
├── app.py                      # FastAPI entry point
├── config.py                   # Environment configuration
├── requirements.txt            # Python dependencies
│
├── api/                        # Route handlers
│   ├── __init__.py
│   ├── users.py               # /users endpoints
│   ├── api_keys.py            # /api-keys endpoints
│   ├── agents.py              # /agents endpoints
│   ├── arena.py               # /arena endpoints
│   ├── results.py             # /results endpoints
│   ├── certificates.py        # /certificates endpoints
│   ├── dashboard.py           # /dashboard endpoints
│   ├── notifications.py       # /notifications endpoints
│   ├── data.py                # /data endpoints
│   └── export.py              # /export endpoints
│
├── core/                       # Core business logic
│   ├── __init__.py
│   ├── auth.py                # Clerk JWT verification
│   ├── database.py            # Supabase client
│   ├── encryption.py          # API key encryption
│   └── errors.py              # Custom exceptions
│
├── services/                   # Domain services
│   ├── __init__.py
│   ├── user_service.py
│   ├── agent_service.py
│   ├── session_service.py
│   ├── result_service.py
│   ├── certificate_service.py
│   ├── notification_service.py
│   └── market_data_service.py
│
├── engine/                     # Trading engine
│   ├── __init__.py
│   ├── backtest_engine.py     # Backtest execution
│   ├── forward_engine.py      # Forward test execution
│   ├── ai_trader.py           # AI decision making
│   ├── indicator_calculator.py # Technical indicators
│   └── position_manager.py    # Trade execution
│
├── websocket/                  # WebSocket handlers
│   ├── __init__.py
│   ├── connection_manager.py  # Connection registry
│   ├── backtest_ws.py         # Backtest WebSocket
│   ├── forward_ws.py          # Forward test WebSocket
│   └── price_feed_ws.py       # Live price feed
│
├── models/                     # Pydantic models
│   ├── __init__.py
│   ├── user.py
│   ├── agent.py
│   ├── session.py
│   ├── trade.py
│   ├── result.py
│   └── certificate.py
│
├── schemas/                    # Request/Response schemas
│   ├── __init__.py
│   ├── user_schemas.py
│   ├── agent_schemas.py
│   ├── arena_schemas.py
│   ├── result_schemas.py
│   └── common_schemas.py
│
├── utils/                      # Utilities
│   ├── __init__.py
│   ├── datetime_utils.py
│   ├── verification_code.py
│   └── pdf_generator.py
│
├── migrations/                 # SQL migrations
│   ├── 001_create_users_table.sql
│   ├── 002_create_agents_table.sql
│   ├── ...
│   └── migrate.py
│
├── tests/                      # Test suite
│   ├── __init__.py
│   ├── test_auth.py
│   ├── test_agents.py
│   └── ...
│
└── webhooks.py                 # Clerk webhooks
```

---

## 📦 DEPENDENCIES

```txt
# requirements.txt

# Core
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0
pydantic==2.5.3

# Database
supabase==2.3.0

# Authentication
PyJWT==2.8.0
httpx==0.26.0
cryptography==42.0.0

# API calls
requests==2.31.0
aiohttp==3.9.1

# Data processing
numpy==1.26.3
pandas==2.1.4
ta-lib==0.4.28  # Technical indicators (requires TA-Lib C library)

# PDF generation
reportlab==4.0.8
qrcode==7.4.2
Pillow==10.2.0

# Background tasks
celery==5.3.6
redis==5.0.1

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0

# Development
black==23.12.1
ruff==0.1.11
```

---

## ⚙️ CONFIGURATION

```python
# config.py

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # Server
    host: str = "0.0.0.0"
    port: int = 5000
    
    # Supabase
    supabase_url: str
    supabase_service_key: str  # Service role key for RLS bypass
    
    # Clerk
    clerk_secret_key: str
    clerk_webhook_secret: str
    clerk_jwks_url: str = "https://api.clerk.com/.well-known/jwks.json"
    
    # Encryption
    encryption_key: str  # 32-byte key for API key encryption
    
    # OpenRouter
    openrouter_api_key: str  # Fallback key for validation
    
    # Redis (for Celery)
    redis_url: str = "redis://localhost:6379/0"
    
    # Storage (Supabase Storage or S3)
    storage_bucket: str = "alphalab-files"
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 🔐 AUTHENTICATION IMPLEMENTATION

```python
# core/auth.py

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Header
from typing import Optional
from config import get_settings

settings = get_settings()

# Cache JWKS client
jwks_client = PyJWKClient(settings.clerk_jwks_url)

async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify Clerk JWT token.
    Returns decoded payload if valid.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        token = authorization.replace("Bearer ", "")
        
        # Get signing key from Clerk JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Clerk doesn't set audience
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_user_id_from_token(payload: dict) -> str:
    """Extract Clerk user ID from token payload."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing subject")
    return user_id


# Dependency for protected routes
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency that returns current user from database.
    """
    from services.user_service import get_user_by_clerk_id
    
    payload = await verify_clerk_token(authorization)
    clerk_id = get_user_id_from_token(payload)
    
    user = await get_user_by_clerk_id(clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
```

---

## 🗄️ DATABASE CLIENT

```python
# core/database.py

from supabase import create_client, Client
from config import get_settings
from functools import lru_cache

settings = get_settings()

@lru_cache()
def get_supabase_client() -> Client:
    """
    Get Supabase client with service role key.
    Cached for reuse across requests.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key
    )


class Database:
    """Database helper with common operations."""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def get_user_by_id(self, user_id: str) -> dict | None:
        result = self.client.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None
    
    async def get_user_by_clerk_id(self, clerk_id: str) -> dict | None:
        result = self.client.table("users").select("*").eq("clerk_id", clerk_id).execute()
        return result.data[0] if result.data else None
    
    # Add more helper methods as needed


db = Database()
```

---

## 🔒 API KEY ENCRYPTION

```python
# core/encryption.py

from cryptography.fernet import Fernet
from config import get_settings

settings = get_settings()

# Initialize Fernet with encryption key
fernet = Fernet(settings.encryption_key.encode())


def encrypt_api_key(api_key: str) -> str:
    """Encrypt API key for storage."""
    return fernet.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt API key for use."""
    return fernet.decrypt(encrypted_key.encode()).decode()


def mask_api_key(api_key: str) -> str:
    """Create masked version for display: sk-or-v1-••••••••"""
    if len(api_key) < 15:
        return "••••••••"
    return api_key[:10] + "••••••••"
```

---

## 🤖 AI TRADER SERVICE

```python
# engine/ai_trader.py

import httpx
from typing import Literal
from pydantic import BaseModel
from core.encryption import decrypt_api_key

class AIDecision(BaseModel):
    action: Literal["long", "short", "hold", "close"]
    reasoning: str
    confidence: float | None = None
    order: dict | None = None


class AITrader:
    """AI trading decision maker using OpenRouter."""
    
    def __init__(
        self,
        model: str,
        api_key: str,
        mode: Literal["monk", "omni"],
        strategy_prompt: str,
        indicators: list[str],
    ):
        self.model = model
        self.api_key = decrypt_api_key(api_key)
        self.mode = mode
        self.strategy_prompt = strategy_prompt
        self.indicators = indicators
        self.base_url = "https://openrouter.ai/api/v1"
    
    def build_system_prompt(self) -> str:
        """Build system prompt based on mode and config."""
        mode_rules = {
            "monk": """
You are a trading AI operating in MONK MODE.
- Pure technical analysis only
- No access to news or dates
- Max 1% risk per trade
- Max 1 trade per 4 hours
- Focus on price structure and momentum
""",
            "omni": """
You are a trading AI operating in OMNI MODE.
- Full technical analysis + news/sentiment
- Complete market context available
- Flexible position sizing
- No trade frequency limits
"""
        }
        
        return f"""
{mode_rules[self.mode]}

Available indicators: {', '.join(self.indicators)}

{self.strategy_prompt}

You must respond with a valid JSON object:
{{
    "action": "LONG" | "SHORT" | "HOLD" | "CLOSE",
    "reasoning": "Your analysis and reasoning",
    "confidence": 0-100,
    "order": {{
        "leverage": 1-5,
        "stop_loss_pct": float,
        "take_profit_pct": float
    }} // Only if action is LONG or SHORT
}}
"""
    
    def build_candle_prompt(
        self,
        candle: dict,
        indicators: dict,
        position: dict | None
    ) -> str:
        """Build prompt for specific candle."""
        position_text = "No open position." if not position else f"""
Current position: {position['type'].upper()}
Entry price: ${position['entry_price']:,.2f}
Unrealized PnL: {position['unrealized_pnl_pct']:.2f}%
"""
        
        return f"""
Current candle data:
- Open: ${candle['open']:,.2f}
- High: ${candle['high']:,.2f}
- Low: ${candle['low']:,.2f}
- Close: ${candle['close']:,.2f}
- Volume: {candle['volume']:,.2f}

Indicator values:
{self._format_indicators(indicators)}

{position_text}

Analyze the market and make your trading decision.
"""
    
    def _format_indicators(self, indicators: dict) -> str:
        lines = []
        for name, value in indicators.items():
            if isinstance(value, float):
                lines.append(f"- {name}: {value:.4f}")
            else:
                lines.append(f"- {name}: {value}")
        return "\n".join(lines)
    
    async def get_decision(
        self,
        candle: dict,
        indicators: dict,
        position: dict | None = None
    ) -> AIDecision:
        """Get AI trading decision for candle."""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://alphalab.io",
                    "X-Title": "AlphaLab"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.build_system_prompt()},
                        {"role": "user", "content": self.build_candle_prompt(candle, indicators, position)}
                    ],
                    "temperature": 0.3,  # Lower for more consistent decisions
                    "max_tokens": 1000,
                    "response_format": {"type": "json_object"}
                },
                timeout=30.0
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Parse AI response
            ai_response = data["choices"][0]["message"]["content"]
            import json
            parsed = json.loads(ai_response)
            
            return AIDecision(
                action=parsed["action"].lower(),
                reasoning=parsed["reasoning"],
                confidence=parsed.get("confidence"),
                order=parsed.get("order")
            )
```

---

## ⚔️ BACKTEST ENGINE

```python
# engine/backtest_engine.py

import asyncio
from datetime import datetime
from typing import AsyncGenerator
from services.market_data_service import MarketDataService
from engine.ai_trader import AITrader
from engine.indicator_calculator import IndicatorCalculator
from engine.position_manager import PositionManager
from websocket.connection_manager import ConnectionManager


class BacktestEngine:
    """Execute backtest simulation."""
    
    SPEED_DELAYS = {
        "slow": 1.0,
        "normal": 0.5,
        "fast": 0.2,
        "instant": 0.0
    }
    
    def __init__(
        self,
        session_id: str,
        agent: dict,
        config: dict,
        ws_manager: ConnectionManager
    ):
        self.session_id = session_id
        self.agent = agent
        self.config = config
        self.ws_manager = ws_manager
        
        self.market_data = MarketDataService()
        self.indicators = IndicatorCalculator(agent["indicators"])
        self.position_manager = PositionManager(
            capital=config["starting_capital"],
            safety_mode=config["safety_mode"],
            allow_leverage=config["allow_leverage"]
        )
        
        self.ai_trader = AITrader(
            model=agent["model"],
            api_key=agent["api_key_encrypted"],
            mode=agent["mode"],
            strategy_prompt=agent["strategy_prompt"],
            indicators=agent["indicators"]
        )
        
        self.is_running = False
        self.is_paused = False
        self.current_candle = 0
        self.speed = config.get("playback_speed", "normal")
    
    async def run(self):
        """Main execution loop."""
        self.is_running = True
        
        # Load historical data
        candles = await self.market_data.get_candles(
            asset=self.config["asset"],
            timeframe=self.config["timeframe"],
            start=self.config["start_date"],
            end=self.config["end_date"]
        )
        
        total_candles = len(candles)
        
        # Send initialized event
        await self.ws_manager.broadcast(self.session_id, {
            "event": "session_initialized",
            "data": {
                "session_id": self.session_id,
                "total_candles": total_candles,
                "agent_name": self.agent["name"]
            }
        })
        
        # Process each candle
        for i, candle in enumerate(candles):
            if not self.is_running:
                break
            
            while self.is_paused:
                await asyncio.sleep(0.1)
                if not self.is_running:
                    break
            
            self.current_candle = i
            
            # Calculate indicators
            indicator_values = self.indicators.calculate(candles[:i+1])
            
            # Send candle event
            await self.ws_manager.broadcast(self.session_id, {
                "event": "candle",
                "data": {
                    "index": i,
                    "total": total_candles,
                    "progress_pct": (i / total_candles) * 100,
                    "candle": candle,
                    "indicators": indicator_values
                }
            })
            
            # Get AI decision
            current_position = self.position_manager.get_position()
            
            # Stream thinking
            await self.ws_manager.broadcast(self.session_id, {
                "event": "ai_thinking",
                "data": {"candle_index": i, "text": "Analyzing market conditions...", "is_complete": False}
            })
            
            decision = await self.ai_trader.get_decision(
                candle=candle,
                indicators=indicator_values,
                position=current_position
            )
            
            # Send full reasoning
            await self.ws_manager.broadcast(self.session_id, {
                "event": "ai_thinking",
                "data": {"candle_index": i, "text": decision.reasoning, "is_complete": True}
            })
            
            # Send decision
            await self.ws_manager.broadcast(self.session_id, {
                "event": "ai_decision",
                "data": {
                    "candle_index": i,
                    "action": decision.action,
                    "reasoning": decision.reasoning,
                    "confidence": decision.confidence,
                    "order": decision.order
                }
            })
            
            # Execute trade if needed
            await self._execute_decision(decision, candle, i)
            
            # Send stats update
            stats = self.position_manager.get_stats()
            await self.ws_manager.broadcast(self.session_id, {
                "event": "stats_update",
                "data": stats
            })
            
            # Delay based on speed
            await asyncio.sleep(self.SPEED_DELAYS[self.speed])
        
        # Complete session
        await self._complete_session()
    
    async def _execute_decision(self, decision, candle, candle_index):
        """Execute AI decision."""
        if decision.action == "long" and not self.position_manager.has_position():
            trade = self.position_manager.open_position(
                position_type="long",
                price=candle["close"],
                order=decision.order,
                candle_index=candle_index,
                reasoning=decision.reasoning
            )
            await self.ws_manager.broadcast(self.session_id, {
                "event": "position_opened",
                "data": trade
            })
        
        elif decision.action == "short" and not self.position_manager.has_position():
            trade = self.position_manager.open_position(
                position_type="short",
                price=candle["close"],
                order=decision.order,
                candle_index=candle_index,
                reasoning=decision.reasoning
            )
            await self.ws_manager.broadcast(self.session_id, {
                "event": "position_opened",
                "data": trade
            })
        
        elif decision.action == "close" and self.position_manager.has_position():
            trade = self.position_manager.close_position(
                price=candle["close"],
                exit_type="signal",
                candle_index=candle_index,
                reasoning=decision.reasoning
            )
            await self.ws_manager.broadcast(self.session_id, {
                "event": "position_closed",
                "data": trade
            })
        
        # Check SL/TP
        if self.position_manager.has_position():
            sl_tp_result = self.position_manager.check_sl_tp(
                high=candle["high"],
                low=candle["low"],
                candle_index=candle_index
            )
            if sl_tp_result:
                await self.ws_manager.broadcast(self.session_id, {
                    "event": "position_closed",
                    "data": sl_tp_result
                })
    
    async def _complete_session(self):
        """Finalize and save results."""
        from services.result_service import create_result
        
        final_stats = self.position_manager.get_final_stats()
        trades = self.position_manager.get_all_trades()
        
        # Save to database
        result = await create_result(
            session_id=self.session_id,
            stats=final_stats,
            trades=trades
        )
        
        await self.ws_manager.broadcast(self.session_id, {
            "event": "session_completed",
            "data": {
                "session_id": self.session_id,
                "result_id": result["id"],
                "final_stats": final_stats,
                "is_profitable": final_stats["total_pnl_pct"] >= 0,
                "can_generate_certificate": final_stats["total_pnl_pct"] >= 0
            }
        })
    
    def pause(self):
        self.is_paused = True
    
    def resume(self):
        self.is_paused = False
    
    def stop(self):
        self.is_running = False
    
    def set_speed(self, speed: str):
        self.speed = speed
```

---

## 📊 INDICATOR CALCULATOR

```python
# engine/indicator_calculator.py

import numpy as np
import pandas as pd


class IndicatorCalculator:
    """Calculate technical indicators from candle data."""
    
    def __init__(self, indicators: list[str]):
        self.indicators = indicators
    
    def calculate(self, candles: list[dict]) -> dict:
        """Calculate all configured indicators."""
        df = pd.DataFrame(candles)
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        
        result = {}
        
        for indicator in self.indicators:
            if indicator == "rsi" or indicator == "rsi_14":
                result["rsi_14"] = self._calculate_rsi(df['close'], 14)
            elif indicator == "macd":
                macd, signal, hist = self._calculate_macd(df['close'])
                result["macd"] = macd
                result["macd_signal"] = signal
                result["macd_histogram"] = hist
            elif indicator.startswith("ema_"):
                period = int(indicator.split("_")[1])
                result[indicator] = self._calculate_ema(df['close'], period)
            elif indicator.startswith("sma_"):
                period = int(indicator.split("_")[1])
                result[indicator] = self._calculate_sma(df['close'], period)
            elif indicator == "atr" or indicator == "atr_14":
                result["atr_14"] = self._calculate_atr(df, 14)
            elif indicator == "volume":
                result["volume"] = df['volume'].iloc[-1]
                result["volume_sma"] = df['volume'].rolling(20).mean().iloc[-1]
            elif indicator == "stoch":
                k, d = self._calculate_stochastic(df)
                result["stoch_k"] = k
                result["stoch_d"] = d
            elif indicator == "bb" or indicator == "bollinger":
                upper, middle, lower = self._calculate_bollinger(df['close'])
                result["bb_upper"] = upper
                result["bb_middle"] = middle
                result["bb_lower"] = lower
        
        return result
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> float:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return round(rsi.iloc[-1], 2)
    
    def _calculate_macd(self, prices: pd.Series, fast=12, slow=26, signal=9):
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal).mean()
        histogram = macd_line - signal_line
        return (
            round(macd_line.iloc[-1], 4),
            round(signal_line.iloc[-1], 4),
            round(histogram.iloc[-1], 4)
        )
    
    def _calculate_ema(self, prices: pd.Series, period: int) -> float:
        return round(prices.ewm(span=period).mean().iloc[-1], 2)
    
    def _calculate_sma(self, prices: pd.Series, period: int) -> float:
        return round(prices.rolling(period).mean().iloc[-1], 2)
    
    def _calculate_atr(self, df: pd.DataFrame, period: int = 14) -> float:
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = tr.rolling(period).mean()
        return round(atr.iloc[-1], 2)
    
    def _calculate_stochastic(self, df: pd.DataFrame, k_period=14, d_period=3):
        low_min = df['low'].rolling(k_period).min()
        high_max = df['high'].rolling(k_period).max()
        k = 100 * (df['close'] - low_min) / (high_max - low_min)
        d = k.rolling(d_period).mean()
        return round(k.iloc[-1], 2), round(d.iloc[-1], 2)
    
    def _calculate_bollinger(self, prices: pd.Series, period=20, std_dev=2):
        sma = prices.rolling(period).mean()
        std = prices.rolling(period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        return (
            round(upper.iloc[-1], 2),
            round(sma.iloc[-1], 2),
            round(lower.iloc[-1], 2)
        )
```

---

## 🔌 WEBSOCKET MANAGER

```python
# websocket/connection_manager.py

from fastapi import WebSocket
from typing import Dict, Set
import asyncio
import json


class ConnectionManager:
    """Manage WebSocket connections for sessions."""
    
    def __init__(self):
        # session_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, session_id: str, websocket: WebSocket):
        """Add connection to session."""
        async with self._lock:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = set()
            self.active_connections[session_id].add(websocket)
    
    async def disconnect(self, session_id: str, websocket: WebSocket):
        """Remove connection from session."""
        async with self._lock:
            if session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
    
    async def broadcast(self, session_id: str, message: dict):
        """Send message to all connections in session."""
        if session_id not in self.active_connections:
            return
        
        message_json = json.dumps(message)
        dead_connections = set()
        
        for connection in self.active_connections[session_id]:
            try:
                await connection.send_text(message_json)
            except:
                dead_connections.add(connection)
        
        # Cleanup dead connections
        for conn in dead_connections:
            await self.disconnect(session_id, conn)
    
    def get_connection_count(self, session_id: str) -> int:
        """Get number of connections for session."""
        return len(self.active_connections.get(session_id, set()))


# Global instance
ws_manager = ConnectionManager()
```

---

## 📜 CERTIFICATE GENERATOR

```python
# utils/pdf_generator.py

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import qrcode
from io import BytesIO


class CertificateGenerator:
    """Generate PDF certificates for test results."""
    
    def __init__(self, result: dict, certificate: dict):
        self.result = result
        self.certificate = certificate
        self.width, self.height = A4
    
    def generate_pdf(self) -> BytesIO:
        """Generate certificate PDF."""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Background
        c.setFillColor(HexColor("#0A0A0F"))
        c.rect(0, 0, self.width, self.height, fill=True)
        
        # Border
        c.setStrokeColor(HexColor("#00D4FF"))
        c.setLineWidth(2)
        margin = 40
        c.rect(margin, margin, self.width - 2*margin, self.height - 2*margin)
        
        # Title
        c.setFillColor(HexColor("#00D4FF"))
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(self.width/2, self.height - 100, "ALPHALAB")
        
        c.setFillColor(HexColor("#FFFFFF"))
        c.setFont("Helvetica", 18)
        c.drawCentredString(self.width/2, self.height - 130, "CERTIFICATE OF INTELLIGENCE")
        
        # Agent name
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(self.width/2, self.height - 200, self.result["agent_name"])
        
        # Results
        y_pos = self.height - 280
        results = [
            ("Asset", self.result["asset"]),
            ("Test Type", self.result["type"].upper()),
            ("Mode", self.result["mode"].upper()),
            ("Total PnL", f"+{self.result['total_pnl_pct']:.2f}%" if self.result["total_pnl_pct"] >= 0 else f"{self.result['total_pnl_pct']:.2f}%"),
            ("Win Rate", f"{self.result['win_rate']:.1f}%"),
            ("Total Trades", str(self.result["total_trades"])),
            ("Duration", self.result["duration_display"]),
        ]
        
        c.setFont("Helvetica", 14)
        for label, value in results:
            c.setFillColor(HexColor("#A1A1AA"))
            c.drawString(margin + 60, y_pos, f"{label}:")
            c.setFillColor(HexColor("#FFFFFF"))
            c.drawString(margin + 180, y_pos, value)
            y_pos -= 25
        
        # QR Code
        qr = qrcode.make(self.certificate["share_url"])
        qr_buffer = BytesIO()
        qr.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        
        from reportlab.lib.utils import ImageReader
        qr_img = ImageReader(qr_buffer)
        c.drawImage(qr_img, self.width - 150, margin + 20, 100, 100)
        
        # Verification code
        c.setFillColor(HexColor("#A1A1AA"))
        c.setFont("Helvetica", 10)
        c.drawString(margin + 40, margin + 40, f"Certificate ID: {self.certificate['verification_code']}")
        c.drawString(margin + 40, margin + 25, f"Verify: {self.certificate['share_url']}")
        
        c.save()
        buffer.seek(0)
        return buffer
```

---

## 🧪 TESTING

```python
# tests/test_agents.py

import pytest
from httpx import AsyncClient
from app import app

@pytest.fixture
def test_user_token():
    """Mock Clerk JWT token for testing."""
    # Generate test token or use Clerk test mode
    return "test_jwt_token"

@pytest.mark.asyncio
async def test_create_agent(test_user_token):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/agents",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "name": "Test Agent",
                "mode": "monk",
                "model": "deepseek-r1",
                "api_key_id": "test-api-key-id",
                "indicators": ["rsi", "macd"],
                "strategy_prompt": "This is a test strategy that is at least fifty characters."
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["agent"]["name"] == "Test Agent"
        assert data["agent"]["mode"] == "monk"

@pytest.mark.asyncio
async def test_list_agents(test_user_token):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/agents",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert isinstance(data["agents"], list)
```

---

## 🚀 DEPLOYMENT

### Environment Variables

```env
# .env

# Environment
ENVIRONMENT=production
DEBUG=false

# Server
HOST=0.0.0.0
PORT=5000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Clerk
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Encryption (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
ENCRYPTION_KEY=xxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx

# Redis
REDIS_URL=redis://localhost:6379/0
```

### Docker

```dockerfile
# Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install TA-Lib dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install TA-Lib
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
```

---

## 📋 MIGRATION RUNNER

```python
# migrations/migrate.py

import os
import glob
from supabase import create_client

def run_migrations():
    """Run all SQL migrations in order."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    client = create_client(supabase_url, supabase_key)
    
    # Get all migration files
    migration_files = sorted(glob.glob("migrations/*.sql"))
    
    for migration_file in migration_files:
        print(f"Running migration: {migration_file}")
        
        with open(migration_file, "r") as f:
            sql = f.read()
        
        # Execute via Supabase SQL
        try:
            client.postgrest.rpc("exec_sql", {"sql": sql}).execute()
            print(f"  ✓ Success")
        except Exception as e:
            print(f"  ✗ Error: {e}")
            raise

if __name__ == "__main__":
    run_migrations()
```

---

## 📚 DOCUMENT INDEX

| Part | File | Content |
|------|------|---------|
| 01 | `01-database-schema.md` | Supabase tables, indexes, RLS |
| 02 | `02-api-endpoints.md` | REST API specifications |
| 03 | `03-websocket-events.md` | Real-time WebSocket events |
| 04 | `04-implementation-guide.md` | Code structure, key implementations |

---

**END OF BACKEND SPECIFICATION**

