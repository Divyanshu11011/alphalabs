"""
DEPRECATED: This module has been refactored into a package.

This file is maintained for backward compatibility only.
Please update your imports to use the new package structure:

    from services.trading.backtest_engine import BacktestEngine, SessionState

The import path remains the same, but the implementation has been
modularized into the backtest_engine/ package for better maintainability.

This wrapper will be removed in a future version.
"""

import warnings

# Issue deprecation warning when this module is imported
warnings.warn(
    "Importing from 'services.trading.backtest_engine' module is deprecated. "
    "The module has been refactored into a package. "
    "While imports still work, please be aware that this wrapper may be removed in a future version. "
    "The recommended import remains: from services.trading.backtest_engine import BacktestEngine, SessionState",
    DeprecationWarning,
    stacklevel=2
)

# Re-export all public APIs from the new package
from services.trading.backtest_engine import (
    BacktestEngine,
    SessionState,
    EventBroadcaster,
    PositionHandler,
    DatabaseManager,
    CandleProcessor,
    __version__
)

__all__ = [
    'BacktestEngine',
    'SessionState',
    'EventBroadcaster',
    'PositionHandler',
    'DatabaseManager',
    'CandleProcessor',
]
