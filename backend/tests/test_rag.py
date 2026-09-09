import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database
from app.db.ingest_manuals import main as ingest_main

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database_and_rag():
    await init_database()
    ingest_main()

@pytest.mark.asyncio
async def test_chat_endpoint_with_machine_id():
    transport = ASGITransport(app=app)
    payload = {
        "question": "What is the acceptable spindle runout for HX-204?",
        "machine_id": "HX-204",
        "top_k": 3
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "answer" in res
    assert "citations" in res
    assert isinstance(res["citations"], list)
    assert "confidence" in res
    assert 0.0 <= res["confidence"] <= 1.0

@pytest.mark.asyncio
async def test_chat_endpoint_without_machine_id():
    transport = ASGITransport(app=app)
    payload = {
        "question": "What oil type is recommended for machinery?",
        "top_k": 5
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "answer" in res
    assert "citations" in res
