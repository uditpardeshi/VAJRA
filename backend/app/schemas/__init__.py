# Schemas package
from app.schemas.common import UserRoleSchema, TicketStatusSchema, EscalationStatusSchema
from app.schemas.inspection import (
    DefectLocation, InspectRequest, InspectResponse,
    MachineResponse, MachineListResponse
)
