from typing import Optional, TYPE_CHECKING

from database import async_session_maker
from websocket.manager import websocket_manager

if TYPE_CHECKING:  # pragma: no cover
    from services.trading.backtest_engine import BacktestEngine
    from services.trading.forward_engine import ForwardEngine

_backtest_engine: Optional["BacktestEngine"] = None
_forward_engine: Optional["ForwardEngine"] = None


def get_backtest_engine() -> "BacktestEngine":
    """Return singleton BacktestEngine instance."""
    from services.trading.backtest_engine import BacktestEngine

    global _backtest_engine
    if _backtest_engine is None:
        _backtest_engine = BacktestEngine(
            session_factory=async_session_maker,
            websocket_manager=websocket_manager,
        )
    return _backtest_engine


def get_forward_engine() -> "ForwardEngine":
    """Return singleton ForwardEngine instance."""
    from services.trading.forward_engine import ForwardEngine

    global _forward_engine
    if _forward_engine is None:
        _forward_engine = ForwardEngine(
            session_factory=async_session_maker,
            websocket_manager=websocket_manager,
        )
    return _forward_engine

