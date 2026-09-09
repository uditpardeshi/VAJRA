import pytest
import pytest_asyncio
import json
import asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
import jwt

from app.main import app
from app.core.security import create_ws_token, decode_ws_token, SECRET_KEY, ALGORITHM
from app.core.websocket_manager import ws_manager

@pytest.mark.asyncio
async def test_jwt_token_security():
    # 1. Valid token
    token = create_ws_token(user_id=2, role="reviewer")
    payload = decode_ws_token(token)
    assert payload["user_id"] == 2
    assert payload["role"] == "reviewer"

    # 2. Expired token
    expired_payload = {
        "user_id": 2,
        "role": "reviewer",
        "exp": datetime.now(timezone.utc) - timedelta(seconds=10),
        "type": "ws"
    }
    expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
    with pytest.raises(ValueError, match="Token expired"):
        decode_ws_token(expired_token)

    # 3. Invalid token type
    invalid_type_payload = {
        "user_id": 2,
        "role": "reviewer",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "type": "access"
    }
    invalid_token = jwt.encode(invalid_type_payload, SECRET_KEY, algorithm=ALGORITHM)
    with pytest.raises(ValueError, match="Invalid token type"):
        decode_ws_token(invalid_token)


@pytest.mark.asyncio
async def test_auth_ws_token_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Valid request
        res = await ac.post("/api/v1/auth/ws-token", json={"user_id": 2, "role": "reviewer"})
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["expires_in"] == 300

        # Invalid role
        res = await ac.post("/api/v1/auth/ws-token", json={"user_id": 2, "role": "superman"})
        assert res.status_code == 400
