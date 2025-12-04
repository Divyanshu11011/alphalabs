"""
Dashboard Service.

Purpose:
    Encapsulates business logic for dashboard statistics and activity feed.
    Handles aggregation of user metrics, trend calculations, and activity retrieval.

Data Flow:
    - Incoming: User ID and query parameters from API layer
    - Processing:
        - Aggregates statistics from agents, test_results, and test_sessions
        - Calculates trends by comparing current vs previous periods
        - Retrieves recent activity from activity_logs
        - Determines quick-start onboarding progress
    - Outgoing: Dictionaries with dashboard data returned to API layer
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import joinedload
from uuid import UUID
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from models import Agent, TestResult, ActivityLog, Certificate, TestSession


class DashboardService:
    """Service for dashboard statistics and activity."""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize the dashboard service.
        
        Args:
            db: Async database session
        """
        self.db = db
    
    async def get_stats(self, user_id: UUID) -> Dict[str, Any]:
        total_agents = await self._count_active_agents(user_id)
        tests_run = await self._count_tests(user_id)
        best_pnl = await self._best_pnl(user_id)
        avg_win_rate = await self._avg_win_rate(user_id)
        trends = await self._build_trends(user_id)
        best_agent = await self._get_best_agent(user_id)
        
        return {
            "total_agents": total_agents,
            "tests_run": tests_run,
            "best_pnl": float(best_pnl) if best_pnl is not None else None,
            "avg_win_rate": float(avg_win_rate) if avg_win_rate is not None else None,
            "trends": trends,
            "best_agent": best_agent,
        }
    
    async def _build_trends(self, user_id: UUID) -> Dict[str, Any]:
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        start_of_day = datetime(now.year, now.month, now.day)
        agents_this_week = await self._count_new_agents(user_id, seven_days_ago)
        tests_today = await self._count_tests_since(user_id, start_of_day)
        win_rate_change = await self._win_rate_change(user_id)
        return {
            "agents_this_week": agents_this_week,
            "tests_today": tests_today,
            "win_rate_change": win_rate_change,
        }

    async def _win_rate_change(self, user_id: UUID) -> Optional[float]:
        now = datetime.utcnow()
        current_start = now - timedelta(days=30)
        previous_start = now - timedelta(days=60)
        current_win_rate = await self._avg_win_rate(user_id, current_start)
        previous_win_rate = await self._avg_win_rate(user_id, previous_start, current_start)
        if current_win_rate is None or previous_win_rate in (None, 0):
            return None
        previous = float(previous_win_rate)
        if previous == 0:
            return None
        current = float(current_win_rate)
        return round(((current - previous) / abs(previous)) * 100, 2)

    async def _count_active_agents(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Agent.id)).where(
                Agent.user_id == user_id,
                Agent.is_archived == False,
            )
        )
        return result.scalar_one()

    async def _count_tests(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(TestResult.id)).where(TestResult.user_id == user_id)
        )
        return result.scalar_one()

    async def _best_pnl(self, user_id: UUID) -> Optional[Decimal]:
        result = await self.db.execute(
            select(func.max(TestResult.total_pnl_pct)).where(TestResult.user_id == user_id)
        )
        return result.scalar_one()

    async def _avg_win_rate(
        self,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Optional[Decimal]:
        query = select(func.avg(TestResult.win_rate)).where(TestResult.user_id == user_id)
        if start_date:
            query = query.where(TestResult.created_at >= start_date)
        if end_date:
            query = query.where(TestResult.created_at < end_date)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def _count_new_agents(self, user_id: UUID, since: datetime) -> int:
        result = await self.db.execute(
            select(func.count(Agent.id)).where(
                Agent.user_id == user_id,
                Agent.created_at >= since,
            )
        )
        return result.scalar_one()

    async def _count_tests_since(self, user_id: UUID, since: datetime) -> int:
        result = await self.db.execute(
            select(func.count(TestResult.id)).where(
                TestResult.user_id == user_id,
                TestResult.created_at >= since,
            )
        )
        return result.scalar_one()
    
    async def _get_best_agent(
        self,
        user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Get the best performing agent based on best_pnl.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dictionary with best agent data, or None if no agents
        """
        result = await self.db.execute(
            select(Agent)
            .where(
                Agent.user_id == user_id,
                Agent.is_archived == False,
                Agent.best_pnl.isnot(None)
            )
            .order_by(desc(Agent.best_pnl))
            .limit(1)
        )
        agent = result.scalar_one_or_none()
        
        if not agent:
            return None
        
        return {
            "id": agent.id,
            "name": agent.name,
        }
    
    async def get_activity(
        self,
        user_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent activity feed for dashboard.
        
        Retrieves activity logs ordered by created_at descending.
        Includes agent name and result PnL when available.
        
        Args:
            user_id: ID of the user
            limit: Maximum number of activity items to return (default: 10, max: 50)
            
        Returns:
            List of activity items with formatted data
        """
        # Enforce maximum limit
        limit = min(limit, 50)
        
        # Query activity logs with related data
        result = await self.db.execute(
            select(ActivityLog)
            .options(
                joinedload(ActivityLog.agent),
                joinedload(ActivityLog.result)
            )
            .where(ActivityLog.user_id == user_id)
            .order_by(desc(ActivityLog.created_at))
            .limit(limit)
        )
        activity_logs = result.scalars().all()
        
        # Format activity items
        activity_items = []
        for log in activity_logs:
            action_url = None
            if log.result_id:
                action_url = f"/dashboard/results/{log.result_id}"
            elif log.session_id:
                action_url = f"/dashboard/arena/backtest/{log.session_id}"
            item = {
                "id": log.id,
                "type": log.activity_type,
                "description": log.description,
                "timestamp": log.created_at,
                "agent_name": log.agent.name if log.agent else None,
                "pnl": float(log.result.total_pnl_pct) if log.result else None,
                "result_id": log.result_id,
                "action_url": action_url,
            }
            activity_items.append(item)
        
        return activity_items
    
    async def get_quick_start_progress(
        self,
        user_id: UUID
    ) -> Dict[str, Any]:
        """
        Get onboarding quick-start progress.
        
        Checks completion status for key onboarding steps:
        1. Create first agent
        2. Run first backtest
        3. Generate first certificate
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dictionary with steps and progress percentage
        """
        # Check if user has created an agent
        has_agent_result = await self.db.execute(
            select(func.count(Agent.id))
            .where(Agent.user_id == user_id)
            .limit(1)
        )
        has_agent = has_agent_result.scalar_one() > 0
        
        # Check if user has run a backtest
        has_backtest_result = await self.db.execute(
            select(func.count(TestResult.id))
            .where(
                TestResult.user_id == user_id,
                TestResult.type == 'backtest'
            )
            .limit(1)
        )
        has_backtest = has_backtest_result.scalar_one() > 0
        
        # Check if user has generated a certificate
        has_certificate_result = await self.db.execute(
            select(func.count(Certificate.id))
            .where(Certificate.user_id == user_id)
            .limit(1)
        )
        has_certificate = has_certificate_result.scalar_one() > 0
        
        # Define steps
        steps = [
            {
                "id": "create_agent",
                "label": "Create Your First Agent",
                "description": "Design an AI trading agent with custom indicators and strategy",
                "is_complete": has_agent,
                "href": "/dashboard/agents/new",
                "cta_text": "Create Agent"
            },
            {
                "id": "run_backtest",
                "label": "Run Your First Backtest",
                "description": "Test your agent on historical data to see how it performs",
                "is_complete": has_backtest,
                "href": "/dashboard/arena/backtest",
                "cta_text": "Start Backtest"
            },
            {
                "id": "generate_certificate",
                "label": "Generate a Certificate",
                "description": "Share your profitable results with a verified certificate",
                "is_complete": has_certificate,
                "href": "/dashboard/results",
                "cta_text": "View Results"
            }
        ]
        
        # Calculate progress percentage
        completed_steps = sum(1 for step in steps if step["is_complete"])
        total_steps = len(steps)
        progress_pct = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
        
        return {
            "steps": steps,
            "progress_pct": round(progress_pct, 2)
        }
