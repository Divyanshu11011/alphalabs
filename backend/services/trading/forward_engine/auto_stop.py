"""
Auto-stop condition monitoring for forward test engine.

This module handles the monitoring and triggering of auto-stop conditions
during forward tests, including loss thresholds and other configurable
stop conditions.
"""

import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from services.market_data_service import Candle
from websocket.manager import WebSocketManager

logger = logging.getLogger(__name__)


class AutoStopManager:
    """
    Manages auto-stop condition monitoring for forward tests.
    
    Monitors various conditions like loss thresholds and triggers
    auto-stop when conditions are met.
    """
    
    def __init__(self, websocket_manager: WebSocketManager):
        """
        Initialize auto-stop manager.
        
        Args:
            websocket_manager: WebSocket manager for broadcasting events
        """
        self.websocket_manager = websocket_manager
        self.logger = logging.getLogger(__name__)
    
    async def check_auto_stop_conditions(
        self,
        session_id: str,
        session_state: Any
    ) -> bool:
        """
        Check if auto-stop conditions are met.
        
        Monitors loss threshold and other auto-stop conditions.
        
        Args:
            session_id: Session identifier
            session_state: Session state object
            
        Returns:
            bool: True if auto-stop should trigger, False otherwise
        """
        # Check if auto-stop is enabled
        if not session_state.auto_stop_config.get("enabled", False):
            return False
        
        # Get current stats
        stats = session_state.position_manager.get_stats()
        
        # Check loss threshold
        loss_pct_threshold = session_state.auto_stop_config.get("loss_pct")
        if loss_pct_threshold is not None:
            current_pnl_pct = stats.get("total_pnl_pct", 0.0)
            
            if current_pnl_pct <= -abs(loss_pct_threshold):
                self.logger.warning(
                    f"Auto-stop triggered by loss threshold: "
                    f"session_id={session_id}, "
                    f"current_pnl={current_pnl_pct}%, "
                    f"threshold={-abs(loss_pct_threshold)}%"
                )
                return True
        
        # Add more auto-stop conditions here if needed
        # For example: max drawdown, time-based, etc.
        
        return False
    
    async def handle_auto_stop(
        self,
        db: AsyncSession,
        session_id: str,
        session_state: Any,
        email_notifications: bool
    ) -> None:
        """
        Handle auto-stop trigger.
        
        Closes open position and prepares for session completion.
        
        Args:
            db: Database session
            session_id: Session identifier
            session_state: Session state object
            email_notifications: Whether to send email notifications
        """
        self.logger.info(f"Handling auto-stop: session_id={session_id}")
        
        # Set stop flag
        session_state.is_stopped = True
        
        # Close open position if exists
        if session_state.position_manager.has_open_position():
            # Get latest candle for exit price
            if session_state.candles_processed:
                latest_candle = session_state.candles_processed[-1]
                
                closed_trade = await session_state.position_manager.close_position(
                    exit_price=latest_candle.close,
                    reason="auto_stop"
                )
                
                if closed_trade:
                    # Import here to avoid circular dependency
                    from services.trading.forward_engine.position_handler import PositionHandler
                    position_handler = PositionHandler(self.websocket_manager)
                    
                    await position_handler.handle_position_closed(
                        db,
                        session_id,
                        session_state,
                        closed_trade,
                        len(session_state.candles_processed),
                        latest_candle.timestamp
                    )
        
        # Send email notification if enabled
        if email_notifications:
            # Import here to avoid circular dependency
            from services.trading.forward_engine.notifications import NotificationManager
            notification_manager = NotificationManager()
            
            await notification_manager.send_auto_stop_notification(session_state)
