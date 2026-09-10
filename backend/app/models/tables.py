from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, Index
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class UserRole(str, PyEnum):
    ENGINEER = "engineer"
    REVIEWER = "reviewer"
    ADMIN = "admin"

class TicketStatus(str, PyEnum):
    PENDING_REVIEW = "pending_review"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REJECTED = "rejected"

class EscalationStatus(str, PyEnum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

class Machine(Base):
    __tablename__ = "machines"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "HX-204"
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # "CNC", "LATHE", "CONVEYOR"
    location = Column(String(100))
    manual_path = Column(String(255))  # path to PDF manual for RAG
    specs_json = Column(Text)          # JSON string of key specs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inspections = relationship("Inspection", back_populates="machine")
    tickets = relationship("Ticket", back_populates="machine")

class ModelStatus(str, PyEnum):
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False, index=True)
    image_path = Column(String(255))           # stored image path (optional)
    finding = Column(Text, nullable=False)     # LLM analysis text
    confidence = Column(Float, nullable=False) # 0.0 - 1.0
    defect_location = Column(Text)             # JSON: {"x": 0.3, "y": 0.6, "w": 0.1, "h": 0.15}
    repair_steps = Column(Text)                # JSON array of strings
    needs_escalation = Column(Integer, default=0)  # 0/1
    model_status = Column(Enum(ModelStatus), default=ModelStatus.SUCCESS, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    machine = relationship("Machine", back_populates="inspections")
    ticket = relationship("Ticket", back_populates="inspection", uselist=False)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), unique=True, nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(Enum(TicketStatus), default=TicketStatus.PENDING_REVIEW, index=True)
    priority = Column(Integer, default=2)  # 1=critical, 2=high, 3=medium, 4=low
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)

    machine = relationship("Machine", back_populates="tickets")
    inspection = relationship("Inspection", back_populates="ticket")
    escalation = relationship("Escalation", back_populates="ticket", uselist=False)

class Escalation(Base):
    __tablename__ = "escalations"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True, unique=False)
    reason = Column(Text)  # "low_confidence" | "safety_critical" | "manual_review"
    status = Column(Enum(EscalationStatus), default=EscalationStatus.PENDING, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)

    ticket = relationship("Ticket", back_populates="escalation")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.ENGINEER, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # "inspect", "escalate", "ticket_create", etc.
    resource_type = Column(String(50))  # "inspection", "ticket", "machine"
    resource_id = Column(Integer)
    details = Column(Text)  # JSON
    voice_source = Column(String(20), nullable=True)  # 'voice' | 'text'
    voice_confidence = Column(Float, nullable=True)
    voice_language = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True, index=True)
    input_file_path = Column(String(255))  # uploaded PDF
    status = Column(String(20), default="running", index=True)  # running, completed, failed
    tools_used = Column(Text)  # JSON array: ["doc_reader", "rag", "calculator", "report_gen"]
    result_json = Column(Text)  # final structured result
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User")
    machine = relationship("Machine")

class ChatMessageRecord(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    citations_json = Column(Text, nullable=True)  # JSON string of citations
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

# Indexes for common queries
Index("ix_inspections_machine_created", Inspection.machine_id, Inspection.created_at)
Index("ix_tickets_status_created", Ticket.status, Ticket.created_at)
Index("ix_audit_log_user_created", AuditLog.user_id, AuditLog.created_at)
Index("ix_agent_runs_user_created", AgentRun.user_id, AgentRun.created_at)
Index("ix_chat_messages_session_created", ChatMessageRecord.session_id, ChatMessageRecord.created_at)
