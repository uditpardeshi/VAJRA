from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from app.models.tables import EscalationStatus

class EscalationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: Optional[int] = None
    reason: str
    status: EscalationStatus
    reviewer_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class EscalationListResponse(BaseModel):
    escalations: List[EscalationResponse]

class EscalationAcknowledgeRequest(BaseModel):
    reviewer_id: int

class EscalationResolveRequest(BaseModel):
    reviewer_id: int
    resolution_note: str

# WebSocket message types
class WSMessage(BaseModel):
    type: str  # "escalation_created", "escalation_acknowledged", "escalation_resolved", "inspection_completed"
    payload: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
