"""
Timing management for forward test engine.

This module handles candle timing calculations, countdown updates,
and waiting for candle closes in real-time forward testing.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from services.market_data_service import MarketDataService, Candle
from websocket.manager import WebSocketManager
from websocket.events import create_countdown_update_event

from .session_state import SessionState

logger = logging.getLogger(__name__)


class TimingManager:
    """
    Manages timing operations for forward test sessions.
    
    Responsibilities:
    - Calculate next candle close times based on timeframe
    - Wait for candle closes with countdown updates
    - Poll market data service for new candles
    - Broadcast countdown updates to WebSocket clients
    """
    
    # Timeframe to minutes mapping
    TIMEFRAME_MINUTES = {
        '15m': 15,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
    }
    
    def __init__(self, websocket_manager: WebSocketManager):
        """
        Initialize timing manager.
        
        Args:
            websocket_manager: WebSocket manager for broadcasting countdown updates
        """
        self.websocket_manager = websocket_manager
        self.logger = logging.getLogger(__name__)
    
    def calculate_next_candle_close_time(
        self,
        current_time: datetime,
        timeframe: str
    ) -> datetime:
        """
        Calculate the next candle close time based on timeframe.
        
        Rounds current time to the next candle boundary. For example,
        if it's 10:23 and timeframe is 1h, next close is 11:00.
        
        Args:
            current_time: Current datetime
            timeframe: Candlestick timeframe (e.g., '1h', '15m')
            
        Returns:
            datetime: Next candle close time
        """
        minutes = self.TIMEFRAME_MINUTES.get(timeframe, 60)
        
        # Round current time to the next candle boundary
        current_minute = current_time.hour * 60 + current_time.minute
        
        # Calculate minutes until next boundary
        minutes_until_next = minutes - (current_minute % minutes)
        
        # Calculate next close time
        next_close = current_time + timedelta(minutes=minutes_until_next)
        
        # Round to exact minute (remove seconds and microseconds)
        next_close = next_close.replace(second=0, microsecond=0)
        
        return next_close
    
    async def wait_for_candle_close(
        self,
        session_id: str,
        session_state: SessionState,
        market_data_service: MarketDataService
    ) -> Optional[Candle]:
        """
        Wait for the next candle to close, sending countdown updates.
        
        Polls market data service for latest candle and sends countdown
        updates every 30 seconds until candle closes.
        
        Args:
            session_id: Session identifier
            session_state: Session state object
            market_data_service: Market data service instance
            
        Returns:
            Candle: The newly closed candle, or None if stopped
        """
        # Get current time
        current_time = datetime.now(timezone.utc)
        
        # Calculate next candle close time
        next_close_time = self.calculate_next_candle_close_time(
            current_time,
            session_state.timeframe
        )
        session_state.next_candle_time = next_close_time
        
        self.logger.info(
            f"Waiting for candle close: session_id={session_id}, "
            f"next_close={next_close_time.isoformat()}"
        )
        
        # Get the last known candle timestamp to detect new candles
        last_candle_timestamp = None
        if session_state.candles_processed:
            last_candle_timestamp = session_state.candles_processed[-1].timestamp
        
        # Wait loop with countdown updates
        while not session_state.is_stopped:
            current_time = datetime.now(timezone.utc)
            
            # Calculate seconds remaining
            seconds_remaining = int((next_close_time - current_time).total_seconds())
            
            # Check if candle has closed
            if seconds_remaining <= 0:
                # Try to fetch the new candle
                try:
                    latest_candle = await market_data_service.get_latest_candle(
                        session_state.asset,
                        session_state.timeframe
                    )
                    
                    # Check if this is a new candle
                    if last_candle_timestamp is None or latest_candle.timestamp > last_candle_timestamp:
                        self.logger.info(
                            f"New candle detected: session_id={session_id}, "
                            f"timestamp={latest_candle.timestamp.isoformat()}"
                        )
                        return latest_candle
                    else:
                        # Candle not ready yet, wait a bit more
                        self.logger.debug(
                            f"Candle not ready yet: session_id={session_id}, "
                            f"waiting 10 more seconds"
                        )
                        await asyncio.sleep(10)
                        # Recalculate next close time
                        next_close_time = self.calculate_next_candle_close_time(
                            datetime.now(timezone.utc),
                            session_state.timeframe
                        )
                        continue
                        
                except Exception as e:
                    self.logger.error(f"Error fetching latest candle: {e}")
                    # Wait and retry
                    await asyncio.sleep(10)
                    continue
            
            # Send countdown update
            await self._broadcast_countdown_update(
                session_id,
                seconds_remaining,
                next_close_time,
                session_state
            )
            
            # Wait 30 seconds before next update (or less if close to candle close)
            wait_time = min(30, max(1, seconds_remaining))
            await asyncio.sleep(wait_time)
        
        # Stopped during wait
        return None
    
    def calculate_next_ai_intervention(
        self,
        session_state: SessionState,
        current_candle_index: int
    ) -> tuple[int, int]:
        """
        Calculate when the next AI intervention will occur.
        
        Returns:
            Tuple of (candles_until_intervention, minutes_until_intervention)
        """
        mode = getattr(session_state, "decision_mode", "every_candle")
        interval = getattr(session_state, "decision_interval_candles", 1) or 1
        decision_start = getattr(session_state, "decision_start_index", 0)
        
        if mode == "every_candle":
            # AI intervenes on every candle (after warm-up)
            if current_candle_index < decision_start:
                # Still in warm-up, calculate candles until warm-up completes
                candles_until = decision_start - current_candle_index
            else:
                # Next candle will trigger AI
                candles_until = 1
        else:  # every_n_candles
            # Calculate how many candles until next decision candle
            if current_candle_index < decision_start:
                # Still in warm-up
                candles_until = decision_start - current_candle_index
            else:
                # Calculate next decision candle
                elapsed = current_candle_index - decision_start
                next_decision_candle = ((elapsed // interval) + 1) * interval + decision_start
                candles_until = next_decision_candle - current_candle_index
        
        # Convert candles to minutes based on timeframe
        minutes_per_candle = self.TIMEFRAME_MINUTES.get(session_state.timeframe, 60)
        minutes_until = candles_until * minutes_per_candle
        
        return candles_until, minutes_until
    
    async def _broadcast_countdown_update(
        self,
        session_id: str,
        seconds_remaining: int,
        next_candle_time: datetime,
        session_state: SessionState
    ) -> None:
        """
        Broadcast countdown update event to WebSocket clients.
        
        Includes both next candle time and next AI intervention time.
        
        Args:
            session_id: Session identifier
            seconds_remaining: Seconds until next candle close
            next_candle_time: Expected time of next candle close
            session_state: Session state to calculate AI intervention timing
        """
        # Calculate next AI intervention
        current_candle_index = len(session_state.candles_processed) - 1 if session_state.candles_processed else 0
        candles_until_ai, minutes_until_ai = self.calculate_next_ai_intervention(
            session_state,
            current_candle_index
        )
        
        event = create_countdown_update_event(
            seconds_remaining=seconds_remaining,
            next_candle_time=next_candle_time.isoformat()
        )
        # Add AI intervention info to event data
        event.data["next_ai_intervention_candles"] = candles_until_ai
        event.data["next_ai_intervention_minutes"] = minutes_until_ai
        
        await self.websocket_manager.broadcast_to_session(session_id, event)
