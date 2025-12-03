"""
Forward Test Engine Package for AlphaLab Trading Platform.

This package provides modularized components for executing forward tests
with live market data, waiting for candle closes and processing in real-time.
Supports auto-stop conditions, email notifications, and real-time WebSocket updates.

The package is organized into focused modules:
- engine: Main ForwardEngine class and orchestration
- session_state: SessionState dataclass for runtime state management
- processor: Candle processing and decision execution logic
- position_handler: Position lifecycle management
- broadcaster: WebSocket event broadcasting
- database: Database update operations
- timing: Candle timing and countdown logic
- auto_stop: Auto-stop condition monitoring
- notifications: Email notification handling

Public API:
    ForwardEngine: Main engine class for executing forward tests
    SessionState: Runtime state container for forward test sessions

Usage:
    from services.trading.forward_engine import ForwardEngine, SessionState
    
    engine = ForwardEngine(db_session, websocket_manager)
    await engine.start_forward_test(
        session_id="uuid",
        agent=agent_obj,
        asset="BTC/USDT",
        timeframe="1h",
        starting_capital=10000.0,
        safety_mode=True,
        auto_stop_config={
            "enabled": True,
            "loss_pct": 5.0
        }
    )
"""

# Import public API from modularized components
from .engine import ForwardEngine
from .session_state import SessionState

__all__ = [
    'ForwardEngine',
    'SessionState',
]

# Version info
__version__ = "2.0.0"
