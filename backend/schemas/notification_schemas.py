"""
Notification Schemas.

Purpose:
    Defines Pydantic models for notification retrieval and management.
    Validates notification responses and formats notification list data.

Data Flow:
    - Incoming: Query parameters for filtering notifications.
    - Processing: Validates constraints and formats response data.
    - Outgoing: Structured data for the Notification Service, and JSON responses for the API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class NotificationItem(BaseModel):
    id: UUID
    type: str = Field(..., description="Presentation type such as success/info/warning")
    category: str = Field(..., description="Domain category for the notification")
    title: str
    message: str
    action_url: Optional[str] = None
    session_id: Optional[UUID] = None
    result_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    notifications: List[NotificationItem]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    count: int = Field(..., description="Number of unread notifications")
