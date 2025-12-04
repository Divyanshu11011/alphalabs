import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
from app import app
from api.arena import get_backtest_engine, get_forward_engine
from services.trading.backtest_engine import BacktestEngine
from services.trading.forward_engine import ForwardEngine

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_engine():
    engine = MagicMock(spec=BacktestEngine)
    engine.start_backtest = MagicMock() # Background task, not awaited directly in route
    engine.pause_backtest = AsyncMock()
    engine.resume_backtest = AsyncMock()
    engine.stop_backtest = AsyncMock()
    engine.active_sessions = {}
    return engine

@pytest.fixture
def mock_forward_engine():
    engine = MagicMock(spec=ForwardEngine)
    engine.pause_forward_test = AsyncMock()
    engine.resume_forward_test = AsyncMock()
    engine.active_sessions = {}
    return engine

@pytest.fixture
def override_get_engine(mock_engine):
    app.dependency_overrides[get_backtest_engine] = lambda: mock_engine
    yield
    app.dependency_overrides = {}

@pytest.fixture
def override_get_forward_engine(mock_forward_engine):
    app.dependency_overrides[get_forward_engine] = lambda: mock_forward_engine
    yield
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_start_backtest(client, mock_auth_dependency, mock_db_session, override_get_engine, mock_engine):
    # Mock agent query
    mock_agent = MagicMock()
    mock_agent.id = uuid4()
    mock_agent.name = "Test Agent"
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_agent
    mock_db_session.execute.return_value = mock_result
    
    payload = {
        "agent_id": str(uuid4()),
        "asset": "BTC/USDT",
        "timeframe": "1h",
        "date_preset": "30d",
        "starting_capital": 10000
    }
    
    response = client.post("/api/arena/backtest/start", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "session" in data
    assert data["session"]["status"] == "initializing"
    
    # Verify engine called
    # Note: start_backtest is called via background_tasks, so we might not see it called immediately 
    # unless we use TestClient with a context manager that runs background tasks?
    # FastAPI TestClient runs background tasks synchronously after the response.
    mock_engine.start_backtest.assert_called_once()

@pytest.mark.asyncio
async def test_pause_backtest(client, mock_auth_dependency, override_get_engine, mock_engine):
    session_id = str(uuid4())
    response = client.post(f"/api/arena/backtest/{session_id}/pause")
    
    assert response.status_code == 200
    mock_engine.pause_backtest.assert_called_with(session_id)

@pytest.mark.asyncio
async def test_resume_backtest(client, mock_auth_dependency, override_get_engine, mock_engine):
    session_id = str(uuid4())
    response = client.post(f"/api/arena/backtest/{session_id}/resume")
    
    assert response.status_code == 200
    mock_engine.resume_backtest.assert_called_with(session_id)

@pytest.mark.asyncio
async def test_stop_backtest(client, mock_auth_dependency, override_get_engine, mock_engine):
    session_id = str(uuid4())
    response = client.post(f"/api/arena/backtest/{session_id}/stop", json={"close_position": True})
    
    assert response.status_code == 200
    mock_engine.stop_backtest.assert_called_with(session_id)

@pytest.mark.asyncio
async def test_pause_forward_session(client, mock_auth_dependency, mock_db_session, override_get_forward_engine, mock_forward_engine):
    session_id = uuid4()
    test_session = MagicMock()
    test_session.id = session_id
    test_session.user_id = mock_auth_dependency.id
    test_session.type = "forward"
    result = AsyncMock()
    result.scalar_one_or_none.return_value = test_session
    mock_db_session.execute.return_value = result

    response = client.post(f"/api/arena/forward/{session_id}/pause")

    assert response.status_code == 200
    mock_forward_engine.pause_forward_test.assert_awaited_once_with(str(session_id))

@pytest.mark.asyncio
async def test_resume_forward_session(client, mock_auth_dependency, mock_db_session, override_get_forward_engine, mock_forward_engine):
    session_id = uuid4()
    test_session = MagicMock()
    test_session.id = session_id
    test_session.user_id = mock_auth_dependency.id
    test_session.type = "forward"
    result = AsyncMock()
    result.scalar_one_or_none.return_value = test_session
    mock_db_session.execute.return_value = result

    response = client.post(f"/api/arena/forward/{session_id}/resume")

    assert response.status_code == 200
    mock_forward_engine.resume_forward_test.assert_awaited_once_with(str(session_id))
