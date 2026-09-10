import json
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.tables import Ticket, TicketStatus, AuditLog, Escalation, EscalationStatus
from app.core.websocket_manager import ws_manager
from app.schemas.escalation import WSMessage
import asyncio

async def approve_ticket(
    db: AsyncSession,
    ticket_id: int,
    reviewer_id: int,
    assigned_to: Optional[int] = None,
    note: Optional[str] = None
) -> Ticket:
    """Approve pending_review ticket → status=open."""
    ticket = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = ticket.scalar_one_or_none()
    if not ticket:
        raise ValueError(f"Ticket {ticket_id} not found")

    if ticket.status != TicketStatus.PENDING_REVIEW:
        raise ValueError(f"Ticket {ticket_id} is not pending_review (current: {ticket.status})")

    ticket.status = TicketStatus.OPEN
    if assigned_to:
        ticket.assigned_to = assigned_to

    # Audit
    audit = AuditLog(
        user_id=reviewer_id,
        action="ticket_approved",
        resource_type="ticket",
        resource_id=ticket.id,
        details=json.dumps({"note": note, "assigned_to": assigned_to})
    )
    db.add(audit)
    await db.commit()
    await db.refresh(ticket)

    # Notify via WS (engineers assigned)
    if assigned_to:
        ws_msg = WSMessage(type="ticket_approved", payload={
            "ticket_id": ticket.id,
            "assigned_to": assigned_to,
            "title": ticket.title
        })
        asyncio.create_task(ws_manager.send_to_user(assigned_to, ws_msg))

    return ticket


async def reject_ticket(
    db: AsyncSession,
    ticket_id: int,
    reviewer_id: int,
    note: str
) -> Ticket:
    """Reject pending_review ticket → status=rejected. No work performed."""
    ticket = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = ticket.scalar_one_or_none()
    if not ticket:
        raise ValueError(f"Ticket {ticket_id} not found")

    if ticket.status != TicketStatus.PENDING_REVIEW:
        raise ValueError(f"Ticket {ticket_id} is not pending_review (current: {ticket.status})")

    if not note:
        raise ValueError("Rejection requires a note explaining why")

    ticket.status = TicketStatus.REJECTED
    ticket.resolved_at = datetime.utcnow()

    # Audit
    audit = AuditLog(
        user_id=reviewer_id,
        action="ticket_rejected",
        resource_type="ticket",
        resource_id=ticket.id,
        details=json.dumps({"note": note})
    )
    db.add(audit)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def list_pending_review_tickets(db: AsyncSession) -> List[Ticket]:
    """For reviewer dashboard: all tickets awaiting approval."""
    result = await db.execute(
        select(Ticket)
        .where(Ticket.status == TicketStatus.PENDING_REVIEW)
        .order_by(Ticket.created_at.asc())
    )
    return list(result.scalars().all())


async def convert_escalation_without_ticket(
    db: AsyncSession,
    escalation_id: int,
    reviewer_id: int,
    title: str,
    description: str,
    machine_id: int,
    inspection_id: Optional[int] = None
) -> Ticket:
    """
    For <0.5 confidence escalations (no ticket exists yet):
    Reviewer decides to convert → creates a new pending_review ticket from escalation.
    """
    escalation = await db.execute(select(Escalation).where(Escalation.id == escalation_id))
    escalation = escalation.scalar_one_or_none()
    if not escalation:
        raise ValueError(f"Escalation {escalation_id} not found")

    ticket = Ticket(
        inspection_id=inspection_id or 0,
        machine_id=machine_id,
        title=title,
        description=description,
        status=TicketStatus.PENDING_REVIEW,
        priority=2,
    )
    db.add(ticket)
    await db.flush()

    escalation.ticket_id = ticket.id
    escalation.status = EscalationStatus.ACKNOWLEDGED
    escalation.reviewer_id = reviewer_id

    # Audit
    audit = AuditLog(
        user_id=reviewer_id,
        action="escalation_converted_to_ticket",
        resource_type="ticket",
        resource_id=ticket.id,
        details=json.dumps({"escalation_id": escalation_id})
    )
    db.add(audit)
    await db.commit()
    await db.refresh(ticket)
    return ticket
