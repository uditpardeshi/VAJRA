from enum import Enum

class UserRoleSchema(str, Enum):
    ENGINEER = "engineer"
    REVIEWER = "reviewer"
    ADMIN = "admin"

class TicketStatusSchema(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class EscalationStatusSchema(str, Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
