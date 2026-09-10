import json
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tables import (
    Machine, User, UserRole, Inspection, Ticket, TicketStatus,
    Escalation, EscalationStatus, AuditLog, ModelStatus
)

MACHINES = [
    {
        "machine_id": "HX-204",
        "name": "Horizontal Machining Center HX-204",
        "type": "CNC",
        "location": "Bay A, Line 1",
        "manual_path": "manuals/HX-204_maintenance.pdf",
        "specs_json": json.dumps({
            "spindle_speed_rpm": 12000,
            "max_tool_diameter_mm": 100,
            "spindle_taper": "BT40",
            "coolant_pressure_bar": 20,
            "acceptable_spindle_runout_um": 5,
            "oil_type": "ISO VG 32",
            "bearing_replacement_interval_hours": 8000
        })
    },
    {
        "machine_id": "CNC-500",
        "name": "Vertical Machining Center CNC-500",
        "type": "CNC",
        "location": "Bay B, Line 2",
        "manual_path": "manuals/CNC-500_maintenance.pdf",
        "specs_json": json.dumps({
            "spindle_speed_rpm": 15000,
            "max_tool_diameter_mm": 80,
            "spindle_taper": "HSK-A63",
            "coolant_pressure_bar": 30,
            "acceptable_spindle_runout_um": 3,
            "oil_type": "ISO VG 46",
            "bearing_replacement_interval_hours": 6000
        })
    },
    {
        "machine_id": "LATHE-3",
        "name": "CNC Lathe LATHE-3",
        "type": "LATHE",
        "location": "Bay C, Line 1",
        "manual_path": "manuals/LATHE-3_maintenance.pdf",
        "specs_json": json.dumps({
            "max_turning_diameter_mm": 300,
            "max_turning_length_mm": 500,
            "spindle_speed_rpm": 4000,
            "chuck_size_inch": 10,
            "tailstock_taper": "MT4",
            "acceptable_spindle_runout_um": 8,
            "oil_type": "ISO VG 68",
            "bearing_replacement_interval_hours": 10000
        })
    }
]

USERS = [
    {"username": "engineer1", "full_name": "Rajesh Kumar", "role": UserRole.ENGINEER},
    {"username": "reviewer1", "full_name": "Priya Sharma", "role": UserRole.REVIEWER},
    {"username": "admin1", "full_name": "Amit Singh", "role": UserRole.ADMIN},
]

async def seed_data(db: AsyncSession):
    # 1. Machines
    existing_machine = await db.execute(select(Machine).limit(1))
    if not existing_machine.scalar_one_or_none():
        for m in MACHINES:
            db.add(Machine(**m))
        await db.flush()

    # 2. Users
    existing_user = await db.execute(select(User).limit(1))
    if not existing_user.scalar_one_or_none():
        for u in USERS:
            db.add(User(**u))
        await db.flush()

    # 3. Check if operational data exists
    existing_inspection = await db.execute(select(Inspection).limit(1))
    if existing_inspection.scalar_one_or_none():
        await db.commit()
        return

    # Fetch machine IDs
    res = await db.execute(select(Machine))
    machines_by_id = {m.machine_id: m.id for m in res.scalars().all()}
    hx_id = machines_by_id.get("HX-204", 1)
    cnc_id = machines_by_id.get("CNC-500", 2)
    lathe_id = machines_by_id.get("LATHE-3", 3)

    now = datetime.utcnow()

    # Seed Inspections with diverse realistic findings
    inspection_seeds = [
        {
            "machine_id": hx_id,
            "finding": "Spindle runout measured 4.2 μm, within acceptable 5.0 μm limit. Minor taper surface wear.",
            "confidence": 0.94,
            "defect_location": json.dumps({"x": 0.45, "y": 0.35, "w": 0.15, "h": 0.18, "label": "Taper Face"}),
            "repair_steps": json.dumps(["Clean spindle taper with solvent pad", "Re-torque pull stud to 45 Nm"]),
            "needs_escalation": 0,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(hours=2),
            "ticket": {
                "title": "HX-204 Spindle Taper Maintenance",
                "description": "Routine check shows 4.2 μm runout. Solvent cleaning and pull stud torque scheduled.",
                "status": TicketStatus.OPEN,
                "priority": 3,
                "created_at": now - timedelta(hours=2),
            }
        },
        {
            "machine_id": cnc_id,
            "finding": "Hydraulic line pressure low at 2.1 bar (nominal: 3.5 bar). Pressure fluctuation detected.",
            "confidence": 0.65,
            "defect_location": json.dumps({"x": 0.28, "y": 0.62, "w": 0.22, "h": 0.14, "label": "Pressure Manifold"}),
            "repair_steps": json.dumps(["Check nitrogen pre-charge in accumulator", "Inspect manifold seals for leaks"]),
            "needs_escalation": 1,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(hours=5),
            "ticket": {
                "title": "CNC-500 Low Hydraulic Pressure Fault",
                "description": "Pressure drop to 2.1 bar poses hydraulic clamping release hazard during tool engagement.",
                "status": TicketStatus.PENDING_REVIEW,
                "priority": 1,
                "created_at": now - timedelta(hours=5),
            },
            "escalation": {
                "reason": "safety_critical",
                "status": EscalationStatus.PENDING,
                "created_at": now - timedelta(hours=5),
            }
        },
        {
            "machine_id": lathe_id,
            "finding": "Carbide insert flank wear measured 0.18 mm (spec limit: 0.30 mm). Cutting edge intact.",
            "confidence": 0.91,
            "defect_location": json.dumps({"x": 0.52, "y": 0.41, "w": 0.12, "h": 0.10, "label": "Tool Tip Insert"}),
            "repair_steps": json.dumps(["Continue operation; index insert edge at next 50-part cycle"]),
            "needs_escalation": 0,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(hours=9),
            "ticket": {
                "title": "LATHE-3 Tool Insert Wear Check",
                "description": "Flank wear at 0.18 mm within nominal envelope. Edge indexing milestone set.",
                "status": TicketStatus.RESOLVED,
                "priority": 4,
                "created_at": now - timedelta(hours=9),
                "resolved_at": now - timedelta(hours=6),
            }
        },
        {
            "machine_id": hx_id,
            "finding": "Vibration harmonics baseline verified at 55 Hz. No abnormal bearing cage frequencies.",
            "confidence": 0.96,
            "defect_location": None,
            "repair_steps": json.dumps(["Log baseline into vibration database", "Next check in 200 operating hours"]),
            "needs_escalation": 0,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(days=1, hours=3),
            "ticket": {
                "title": "HX-204 Harmonic Vibration Baseline",
                "description": "Periodic vibration sweep passed with 55 Hz harmonic profile.",
                "status": TicketStatus.RESOLVED,
                "priority": 3,
                "created_at": now - timedelta(days=1, hours=3),
                "resolved_at": now - timedelta(days=1, hours=1),
            }
        },
        {
            "machine_id": cnc_id,
            "finding": "Tool changer arm alignment offset by 1.8 mm. Sensor detects sporadic pocket miscount.",
            "confidence": 0.62,
            "defect_location": json.dumps({"x": 0.35, "y": 0.25, "w": 0.30, "h": 0.20, "label": "ATC Arm Gripper"}),
            "repair_steps": json.dumps(["Mechanical realignment of gripper arm", "Re-calibrate carousel zero position"]),
            "needs_escalation": 1,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(days=2, hours=4),
            "ticket": {
                "title": "CNC-500 ATC Arm Misalignment",
                "description": "Tool changer arm pocket offset requires mechanical recalibration.",
                "status": TicketStatus.IN_PROGRESS,
                "priority": 2,
                "created_at": now - timedelta(days=2, hours=4),
            },
            "escalation": {
                "reason": "low_confidence",
                "status": EscalationStatus.ACKNOWLEDGED,
                "reviewer_id": 2,
                "created_at": now - timedelta(days=2, hours=4),
            }
        },
        {
            "machine_id": lathe_id,
            "finding": "Coolant filtration particulate build-up at inlet mesh. Flow rate reduced by 15%.",
            "confidence": 0.88,
            "defect_location": json.dumps({"x": 0.60, "y": 0.70, "w": 0.18, "h": 0.16, "label": "Filter Screen"}),
            "repair_steps": json.dumps(["Clean or replace 50-micron inlet filter", "Flush suction line"]),
            "needs_escalation": 0,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(days=3, hours=1),
            "ticket": {
                "title": "LATHE-3 Coolant Filter Flush",
                "description": "Filter mesh cleaned and flow rate restored to 45 L/min.",
                "status": TicketStatus.CLOSED,
                "priority": 3,
                "created_at": now - timedelta(days=3, hours=1),
                "resolved_at": now - timedelta(days=2, hours=20),
            }
        },
        {
            "machine_id": hx_id,
            "finding": "Spindle chiller temperature differential high (inlet: 21°C, outlet: 33°C).",
            "confidence": 0.58,
            "defect_location": json.dumps({"x": 0.40, "y": 0.50, "w": 0.20, "h": 0.25, "label": "Heat Exchanger"}),
            "repair_steps": json.dumps(["Check refrigerant pressure", "Clean condenser coils"]),
            "needs_escalation": 1,
            "model_status": ModelStatus.SUCCESS,
            "created_at": now - timedelta(days=4, hours=6),
            "ticket": {
                "title": "HX-204 Chiller Over-Temperature",
                "description": "Delta T exceeds 10°C threshold. Condenser cleaned and refrigerant topped up.",
                "status": TicketStatus.RESOLVED,
                "priority": 1,
                "created_at": now - timedelta(days=4, hours=6),
                "resolved_at": now - timedelta(days=4, hours=2),
            },
            "escalation": {
                "reason": "safety_critical",
                "status": EscalationStatus.RESOLVED,
                "reviewer_id": 2,
                "created_at": now - timedelta(days=4, hours=6),
                "resolved_at": now - timedelta(days=4, hours=2),
            }
        }
    ]

    for item in inspection_seeds:
        ticket_data = item.pop("ticket", None)
        esc_data = item.pop("escalation", None)

        insp = Inspection(**item)
        db.add(insp)
        await db.flush()

        if ticket_data:
            ticket = Ticket(
                inspection_id=insp.id,
                machine_id=insp.machine_id,
                assigned_to=1,
                **ticket_data
            )
            db.add(ticket)
            await db.flush()

            if esc_data:
                esc = Escalation(
                    ticket_id=ticket.id,
                    **esc_data
                )
                db.add(esc)
                await db.flush()

    # Seed Initial Audit Log
    audit_events = [
        ("INSPECT", "inspection", 1, "Completed visual inspection for HX-204 spindle runout (4.2 μm)"),
        ("TICKET_CREATE", "ticket", 2, "Auto-created ticket for CNC-500 hydraulic pressure drop (2.1 bar)"),
        ("ESCALATE", "escalation", 1, "Safety escalation triggered: Low hydraulic pressure on CNC-500"),
        ("TICKET_RESOLVE", "ticket", 3, "Closed wear check ticket for LATHE-3 carbide insert"),
        ("CONFIG_SYNC", "system", 1, "System configuration verified against Sovereign local DB"),
    ]
    for action, r_type, r_id, detail in audit_events:
        db.add(AuditLog(
            user_id=1,
            action=action,
            resource_type=r_type,
            resource_id=r_id,
            details=json.dumps({"message": detail}),
            created_at=now - timedelta(minutes=15)
        ))

    await db.commit()
