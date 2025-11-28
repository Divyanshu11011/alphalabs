import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
import uuid

from app import app
from dependencies import get_current_user
from database import get_db
from models import User, UserSettings

# Create a TestClient
client = TestClient(app)

# Mock User Data
MOCK_USER_ID = uuid.uuid4()
MOCK_CLERK_ID = "user_test123"
MOCK_USER = User(
    id=MOCK_USER_ID,
    clerk_id=MOCK_CLERK_ID,
    email="test@example.com",
    first_name="Test",
    last_name="User",
    username="testuser",
    plan="free",
    timezone="UTC",
    is_active=True,
    created_at=datetime.now(),
    updated_at=datetime.now()
)

MOCK_SETTINGS = UserSettings(
    user_id=MOCK_USER_ID,
    theme="dark",
    default_capital=10000.00
)

# Mock Dependency: get_current_user
async def mock_get_current_user():
    return MOCK_USER

# Mock Dependency: get_db
async def mock_get_db():
    mock_session = AsyncMock()
    
    # Mock execute result for settings
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = MOCK_SETTINGS
    mock_session.execute.return_value = mock_result
    
    yield mock_session

# Apply overrides
app.dependency_overrides[get_current_user] = mock_get_current_user
app.dependency_overrides[get_db] = mock_get_db

def test_get_me():
    """Test GET /api/users/me"""
    response = client.get("/api/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["clerk_id"] == MOCK_CLERK_ID

def test_get_my_settings():
    """Test GET /api/users/me/settings"""
    response = client.get("/api/users/me/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["settings"]["theme"] == "dark"
    assert float(data["settings"]["default_capital"]) == 10000.00

def test_update_my_settings():
    """Test PUT /api/users/me/settings"""
    payload = {
        "theme": "light",
        "default_capital": 50000.00
    }
    response = client.put("/api/users/me/settings", json=payload)
    assert response.status_code == 200
    # Note: Since we mocked the DB, the returned value depends on how we mocked the session commit/refresh
    # In this simple mock, we just check if it returns 200. 
    # To verify the update, we'd need a more complex mock or a real DB.
    # But this confirms the endpoint accepts the schema and runs.

def test_sync_user_auth_error():
    """Test POST /api/users/sync without auth"""
    # Remove override for this specific test if possible, or just call without header
    # Since sync_user uses verify_clerk_token directly (not get_current_user), 
    # we need to mock verify_clerk_token or provide a header.
    
    # We haven't overridden verify_clerk_token in the app, so it should fail
    response = client.post("/api/users/sync")
    assert response.status_code == 401
