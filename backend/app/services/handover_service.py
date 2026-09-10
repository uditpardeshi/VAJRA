import json
import uuid
import qrcode
import io
import base64
from datetime import datetime, date, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models.tables import (
    ShiftHandover, Ticket, TicketStatus, Escalation, EscalationStatus, 
    Machine, Inspection, User, AuditLog
)
from app.schemas.handover import (
    ShiftHandoverCreate, ShiftHandoverResponse, HandoverPayload,
    HandoverTicket, HandoverEscalation, HandoverMachineWatch,
    HandoverPartNeeded, HandoverSafetyIncident, ShiftHandoverViewResponse,
    ShiftType
)
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class HandoverService:
    
    @staticmethod
    async def generate_handover(
        db: AsyncSession,
        request: ShiftHandoverCreate,
        user_id: int
    ) -> ShiftHandoverResponse:
        """Generate shift handover report with all current data."""
        
        shift_date = request.shift_date or date.today()
        shift_type = request.shift_type
        
        # Determine shift time windows
        shift_start, shift_end = HandoverService._get_shift_window(shift_date, shift_type)
        
        # 1. Open Tickets (created during this shift or still open)
        tickets_query = select(Ticket).options(
            selectinload(Ticket.machine),
            selectinload(Ticket.inspection)
        ).where(
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.PENDING_REVIEW])
        )
        tickets_result = await db.execute(tickets_query)
        tickets = tickets_result.scalars().all()
        
        open_tickets = [
            HandoverTicket(
                id=t.id,
                title=t.title,
                machine_id=t.machine.machine_id if t.machine else "UNKNOWN",
                machine_name=t.machine.name if t.machine else "UNKNOWN",
                status=t.status.value if hasattr(t.status, "value") else str(t.status),
                priority=t.priority,
                created_at=t.created_at,
                assigned_to=str(t.assigned_to) if t.assigned_to is not None else None
            ) for t in tickets
        ]
        
        # 2. Pending Escalations
        escalations_query = select(Escalation).options(
            selectinload(Escalation.ticket).selectinload(Ticket.machine)
        ).where(Escalation.status == EscalationStatus.PENDING)
        escalations_result = await db.execute(escalations_query)
        escalations = escalations_result.scalars().all()
        
        pending_escalations = [
            HandoverEscalation(
                id=e.id,
                ticket_id=e.ticket_id,
                machine_id=e.ticket.machine.machine_id if e.ticket and e.ticket.machine else "UNKNOWN",
                reason=e.reason or "manual_review",
                status=e.status.value if hasattr(e.status, "value") else str(e.status),
                confidence=0.0,
                created_at=e.created_at
            ) for e in escalations
        ]
        
        # 3. Machines to Watch (recent inspections with issues)
        recent_inspections = await db.execute(
            select(Inspection)
            .options(selectinload(Inspection.machine))
            .where(
                and_(
                    Inspection.created_at >= datetime.combine(shift_date, datetime.min.time()),
                    Inspection.needs_escalation == 1
                )
            )
            .order_by(Inspection.created_at.desc())
            .limit(20)
        )
        recent_inspections = recent_inspections.scalars().all()
        
        machines_to_watch = []
        seen_machines = set()
        for insp in recent_inspections:
            if insp.machine and insp.machine.machine_id not in seen_machines:
                seen_machines.add(insp.machine.machine_id)
                finding_str = insp.finding or ""
                machines_to_watch.append(HandoverMachineWatch(
                    machine_id=insp.machine.machine_id,
                    machine_name=insp.machine.name,
                    last_inspection=insp.created_at,
                    last_finding=finding_str[:100] + "..." if len(finding_str) > 100 else finding_str,
                    confidence=insp.confidence,
                    health_score=max(0, 100 - int(insp.confidence * 30))
                ))
        
        # 3b. Also include machines with open tickets
        for ticket in tickets:
            if ticket.machine and ticket.machine.machine_id not in seen_machines:
                seen_machines.add(ticket.machine.machine_id)
                latest_insp = await db.execute(
                    select(Inspection)
                    .where(Inspection.machine_id == ticket.machine_id)
                    .order_by(Inspection.created_at.desc())
                    .limit(1)
                )
                latest = latest_insp.scalar_one_or_none()
                finding_str = latest.finding if latest and latest.finding else "Open ticket"
                machines_to_watch.append(HandoverMachineWatch(
                    machine_id=ticket.machine.machine_id,
                    machine_name=ticket.machine.name,
                    last_inspection=latest.created_at if latest else datetime.utcnow(),
                    last_finding=finding_str[:100] if len(finding_str) > 100 else finding_str,
                    confidence=latest.confidence if latest else 0.5,
                    health_score=80
                ))
        
        # 4. Parts Needed (empty for now)
        parts_needed = []
        
        # 5. Safety Incidents (escalations with safety_critical reason)
        safety_incidents = [
            HandoverSafetyIncident(
                id=e.id,
                type="AI Escalation",
                machine_id=e.ticket.machine.machine_id if e.ticket and e.ticket.machine else "UNKNOWN",
                description=e.ticket.description[:200] if e.ticket and e.ticket.description else "Safety critical issue",
                severity="HIGH",
                reported_at=e.created_at,
                status=e.status.value if hasattr(e.status, "value") else str(e.status)
            ) for e in escalations if e.reason == "safety_critical"
        ]
        
        # Get generator user
        generator = await db.execute(select(User).where(User.id == user_id))
        generator_user = generator.scalar_one_or_none()
        generator_name = generator_user.username if generator_user else f"User_{user_id}"
        
        # Build payload
        payload = HandoverPayload(
            shift_type=request.shift_type,
            shift_date=shift_date,
            generated_by=generator_name,
            generated_at=datetime.utcnow(),
            open_tickets=open_tickets,
            pending_escalations=pending_escalations,
            machines_to_watch=machines_to_watch[:10],
            parts_needed=parts_needed,
            safety_incidents=safety_incidents,
            summary={
                "tickets_open": len(open_tickets),
                "escalations_pending": len(pending_escalations),
                "machines_watching": len(machines_to_watch),
                "parts_needed": len(parts_needed),
                "safety_incidents": len(safety_incidents)
            }
        )
        
        # Generate QR code
        qr_code = f"handover_{uuid.uuid4().hex[:12]}"
        qr_url = f"{settings.FRONTEND_ORIGIN}/handover/{qr_code}"
        
        # Generate QR code image
        qr_img = qrcode.make(qr_url)
        buffered = io.BytesIO()
        qr_img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        qr_data_url = f"data:image/png;base64,{qr_base64}"
        
        # Create handover record
        handover = ShiftHandover(
            shift_type=request.shift_type.value if hasattr(request.shift_type, "value") else str(request.shift_type),
            shift_date=shift_date,
            generated_by=user_id,
            payload_json=payload.model_dump_json(),
            qr_code=qr_code,
            generated_at=datetime.utcnow()
        )
        
        db.add(handover)
        
        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="handover_generated",
            resource_type="shift_handover",
            resource_id=None,
            details=json.dumps({
                "shift_type": request.shift_type.value if hasattr(request.shift_type, "value") else str(request.shift_type),
                "shift_date": shift_date.isoformat(),
                "tickets_count": len(open_tickets),
                "escalations_count": len(pending_escalations),
                "qr_code": qr_code
            })
        )
        db.add(audit)
        
        await db.commit()
        await db.refresh(handover)
        
        return ShiftHandoverResponse(
            id=handover.id,
            shift_type=request.shift_type,
            shift_date=shift_date,
            generated_by=user_id,
            generated_by_name=generator_name,
            generated_at=handover.generated_at,
            qr_code=qr_code,
            qr_code_url=qr_data_url,
            payload=payload,
            viewed_by=None,
            viewed_at=None,
            created_at=handover.created_at
        )
    
    @staticmethod
    def _get_shift_window(shift_date: date, shift_type: ShiftType) -> tuple:
        """Get shift start/end datetime for a given date and shift type."""
        if shift_type == ShiftType.MORNING:
            return (
                datetime.combine(shift_date, datetime.min.time().replace(hour=6)),
                datetime.combine(shift_date, datetime.min.time().replace(hour=14))
            )
        elif shift_type == ShiftType.EVENING:
            return (
                datetime.combine(shift_date, datetime.min.time().replace(hour=14)),
                datetime.combine(shift_date, datetime.min.time().replace(hour=22))
            )
        else:  # NIGHT
            return (
                datetime.combine(shift_date, datetime.min.time().replace(hour=22)),
                datetime.combine(shift_date + timedelta(days=1), datetime.min.time().replace(hour=6))
            )
    
    @staticmethod
    async def get_handover_by_qr(
        db: AsyncSession,
        qr_code: str,
        viewer_id: int
    ) -> ShiftHandoverViewResponse:
        """Get handover by QR code (when scanning)."""
        result = await db.execute(
            select(ShiftHandover).where(ShiftHandover.qr_code == qr_code)
        )
        handover = result.scalar_one_or_none()
        
        if not handover:
            raise ValueError("Invalid QR code")
        
        # Parse payload
        payload = HandoverPayload.model_validate_json(handover.payload_json)
        
        # Check if first view
        is_first_view = handover.viewed_by is None
        
        # Update view tracking
        if is_first_view:
            handover.viewed_by = viewer_id
            handover.viewed_at = datetime.utcnow()
            await db.commit()
        
        # Get generator info
        generator = await db.execute(select(User).where(User.id == handover.generated_by))
        generator_user = generator.scalar_one_or_none()
        generator_name = generator_user.username if generator_user else f"User_{handover.generated_by}"
        
        # Get viewer info
        viewer = await db.execute(select(User).where(User.id == viewer_id))
        viewer_user = viewer.scalar_one_or_none()
        viewer_name = viewer_user.username if viewer_user else f"User_{viewer_id}"
        
        # Generate QR code data URL
        qr_url = f"{settings.FRONTEND_ORIGIN}/handover/{handover.qr_code}"
        qr_img = qrcode.make(qr_url)
        buffered = io.BytesIO()
        qr_img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        qr_data_url = f"data:image/png;base64,{qr_base64}"
        
        handover_response = ShiftHandoverResponse(
            id=handover.id,
            shift_type=ShiftType(handover.shift_type),
            shift_date=handover.shift_date,
            generated_by=handover.generated_by,
            generated_by_name=generator_name,
            generated_at=handover.generated_at,
            qr_code=handover.qr_code,
            qr_code_url=qr_data_url,
            payload=payload,
            viewed_by=handover.viewed_by,
            viewed_at=handover.viewed_at,
            created_at=handover.created_at
        )
        
        return ShiftHandoverViewResponse(
            handover=handover_response,
            viewer_name=viewer_name,
            viewed_at=handover.viewed_at or datetime.utcnow(),
            is_first_view=is_first_view
        )
    
    @staticmethod
    async def list_handovers(
        db: AsyncSession,
        limit: int = 20,
        shift_type: Optional[str] = None
    ) -> List[ShiftHandoverResponse]:
        """List recent handovers for admin/manager view."""
        query = select(ShiftHandover).order_by(ShiftHandover.generated_at.desc()).limit(limit)
        if shift_type:
            query = query.where(ShiftHandover.shift_type == shift_type)
        
        result = await db.execute(query)
        handovers = result.scalars().all()
        
        results = []
        for h in handovers:
            payload = HandoverPayload.model_validate_json(h.payload_json)
            generator = await db.execute(select(User).where(User.id == h.generated_by))
            gen_user = generator.scalar_one_or_none()
            generator_name = gen_user.username if gen_user else f"User_{h.generated_by}"
            
            qr_url = f"{settings.FRONTEND_ORIGIN}/handover/{h.qr_code}"
            qr_img = qrcode.make(qr_url)
            buffered = io.BytesIO()
            qr_img.save(buffered, format="PNG")
            qr_base64 = base64.b64encode(buffered.getvalue()).decode()
            qr_data_url = f"data:image/png;base64,{qr_base64}"
            
            results.append(ShiftHandoverResponse(
                id=h.id,
                shift_type=ShiftType(h.shift_type),
                shift_date=h.shift_date,
                generated_by=h.generated_by,
                generated_by_name=generator_name,
                generated_at=h.generated_at,
                qr_code=h.qr_code,
                qr_code_url=qr_data_url,
                payload=payload,
                viewed_by=h.viewed_by,
                viewed_at=h.viewed_at,
                created_at=h.created_at
            ))
        return results
