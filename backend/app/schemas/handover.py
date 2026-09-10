from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

class ShiftType(str, Enum):
    MORNING = "morning"
    EVENING = "evening"
    NIGHT = "night"

class HandoverTicket(BaseModel):
    id: int
    title: str
    machine_id: str
    machine_name: str
    status: str
    priority: int
    created_at: datetime
    assigned_to: Optional[str] = None

class HandoverEscalation(BaseModel):
    id: int
    ticket_id: Optional[int] = None
    machine_id: str
    reason: str
    status: str
    confidence: float
    created_at: datetime

class HandoverMachineWatch(BaseModel):
    machine_id: str
    machine_name: str
    last_inspection: datetime
    last_finding: str
    confidence: float
    health_score: int

class HandoverPartNeeded(BaseModel):
    part_name: str
    part_number: str
    machine_id: str
    quantity_needed: int
    in_stock: int
    on_order: bool
    eta: Optional[str] = None

class HandoverSafetyIncident(BaseModel):
    id: int
    type: str
    machine_id: str
    description: str
    severity: str
    reported_at: datetime
    status: str

class HandoverPayload(BaseModel):
    shift_type: ShiftType
    shift_date: date
    generated_by: str
    generated_at: datetime
    open_tickets: List[HandoverTicket] = []
    pending_escalations: List[HandoverEscalation] = []
    machines_to_watch: List[HandoverMachineWatch] = []
    parts_needed: List[HandoverPartNeeded] = []
    safety_incidents: List[HandoverSafetyIncident] = []
    summary: Dict[str, int] = Field(default_factory=dict)

class ShiftHandoverCreate(BaseModel):
    shift_type: ShiftType
    shift_date: Optional[date] = None
    user_id: Optional[int] = 1

class ShiftHandoverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    shift_type: ShiftType
    shift_date: date
    generated_by: int
    generated_by_name: str
    generated_at: datetime
    qr_code: str
    qr_code_url: str
    payload: HandoverPayload
    viewed_by: Optional[int] = None
    viewed_at: Optional[datetime] = None
    created_at: datetime

class ShiftHandoverViewResponse(BaseModel):
    handover: ShiftHandoverResponse
    viewer_name: str
    viewed_at: datetime
    is_first_view: bool
