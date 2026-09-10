import pytest
import pytest_asyncio
import json
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.db.init_db import init_database
from app.core.database import AsyncSessionLocal
from app.models.tables import AuditLog

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database():
    await init_database()

@pytest.mark.asyncio
async def test_voice_chat_metadata():
    transport = ASGITransport(app=app)
    payload = {
        "question": "What is the spindle speed limit for HX-204?",
        "machine_id": "HX-204",
        "source": "voice",
        "voice_confidence": 0.92,
        "language": "en-US",
        "reasoning": False
    }

    mock_answer = "Max spindle speed for HX-204 is 12,000 RPM."
    with patch("app.core.model_router.model_router.text_chat", return_value=mock_answer):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/v1/chat", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data

    # Verify audit log recorded voice metadata
    async with AsyncSessionLocal() as session:
        audit_res = await session.execute(
            select(AuditLog)
            .where(AuditLog.action == "chat")
            .order_by(AuditLog.id.desc())
        )
        audit_entry = audit_res.scalars().first()
        assert audit_entry is not None
        assert audit_entry.voice_source == "voice"
        assert audit_entry.voice_confidence == 0.92
        assert audit_entry.voice_language == "en-US"


@pytest.mark.asyncio
async def test_voice_inspect_metadata():
    transport = ASGITransport(app=app)
    payload = {
        "machine_id": "HX-204",
        "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "source": "voice",
        "voice_command": "inspect the spindle casing",
        "voice_confidence": 0.88
    }

    mock_result = {
        "finding": "Spindle casing operating within normal tolerances",
        "confidence": 0.95,
        "defect_location": None,
        "repair_steps": [],
        "needs_escalation": False
    }

    with patch("app.core.model_router.model_router.vision_inspect", return_value=mock_result):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/v1/inspect", json=payload)

    assert res.status_code == 201

    # Verify audit log recorded voice metadata
    async with AsyncSessionLocal() as session:
        audit_res = await session.execute(
            select(AuditLog)
            .where(AuditLog.action == "inspect")
            .order_by(AuditLog.id.desc())
        )
        audit_entry = audit_res.scalars().first()
        assert audit_entry is not None
        assert audit_entry.voice_source == "voice"
        assert audit_entry.voice_confidence == 0.88


@pytest.mark.asyncio
async def test_audio_transcribe_fallback():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("test.wav", b"RIFF dummy audio data", "audio/wav")}
        data = {"language": "en-US", "machine_id": "HX-204"}
        res = await ac.post("/api/v1/audio/transcribe", files=files, data=data)

    assert res.status_code == 200
    res_data = res.json()
    assert "transcript" in res_data
    assert res_data["language"] == "en-US"
    assert "confidence" in res_data
