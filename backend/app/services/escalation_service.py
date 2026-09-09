import json
import asyncio
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.tables import Escalation, EscalationStatus, Ticket, TicketStatus, AuditLog
from app.core.websocket_manager import ws_manager
from app.schemas.escalation import WSMessage

async def create_escalation(
    db: AsyncSession,
    ticket_id: Optional[int],
    reason: str,  # "low_confidence" | "safety_critical" | "manual_review"
    inspection_confidence: float,
    inspection_finding: str,
    machine_id: str
) -> Escalation:
    """Create escalation record + broadcast WebSocket alert to reviewers/admins."""
    escalation = Escalation(
        ticket_id=ticket_id,
        reason=reason,
        status=EscalationStatus.PENDING,
    )
    db.add(escalation)
    await db.flush()

    priority = 2
    if ticket_id is not None:
        ticket_result = await db.execute(
            select(Ticket).options(selectinload(Ticket.machine)).where(Ticket.id == ticket_id)
        )
        ticket = ticket_result.scalar_one_or_none()
        if ticket:
            priority = ticket.priority

    # Broadcast to reviewers & admins
    ws_msg = WSMessage(
        type="escalation_created",
        payload={
            "escalation_id": escalation.id,
            "ticket_id": ticket_id,
            "machine_id": machine_id,
            "reason": reason,
            "confidence": inspection_confidence,
            "finding": inspection_finding,
            "priority": priority,
        }
    )
    asyncio.create_task(ws_manager.broadcast_to_role("reviewer", ws_msg))
    asyncio.create_task(ws_manager.broadcast_to_role("admin", ws_msg))

    # Audit
    audit = AuditLog(
        user_id=None,  # system
        action="escalate",
        resource_type="escalation",
        resource_id=escalation.id,
        details=json.dumps({
            "ticket_id": ticket_id,
            "reason": reason,
            "confidence": inspection_confidence
        })
    )
    db.add(audit)
    await db.flush()
    return escalation

async def acknowledge_escalation(
    db: AsyncSession,
    escalation_id: int,
    reviewer_id: int
) -> Escalation:
    escalation_result = await db.execute(
        select(Escalation).where(Escalation.id == escalation_id)
    )
    escalation = escalation_result.scalar_one_or_none()
    if not escalation:
        raise ValueError("Escalation not found")
    
    escalation.status = EscalationStatus.ACKNOWLEDGED
    escalation.reviewer_id = reviewer_id
    await db.commit()
    await db.refresh(escalation)

    # Notify
    ws_msg = WSMessage(type="escalation_acknowledged", payload={"escalation_id": escalation_id, "reviewer_id": reviewer_id})
    asyncio.create_task(ws_manager.broadcast_all(ws_msg))

    return escalation

async def resolve_escalation(
    db: AsyncSession,
    escalation_id: int,
    reviewer_id: int,
    resolution_note: str
) -> Escalation:
    escalation_result = await db.execute(
        select(Escalation).where(Escalation.id == escalation_id)
    )
    escalation = escalation_result.scalar_one_or_none()
    if not escalation:
        raise ValueError("Escalation not found")
    
    escalation.status = EscalationStatus.RESOLVED
    escalation.reviewer_id = reviewer_id
    escalation.resolved_at = datetime.utcnow()
    
    # Also close the ticket
    ticket_result = await db.execute(select(Ticket).where(Ticket.id == escalation.ticket_id))
    ticket = ticket_result.scalar_one_or_none()
    if ticket:
        ticket.status = TicketStatus.RESOLVED
        ticket.resolved_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(escalation)

    ws_msg = WSMessage(type="escalation_resolved", payload={
        "escalation_id": escalation_id,
        "reviewer_id": reviewer_id,
        "note": resolution_note
    })
    asyncio.create_task(ws_manager.broadcast_all(ws_msg))

    return escalation

async def get_pending_escalations(db: AsyncSession) -> List[Escalation]:
    result = await db.execute(
        select(Escalation)
        .where(Escalation.status == EscalationStatus.PENDING)
        .order_by(Escalation.created_at.desc())
    )
    return list(result.scalars().all())

async def get_escalation_history(db: AsyncSession, limit: int = 50) -> List[Escalation]:
    result = await db.execute(
        select(Escalation)
        .order_by(Escalation.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
