import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tables import Machine, User, UserRole

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
    # Check if already seeded
    existing = await db.execute(select(Machine).limit(1))
    if existing.scalar_one_or_none():
        return  # Already seeded

    # Machines
    for m in MACHINES:
        db.add(Machine(**m))

    # Users
    for u in USERS:
        db.add(User(**u))

    await db.commit()
