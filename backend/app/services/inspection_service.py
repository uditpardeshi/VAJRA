import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tables import Inspection, Machine, AuditLog, Ticket, TicketStatus, ModelStatus
from app.core.model_router import model_router
from app.core.exceptions import ModelUnavailableError
from app.schemas.inspection import InspectRequest, InspectResponse, DefectLocation
from app.services.escalation_service import create_escalation

async def create_inspection(
    db: AsyncSession,
    request: InspectRequest,
    user_id: int = 1
) -> InspectResponse:
    # 1. Fetch machine + specs
    machine_result = await db.execute(
        select(Machine).where(Machine.machine_id == request.machine_id)
    )
    machine = machine_result.scalar_one_or_none()
    if not machine:
        raise ValueError(f"Machine {request.machine_id} not found")

    specs = json.loads(machine.specs_json) if machine.specs_json else {}

    # 2. Build prompt
    system_prompt = f"""You are an expert industrial maintenance engineer analyzing equipment photos.
Machine: {machine.machine_id}
Key Specs: {json.dumps(specs, indent=2)}

Analyze the image for: wear, misalignment, leaks, cracks, abnormal vibration signs, safety hazards.
Return ONLY valid JSON with these exact keys:
- "finding": string (concise technical description)
- "confidence": float 0.0-1.0
- "defect_location": object with x,y,w,h normalized 0-1 (or null)
- "repair_steps": array of strings (ordered, actionable)
- "needs_escalation": boolean (true if safety-critical or confidence < 0.7)
"""
    if request.prompt_override:
        system_prompt += f"\nAdditional focus: {request.prompt_override}"

    # 3. Call vision model via router
    try:
        ollama_result = await model_router.vision_inspect(
            image_base64=request.image_base64,
            system_prompt=system_prompt
        )
    except ModelUnavailableError:
        raise
    except Exception as e:
        raise ModelUnavailableError("unexpected_error", e)

    # Normalize defaults
    ollama_result.setdefault("finding", "No finding returned")
    ollama_result.setdefault("confidence", 0.5)
    ollama_result.setdefault("defect_location", None)
    ollama_result.setdefault("repair_steps", [])
    ollama_result.setdefault("needs_escalation", ollama_result["confidence"] < 0.7)

    # 4. Determine decision bands & escalation rules
    confidence = ollama_result["confidence"]
    finding = ollama_result["finding"]
    finding_clean = finding.strip().lower()

    is_normal = (
        finding_clean in ("normal", "no issue", "ok")
        or "operating within standard tolerances" in finding_clean
    )
    is_safety = bool(ollama_result.get("needs_escalation")) and (
        ollama_result.get("reason") == "safety_critical"
        or any(k in finding_clean for k in ("safety", "critical", "hazard", "leak", "crack"))
    )

    needs_escalation_flag = False
    ticket = None

    if is_normal:
        needs_escalation_flag = False
    elif confidence < 0.5 and not is_safety:
        needs_escalation_flag = True
    elif confidence >= 0.5 or is_safety:
        if is_safety:
            needs_escalation_flag = True

    # 5. Persist inspection
    defect_loc = ollama_result.get("defect_location")
    inspection = Inspection(
        machine_id=machine.id,
        finding=finding,
        confidence=confidence,
        defect_location=json.dumps(defect_loc) if defect_loc else None,
        repair_steps=json.dumps(ollama_result["repair_steps"]),
        needs_escalation=1 if needs_escalation_flag else 0,
        model_status=ModelStatus.SUCCESS,
    )
    db.add(inspection)
    await db.flush()

    # 6. Ticket & Escalation persistence
    if not is_normal:
        if confidence < 0.5 and not is_safety:
            # Low confidence: escalation created WITHOUT ticket
            await create_escalation(
                db=db,
                ticket_id=None,
                reason="low_confidence",
                inspection_confidence=confidence,
                inspection_finding=finding,
                machine_id=machine.machine_id
            )
        else:
            # Ticket created: ALWAYS starts as PENDING_REVIEW
            ticket = Ticket(
                inspection_id=inspection.id,
                machine_id=machine.id,
                title=f"Inspection finding: {machine.machine_id}",
                description=finding,
                status=TicketStatus.PENDING_REVIEW,
                priority=1 if is_safety else 2,
            )
            db.add(ticket)
            await db.flush()

            if is_safety:
                await create_escalation(
                    db=db,
                    ticket_id=ticket.id,
                    reason="safety_critical",
                    inspection_confidence=confidence,
                    inspection_finding=finding,
                    machine_id=machine.machine_id
                )

    # 7. Audit log
    audit = AuditLog(
        user_id=user_id,
        action="inspect",
        resource_type="inspection",
        resource_id=inspection.id,
        details=json.dumps({
            "machine_id": request.machine_id,
            "confidence": confidence,
            "needs_escalation": needs_escalation_flag,
            "ticket_created": ticket is not None,
            "source": request.source,
            "voice_command": request.voice_command,
            "voice_confidence": request.voice_confidence
        }),
        voice_source=request.source,
        voice_confidence=request.voice_confidence
    )
    db.add(audit)

    await db.commit()
    await db.refresh(inspection)

    # 7. Build response
    parsed_defect = None
    if inspection.defect_location:
        try:
            parsed_defect = DefectLocation(**json.loads(inspection.defect_location))
        except Exception:
            parsed_defect = None

    parsed_steps = []
    if inspection.repair_steps:
        try:
            parsed_steps = json.loads(inspection.repair_steps)
        except Exception:
            parsed_steps = []

    return InspectResponse(
        inspection_id=inspection.id,
        machine_id=machine.machine_id,
        finding=inspection.finding,
        confidence=inspection.confidence,
        defect_location=parsed_defect,
        repair_steps=parsed_steps,
        needs_escalation=bool(inspection.needs_escalation),
        created_at=inspection.created_at
    )

async def get_machines(db: AsyncSession) -> List[Machine]:
    result = await db.execute(select(Machine).order_by(Machine.machine_id))
    return list(result.scalars().all())

async def get_machine(db: AsyncSession, machine_id: str) -> Optional[Machine]:
    result = await db.execute(select(Machine).where(Machine.machine_id == machine_id))
    return result.scalar_one_or_none()
