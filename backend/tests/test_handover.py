import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database():
    await init_database()

@pytest.mark.asyncio
async def test_shift_handover_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Generate shift handover
        payload = {
            "shift_type": "night",
            "shift_date": "2026-09-10",
            "user_id": 1
        }
        res = await client.post("/api/v1/handover/generate", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()
        
        assert "id" in data
        assert data["shift_type"] == "night"
        assert data["shift_date"] == "2026-09-10"
        assert "qr_code" in data
        assert data["qr_code"].startswith("handover_")
        assert "qr_code_url" in data
        assert data["qr_code_url"].startswith("data:image/png;base64,")
        assert "payload" in data
        assert "summary" in data["payload"]
        
        qr_code = data["qr_code"]
        
        # 2. View handover via QR code (First scan)
        res_view = await client.get(f"/api/v1/handover/{qr_code}?user_id=2")
        assert res_view.status_code == 200, res_view.text
        view_data = res_view.json()
        
        assert view_data["is_first_view"] is True
        assert view_data["handover"]["qr_code"] == qr_code
        assert view_data["handover"]["viewed_by"] == 2
        assert view_data["handover"]["viewed_at"] is not None
        
        # 3. View handover again (Second scan)
        res_view2 = await client.get(f"/api/v1/handover/{qr_code}?user_id=2")
        assert res_view2.status_code == 200
        view_data2 = res_view2.json()
        assert view_data2["is_first_view"] is False

        # 4. List handovers
        res_list = await client.get("/api/v1/handovers")
        assert res_list.status_code == 200
        handovers = res_list.json()
        assert len(handovers) >= 1
        assert any(h["qr_code"] == qr_code for h in handovers)

        # 5. Invalid QR code returns 404
        res_invalid = await client.get("/api/v1/handover/invalid_qr_code_xyz")
        assert res_invalid.status_code == 404
