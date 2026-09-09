import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.websocket_manager import ws_manager
from app.services.escalation_service import (
    acknowledge_escalation, resolve_escalation, get_pending_escalations, get_escalation_history
)
from app.schemas.escalation import (
    EscalationResponse, EscalationListResponse,
    EscalationAcknowledgeRequest, EscalationResolveRequest
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["escalation"])

@router.get("/escalations/pending", response_model=EscalationListResponse)
async def list_pending_escalations(db: AsyncSession = Depends(get_db)):
    escalations = await get_pending_escalations(db)
    return EscalationListResponse(escalations=[EscalationResponse.model_validate(e) for e in escalations])

@router.get("/escalations", response_model=EscalationListResponse)
async def list_escalations(limit: int = 50, db: AsyncSession = Depends(get_db)):
    escalations = await get_escalation_history(db, limit)
    return EscalationListResponse(escalations=[EscalationResponse.model_validate(e) for e in escalations])

@router.post("/escalations/{escalation_id}/acknowledge", response_model=EscalationResponse)
async def acknowledge(
    escalation_id: int,
    request: EscalationAcknowledgeRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        esc = await acknowledge_escalation(db, escalation_id, request.reviewer_id)
        return EscalationResponse.model_validate(esc)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/escalations/{escalation_id}/resolve", response_model=EscalationResponse)
async def resolve(
    escalation_id: int,
    request: EscalationResolveRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        esc = await resolve_escalation(db, escalation_id, request.reviewer_id, request.resolution_note)
        return EscalationResponse.model_validate(esc)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# WebSocket endpoint for real-time alerts
@router.websocket("/ws/escalations")
async def websocket_escalations(
    websocket: WebSocket,
    role: str = Query(..., description="reviewer|admin|engineer"),
    user_id: int = Query(..., description="User ID from auth")
):
    if role not in ("reviewer", "admin", "engineer"):
        await websocket.close(code=4001, reason="Invalid role")
        return

    await ws_manager.connect(websocket, role, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.utcnow().isoformat()}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, role, user_id)
    except Exception as e:
        logger.error(f"WS error: {e}")
        ws_manager.disconnect(websocket, role, user_id)
