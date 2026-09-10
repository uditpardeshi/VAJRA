from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db
from app.services.ticket_service import (
    approve_ticket, reject_ticket, list_pending_review_tickets, convert_escalation_without_ticket
)
from app.schemas.ticket import TicketApproveRequest, TicketActionRequest, TicketResponse

router = APIRouter(prefix="/api/v1", tags=["tickets"])

@router.get("/tickets/pending-review", response_model=List[TicketResponse])
async def list_pending_review(db: AsyncSession = Depends(get_db)):
    """Reviewer: all tickets waiting for approval."""
    tickets = await list_pending_review_tickets(db)
    return [TicketResponse.model_validate(t) for t in tickets]

@router.post("/tickets/{ticket_id}/approve", response_model=TicketResponse)
async def approve(
    ticket_id: int,
    request: TicketApproveRequest,
    db: AsyncSession = Depends(get_db)
):
    """Approve pending ticket → open. Optionally assign to engineer (assigned_to)."""
    try:
        ticket = await approve_ticket(
            db, ticket_id, request.reviewer_id,
            assigned_to=request.assigned_to, note=request.note
        )
        return TicketResponse.model_validate(ticket)
    except ValueError as e:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/tickets/{ticket_id}/reject", response_model=TicketResponse)
async def reject(
    ticket_id: int,
    request: TicketActionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reject pending ticket. Requires note."""
    try:
        if not request.note:
            raise ValueError("Rejection requires a note explaining why")
        ticket = await reject_ticket(db, ticket_id, request.reviewer_id, request.note)
        return TicketResponse.model_validate(ticket)
    except ValueError as e:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/escalations/{escalation_id}/convert-to-ticket", response_model=TicketResponse)
async def convert_escalation(
    escalation_id: int,
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """For <0.5 confidence escalations: convert to ticket (pending_review)."""
    try:
        ticket = await convert_escalation_without_ticket(
            db, escalation_id,
            reviewer_id=request["reviewer_id"],
            title=request["title"],
            description=request.get("description", ""),
            machine_id=request["machine_id"],
            inspection_id=request.get("inspection_id")
        )
        return TicketResponse.model_validate(ticket)
    except (ValueError, KeyError) as e:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))
