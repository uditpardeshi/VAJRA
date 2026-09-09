import pytest
import pytest_asyncio
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database
from app.core.exceptions import ModelUnavailableError

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database():
    await init_database()

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "sovereign-workbench"}

@pytest.mark.asyncio
async def test_list_machines():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/machines")
    assert response.status_code == 200
    data = response.json()
    assert "machines" in data
    machine_ids = [m["machine_id"] for m in data["machines"]]
    assert "HX-204" in machine_ids
    assert "CNC-500" in machine_ids
    assert "LATHE-3" in machine_ids

@pytest.mark.asyncio
async def test_get_machine_detail():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/machines/HX-204")
    assert response.status_code == 200
    machine = response.json()
    assert machine["machine_id"] == "HX-204"
    assert machine["type"] == "CNC"

@pytest.mark.asyncio
async def test_inspect_endpoint_model_unavailable_returns_503():
    transport = ASGITransport(app=app)
    payload = {
        "machine_id": "HX-204",
        "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
    with patch("app.core.model_router.model_router.vision_inspect", side_effect=ModelUnavailableError("connection_failed")):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post("/api/v1/inspect", json=payload)
    assert response.status_code == 503
    data = response.json()["detail"]
    assert data["detail"] == "MODEL_UNAVAILABLE"
    assert data["reason"] == "connection_failed"

@pytest.mark.asyncio
async def test_inspect_low_confidence_creates_escalation_without_ticket():
    transport = ASGITransport(app=app)
    payload = {
        "machine_id": "HX-204",
        "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
    mock_result = {
        "finding": "Unclear wear mark observed on spindle casing",
        "confidence": 0.42,
        "defect_location": {"x": 0.3, "y": 0.4, "w": 0.1, "h": 0.1},
        "repair_steps": ["Inspect housing manually"],
        "needs_escalation": True
    }
    with patch("app.core.model_router.model_router.vision_inspect", return_value=mock_result):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post("/api/v1/inspect", json=payload)
    assert response.status_code == 201
    res = response.json()
    assert res["confidence"] == 0.42
    assert res["needs_escalation"] is True
