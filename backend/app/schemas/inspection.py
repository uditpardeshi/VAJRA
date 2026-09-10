from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DefectLocation(BaseModel):
    x: float = Field(..., ge=0, le=1, description="Normalized x (0-1)")
    y: float = Field(..., ge=0, le=1, description="Normalized y (0-1)")
    w: float = Field(..., ge=0, le=1, description="Normalized width")
    h: float = Field(..., ge=0, le=1, description="Normalized height")

class InspectRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "machine_id": "HX-204",
            "image_base64": "/9j/4AAQSkZJRgABAQ...",
            "prompt_override": "Focus on spindle wear and oil leaks"
        }
    })
    machine_id: str = Field(..., description="Machine identifier (e.g., HX-204)")
    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG image")
    prompt_override: Optional[str] = Field(None, description="Optional custom prompt addition")
    source: Optional[str] = Field(None, description="'voice' | 'manual'")
    voice_command: Optional[str] = Field(None, description="Voice transcript that triggered inspection")
    voice_confidence: Optional[float] = Field(None, ge=0, le=1)

from app.models.tables import ModelStatus

class InspectResponse(BaseModel):
    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "inspection_id": 1,
                "machine_id": "HX-204",
                "finding": "Spindle shows abnormal wear pattern. Oil leak detected at seal.",
                "confidence": 0.87,
                "defect_location": {"x": 0.42, "y": 0.58, "w": 0.15, "h": 0.12},
                "repair_steps": [
                    "Stop machine and lock out power",
                    "Remove spindle housing cover",
                    "Inspect seal for damage",
                    "Replace seal if worn",
                    "Reassemble and test run"
                ],
                "needs_escalation": False,
                "model_status": "success",
                "created_at": "2026-09-09T14:32:10.123Z"
            }
        }
    )
    inspection_id: int
    machine_id: str
    finding: str
    confidence: float = Field(..., ge=0, le=1)
    defect_location: Optional[DefectLocation] = None
    repair_steps: List[str] = []
    needs_escalation: bool
    model_status: Optional[ModelStatus] = ModelStatus.SUCCESS
    created_at: datetime

class MachineResponse(BaseModel):
    id: int
    machine_id: str
    name: str
    type: str
    location: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MachineListResponse(BaseModel):
    machines: List[MachineResponse]
