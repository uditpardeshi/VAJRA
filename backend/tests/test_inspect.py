import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

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
async def test_inspect_endpoint():
    transport = ASGITransport(app=app)
    payload = {
        "machine_id": "HX-204",
        "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "prompt_override": "Check spindle seal and bearing alignment"
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/inspect", json=payload)
    assert response.status_code == 201
    res = response.json()
    assert res["machine_id"] == "HX-204"
    assert "finding" in res
    assert "confidence" in res
    assert isinstance(res["repair_steps"], list)
    assert "needs_escalation" in res
