from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.tables import TicketStatus

class TicketActionRequest(BaseModel):
    reviewer_id: int
    note: Optional[str] = None

class TicketApproveRequest(TicketActionRequest):
    # Optionally assign to engineer
    assigned_to: Optional[int] = None

class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    inspection_id: int
    machine_id: int
    title: str
    description: Optional[str] = None
    status: TicketStatus
    priority: int
    assigned_to: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
