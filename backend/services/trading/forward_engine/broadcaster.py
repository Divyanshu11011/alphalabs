"""
Forward Engine Broadcasting Module.

Purpose:
    Handle all WebSocket event broadcasting for forward test sessions.
    Centralizes event creation and broadcasting logic.

Features:
    - Session lifecycle events (initialized, completed)
    - Candle processing events
    - Countdown update events (specific to forward tests)
    - AI decision events
    - Position events (handled by position_handler)
    - Stats update events
    - Error events

Usage:
    broadcaster = EventBroadcaster(websocket_manager)
    await broadcaster.broadcast_session_initialized(
        session_id="uuid",
        agent_name="My Agent",
        agent_mode="forward",
        asset="BTC/USDT",
        timeframe="1h",
        email_notifications=True
    )
"""

import logging
from typing import Dict, Any
from datetime import datetime

from websocket.manager import WebSocketManager
from websocket.events import Event, EventType, create_countdown_update_event
from services.market_data_service import Candle
from services.ai_trader import AIDecision

logger = logging.getLogger(__name__)


class EventBroadcaster:
    """
    Handles WebSocket event broadcasting for forward test sessions.
    
    Centralizes all event creation and broadcasting logic to maintain
    consistency and reduce code duplication in the main engine.
    """
    
    def __init__(self, websocket_manager: WebSocketManager):
        """
        Initialize event broadcaster.
        
        Args:
            websocket_manager: WebSocket manager for broadcasting events
        """
        self.websocket_manager = websocket_manager
        self.logger = logging.getLogger(__name__)
    
    async def broadcast_session_initialized(
        self,
        session_id: str,
        agent_name: str,
        agent_mode: str,
        asset: str,
        timeframe: str,
        email_notifications: bool
    ) -> None:
        """
        Broadcast session initialized event to WebSocket clients.
        
        Args:
            session_id: Session identifier
            agent_name: Name of the agent
            agent_mode: Agent mode (e.g., 'forward')
            asset: Trading asset (e.g., 'BTC/USDT')
            timeframe: Candlestick timeframe (e.g., '1h')
            email_notifications: Whether email notifications are enabled
        """
        event = Event(
            type=EventType.SESSION_INITIALIZED,
            data={
                "session_id": session_id,
                "agent_name": agent_name,
                "agent_mode": agent_mode,
                "asset": asset,
                "timeframe": timeframe,
                "email_notifications": email_notifications,
                "test_type": "forward"
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.debug(f"Broadcasted session initialized: session_id={session_id}")
    
    async def broadcast_countdown_update(
        self,
        session_id: str,
        seconds_remaining: int,
        next_candle_time: datetime
    ) -> None:
        """
        Broadcast countdown update event.
        
        Specific to forward tests - shows time remaining until next candle close.
        
        Args:
            session_id: Session identifier
            seconds_remaining: Seconds remaining until next candle close
            next_candle_time: Expected datetime of next candle close
        """
        event = create_countdown_update_event(
            seconds_remaining=seconds_remaining,
            next_candle_time=next_candle_time.isoformat()
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.debug(
            f"Broadcasted countdown update: session_id={session_id}, "
            f"seconds_remaining={seconds_remaining}"
        )
    
    async def broadcast_candle(
        self,
        session_id: str,
        candle: Candle,
        indicators: Dict[str, float],
        candle_number: int
    ) -> None:
        """
        Broadcast candle event with indicators.
        
        Args:
            session_id: Session identifier
            candle: Candle data object
            indicators: Calculated indicator values
            candle_number: Current candle number (1-indexed)
        """
        event = Event(
            type=EventType.CANDLE,
            data={
                "candle_number": candle_number,
                "timestamp": candle.timestamp.isoformat(),
                "open": candle.open,
                "high": candle.high,
                "low": candle.low,
                "close": candle.close,
                "volume": candle.volume,
                "indicators": indicators
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.debug(
            f"Broadcasted candle: session_id={session_id}, "
            f"number={candle_number}, close={candle.close}"
        )
    
    async def broadcast_ai_thinking(self, session_id: str) -> None:
        """
        Broadcast AI thinking event.
        
        Indicates that the AI is currently analyzing the market data.
        
        Args:
            session_id: Session identifier
        """
        event = Event(
            type=EventType.AI_THINKING,
            data={"status": "analyzing"}
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.debug(f"Broadcasted AI thinking: session_id={session_id}")
    
    async def broadcast_ai_decision(
        self,
        session_id: str,
        decision: AIDecision
    ) -> None:
        """
        Broadcast AI decision event.
        
        Args:
            session_id: Session identifier
            decision: AI decision object containing action and reasoning
        """
        event = Event(
            type=EventType.AI_DECISION,
            data={
                "action": decision.action,
                "reasoning": decision.reasoning,
                "stop_loss_price": decision.stop_loss_price,
                "take_profit_price": decision.take_profit_price,
                "size_percentage": decision.size_percentage,
                "leverage": decision.leverage
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.debug(
            f"Broadcasted AI decision: session_id={session_id}, "
            f"action={decision.action}"
        )
    
    async def broadcast_stats_update(
        self,
        session_id: str,
        stats: Dict[str, Any]
    ) -> None:
        """
        Broadcast stats update event.
        
        Args:
            session_id: Session identifier
            stats: Statistics dictionary from position manager
        """
        event = Event(
            type=EventType.STATS_UPDATE,
            data=stats
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.debug(f"Broadcasted stats update: session_id={session_id}")
    
    async def broadcast_session_completed(
        self,
        session_id: str,
        result_id: str,
        final_equity: float,
        total_pnl: float,
        total_pnl_pct: float,
        total_trades: int,
        win_rate: float,
        forced_stop: bool = False
    ) -> None:
        """
        Broadcast session completed event.
        
        Args:
            session_id: Session identifier
            result_id: Generated result record ID
            final_equity: Final equity amount
            total_pnl: Total profit/loss amount
            total_pnl_pct: Total profit/loss percentage
            total_trades: Total number of trades
            win_rate: Win rate percentage
            forced_stop: Whether this was a forced stop
        """
        event = Event(
            type=EventType.SESSION_COMPLETED,
            data={
                "session_id": session_id,
                "result_id": result_id,
                "final_equity": final_equity,
                "total_pnl": total_pnl,
                "total_pnl_pct": total_pnl_pct,
                "total_trades": total_trades,
                "win_rate": win_rate,
                "forced_stop": forced_stop
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.info(
            f"Broadcasted session completed: session_id={session_id}, "
            f"final_equity={final_equity}, pnl={total_pnl_pct}%"
        )
    
    async def broadcast_error(
        self,
        session_id: str,
        error_message: str
    ) -> None:
        """
        Broadcast error event to WebSocket clients.
        
        Args:
            session_id: Session identifier
            error_message: Error message to broadcast
        """
        event = Event(
            type=EventType.ERROR,
            data={
                "message": error_message
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        self.logger.error(f"Broadcasted error: session_id={session_id}, error={error_message}")
