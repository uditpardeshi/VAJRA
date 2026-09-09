import pytest
import pytest_asyncio
import json
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database():
    await init_database()

@pytest.mark.asyncio
async def test_pending_escalations_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/escalations/pending")
    assert response.status_code == 200
    data = response.json()
    assert "escalations" in data
    assert isinstance(data["escalations"], list)

@pytest.mark.asyncio
async def test_escalations_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/escalations?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "escalations" in data
    assert isinstance(data["escalations"], list)
