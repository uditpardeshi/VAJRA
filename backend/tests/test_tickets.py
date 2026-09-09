import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.db.init_db import init_database
from app.core.database import AsyncSessionLocal
from app.models.tables import Ticket, TicketStatus, Escalation, EscalationStatus, Machine, Inspection

@pytest_asyncio.fixture(autouse=True, scope="module")
async def setup_database():
    await init_database()

@pytest.mark.asyncio
async def test_ticket_approval_workflow():
    # 1. Direct DB setup: Create machine, inspection, ticket pending review, and an escalation without ticket
    async with AsyncSessionLocal() as session:
        machine = await session.execute(select(Machine).where(Machine.machine_id == "HX-204"))
        machine_obj = machine.scalar_one()

        inspection1 = Inspection(
            machine_id=machine_obj.id,
            finding="Spindle chatter anomaly",
            confidence=0.75,
        )
        inspection2 = Inspection(
            machine_id=machine_obj.id,
            finding="Low confidence vibration",
            confidence=0.45,
        )
        session.add(inspection1)
        session.add(inspection2)
        await session.flush()

        ticket = Ticket(
            inspection_id=inspection1.id,
            machine_id=machine_obj.id,
            title="Spindle chatter detected",
            description="Vibration sensor anomaly",
            status=TicketStatus.PENDING_REVIEW,
            priority=2,
        )
        session.add(ticket)

        escalation = Escalation(
            ticket_id=None,
            reason="low_confidence",
            status=EscalationStatus.PENDING,
        )
        session.add(escalation)
        await session.commit()
        await session.refresh(ticket)
        await session.refresh(escalation)
        t_id = ticket.id
        e_id = escalation.id
        insp2_id = inspection2.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 2. List pending review tickets
        res = await ac.get("/api/v1/tickets/pending-review")
        assert res.status_code == 200
        pending_list = res.json()
        assert any(t["id"] == t_id for t in pending_list)

        # 3. Approve ticket
        res = await ac.post(f"/api/v1/tickets/{t_id}/approve", json={
            "reviewer_id": 2,
            "assigned_to": 1,
            "note": "Approved for maintenance"
        })
        assert res.status_code == 200
        approved_data = res.json()
        assert approved_data["status"] == "open"
        assert approved_data["assigned_to"] == 1

        # 4. Rejecting already approved ticket should fail (400)
        res = await ac.post(f"/api/v1/tickets/{t_id}/reject", json={
            "reviewer_id": 2,
            "note": "Duplicate"
        })
        assert res.status_code == 400

        # 5. Convert escalation to ticket
        res = await ac.post(f"/api/v1/escalations/{e_id}/convert-to-ticket", json={
            "reviewer_id": 2,
            "title": "Low confidence spindle issue",
            "description": "Converted by reviewer",
            "machine_id": machine_obj.id,
            "inspection_id": insp2_id
        })
        assert res.status_code == 200
        converted_ticket = res.json()
        assert converted_ticket["status"] == "pending_review"
        assert converted_ticket["title"] == "Low confidence spindle issue"

        # 6. Reject the newly converted ticket
        new_t_id = converted_ticket["id"]
        res = await ac.post(f"/api/v1/tickets/{new_t_id}/reject", json={
            "reviewer_id": 2,
            "note": "False alarm after inspection"
        })
        assert res.status_code == 200
        rejected_ticket = res.json()
        assert rejected_ticket["status"] == "rejected"
        assert rejected_ticket["resolved_at"] is not None
