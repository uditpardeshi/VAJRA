import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database():
    await init_database()

@pytest.mark.asyncio
async def test_analytics_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/metrics")
        assert res.status_code == 200
        data = res.json()
        assert "total_inspections" in data
        assert data["total_inspections"] >= 5
        assert "open_tickets" in data
        assert "pending_escalations" in data
        assert "avg_confidence" in data
        assert "machines_online" in data
        assert data["machines_online"] == 3

@pytest.mark.asyncio
async def test_analytics_shift_activity():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/shift-activity")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "machine" in data[0]
        assert "result" in data[0]

@pytest.mark.asyncio
async def test_analytics_audit_trail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/audit-trail")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "action" in data[0]
        assert "status" in data[0]

@pytest.mark.asyncio
async def test_analytics_system_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/system-metrics")
        assert res.status_code == 200
        data = res.json()
        assert data["db_status"] == "ONLINE"
        assert data["machines_registered"] == 3

@pytest.mark.asyncio
async def test_chat_session_memory_and_reasoning_modes():
    session_id = f"test_session_mem_{int(pytest.approx(1000).expected)}"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. First turn: User states machine parameter
        req1 = {
            "question": "What is the acceptable spindle runout for HX-204?",
            "machine_id": "HX-204",
            "session_id": session_id,
            "reasoning": True
        }
        res1 = await ac.post("/api/v1/chat", json=req1)
        assert res1.status_code == 200
        data1 = res1.json()
        assert "answer" in data1
        assert len(data1["answer"]) > 10

        # 2. Second turn: Direct mode (reasoning = False)
        req2 = {
            "question": "Give me just the exact runout number and oil type for this machine.",
            "machine_id": "HX-204",
            "session_id": session_id,
            "reasoning": False
        }
        res2 = await ac.post("/api/v1/chat", json=req2)
        assert res2.status_code == 200
        data2 = res2.json()
        assert "answer" in data2

        # 3. Retrieve conversation history for this specific session
        res_history = await ac.get(f"/api/v1/chat/sessions/{session_id}/messages")
        assert res_history.status_code == 200
        history = res_history.json()
        assert len(history) >= 4  # 2 user msgs + 2 assistant msgs
        roles = [m["role"] for m in history]
        assert "user" in roles
        assert "assistant" in roles

        # 4. Cleanup session messages
        res_del = await ac.delete(f"/api/v1/chat/sessions/{session_id}/messages")
        assert res_del.status_code == 204
