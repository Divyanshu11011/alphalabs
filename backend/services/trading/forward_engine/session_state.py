"""
Session state management for forward test engine.

This module contains the SessionState dataclass that represents the runtime
state of a forward test session.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Any

from models.agent import Agent
from services.market_data_service import Candle
from services.trading.position_manager import PositionManager
from services.ai_trader import AITrader


@dataclass
class SessionState:
    """
    Represents the runtime state of a forward test session.
    
    Attributes:
        session_id: Unique session identifier
        agent: Agent configuration
        asset: Trading asset
        timeframe: Candlestick timeframe
        position_manager: Position management instance
        ai_trader: AI decision making instance
        is_stopped: Whether session is stopped
        candles_processed: List of processed candles
        ai_thoughts: List of AI reasoning records
        next_candle_time: Expected time of next candle close
        auto_stop_config: Auto-stop configuration
    """
    session_id: str
    agent: Agent
    asset: str
    timeframe: str
    position_manager: PositionManager
    ai_trader: AITrader
    is_stopped: bool = False
    candles_processed: List[Candle] = None
    ai_thoughts: List[Dict[str, Any]] = None
    next_candle_time: Optional[datetime] = None
    auto_stop_config: Dict[str, Any] = None
    
    def __post_init__(self):
        """Initialize mutable default values."""
        if self.candles_processed is None:
            self.candles_processed = []
        if self.ai_thoughts is None:
            self.ai_thoughts = []
        if self.auto_stop_config is None:
            self.auto_stop_config = {}
