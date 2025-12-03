"""
Backtest Engine Package for AlphaLab Trading Platform.

This package provides modularized components for executing backtests
by processing historical candle data sequentially, calculating indicators,
getting AI decisions, and managing positions.

The package is organized into focused modules:
- engine: Main BacktestEngine class and orchestration
- session_state: SessionState dataclass for runtime state management
- processor: Candle processing and decision execution logic
- position_handler: Position lifecycle management
- broadcaster: WebSocket event broadcasting
- database: Database update operations

Public API:
    BacktestEngine: Main engine class for executing backtests
    SessionState: Runtime state container for backtest sessions

Usage:
    from services.trading.backtest_engine import BacktestEngine, SessionState
    
    engine = BacktestEngine(db_session, websocket_manager)
    await engine.start_backtest(
        session_id="uuid",
        agent=agent_obj,
        asset="BTC/USDT",
        timeframe="1h",
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 3, 31),
        starting_capital=10000.0
    )
"""

# Import main engine class and helper classes from the package
from .engine import BacktestEngine
from .session_state import SessionState
from .broadcaster import EventBroadcaster
from .position_handler import PositionHandler
from .database import DatabaseManager
from .processor import CandleProcessor

__all__ = [
    'BacktestEngine',
    'SessionState',
    'EventBroadcaster',
    'PositionHandler',
    'DatabaseManager',
    'CandleProcessor'
]

# Version info
__version__ = "2.0.0"
