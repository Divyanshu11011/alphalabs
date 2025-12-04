"""
Position lifecycle management for forward test engine.

This module handles position opened and closed events, including
database updates, WebSocket broadcasting, and email notifications.
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from models.arena import Trade
from websocket.manager import WebSocketManager
from websocket.events import Event, EventType

logger = logging.getLogger(__name__)


class PositionHandler:
    """
    Manages position lifecycle events for forward tests.
    
    Handles position opened and closed events, including:
    - Creating/updating trade records in database
    - Broadcasting WebSocket events
    - Triggering email notifications
    """
    
    def __init__(
        self,
        websocket_manager: WebSocketManager,
        notification_manager: Any
    ):
        """
        Initialize position handler.
        
        Args:
            websocket_manager: WebSocket manager for broadcasting events
            notification_manager: Notification manager for email alerts
        """
        self.websocket_manager = websocket_manager
        self.notification_manager = notification_manager
        self.logger = logging.getLogger(__name__)
    
    async def handle_position_opened(
        self,
        db: AsyncSession,
        session_id: str,
        session_state: Any,
        position: Any,
        candle_number: int,
        timestamp: datetime,
        reasoning: str,
        email_notifications: bool = False
    ) -> None:
        """
        Handle position opened event.
        
        Creates trade record in database, broadcasts WebSocket event,
        and sends email notification if enabled.
        
        Args:
            db: Database session
            session_id: Session identifier
            session_state: Session state object
            position: Opened position data
            candle_number: Current candle number
            timestamp: Position open timestamp
            reasoning: AI reasoning for opening position
            email_notifications: Whether to send email notification
        """
        self.logger.info(
            f"Position opened: session_id={session_id}, "
            f"action={position.action}, entry_price={position.entry_price}, "
            f"size={position.size}, leverage={position.leverage}"
        )
        
        # Create trade record in database
        trade_number = len(session_state.position_manager.get_closed_trades()) + 1
        trade = Trade(
            session_id=session_id,
            trade_number=trade_number,
            type=position.action,
            entry_price=Decimal(str(position.entry_price)),
            entry_time=timestamp,
            entry_candle=candle_number,
            entry_reasoning=reasoning,
            size=Decimal(str(position.size)),
            leverage=position.leverage,
            stop_loss=Decimal(str(position.stop_loss)) if position.stop_loss else None,
            take_profit=Decimal(str(position.take_profit)) if position.take_profit else None
        )
        db.add(trade)
        await db.commit()
        
        # Broadcast position opened event
        event = Event(
            type=EventType.POSITION_OPENED,
            data={
                "trade_number": trade_number,
                "action": position.action,
                "entry_price": position.entry_price,
                "size": position.size,
                "leverage": position.leverage,
                "stop_loss": position.stop_loss,
                "take_profit": position.take_profit,
                "entry_time": timestamp.isoformat(),
                "reasoning": reasoning
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        
        # Send email notification if enabled
        if email_notifications:
            await self.notification_manager.send_position_opened_notification(
                session_state,
                position
            )
    
    async def handle_position_closed(
        self,
        db: AsyncSession,
        session_id: str,
        session_state: Any,
        trade: Any,
        candle_number: int,
        timestamp: datetime,
        email_notifications: bool = False
    ) -> None:
        """
        Handle position closed event.
        
        Updates trade record in database, broadcasts WebSocket event,
        and sends email notification if enabled.
        
        Args:
            db: Database session
            session_id: Session identifier
            session_state: Session state object
            trade: Closed trade data from position manager
            candle_number: Current candle number
            timestamp: Position close timestamp
            email_notifications: Whether to send email notification
        """
        self.logger.info(
            f"Position closed: session_id={session_id}, "
            f"action={trade.action}, exit_price={trade.exit_price}, "
            f"pnl={trade.pnl}, reason={trade.reason}"
        )
        
        # Map position manager reason to database exit_type
        # Database allows: 'take_profit', 'stop_loss', 'manual', 'signal'
        # Position manager uses: 'take_profit', 'stop_loss', 'ai_decision', 'manual'
        exit_type_map = {
            "take_profit": "take_profit",
            "stop_loss": "stop_loss",
            "manual": "manual",
            "ai_decision": "signal"  # Map AI decision to signal
        }
        db_exit_type = exit_type_map.get(trade.reason, "signal")
        
        # Update trade record in database
        trade_number = len(session_state.position_manager.get_closed_trades())
        stmt = (
            update(Trade)
            .where(Trade.session_id == session_id)
            .where(Trade.trade_number == trade_number)
            .values(
                exit_price=Decimal(str(trade.exit_price)),
                exit_time=timestamp,
                exit_candle=candle_number,
                exit_type=db_exit_type,
                pnl_amount=Decimal(str(trade.pnl)),
                pnl_pct=Decimal(str(trade.pnl_pct))
            )
        )
        await db.execute(stmt)
        await db.commit()
        
        # Broadcast position closed event
        event = Event(
            type=EventType.POSITION_CLOSED,
            data={
                "trade_number": trade_number,
                "action": trade.action,
                "entry_price": trade.entry_price,
                "exit_price": trade.exit_price,
                "entry_time": trade.entry_time.isoformat(),
                "exit_time": timestamp.isoformat(),
                "size": trade.size,
                "pnl": trade.pnl,
                "pnl_pct": trade.pnl_pct,
                "reason": trade.reason,
                "leverage": trade.leverage
            }
        )
        await self.websocket_manager.broadcast_to_session(session_id, event)
        
        # Send email notification if enabled
        if email_notifications:
            await self.notification_manager.send_position_closed_notification(
                session_state,
                trade
            )
