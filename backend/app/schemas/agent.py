from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class AnalyzeDocumentRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "file_path": "uploads/Inspection_Report_HX-204.pdf",
            "machine_id": "HX-204",
            "analysis_type": "thickness_approval"
        }
    })
    file_path: str
    machine_id: Optional[str] = None
    analysis_type: str = "general"

class ToolCall(BaseModel):
    tool: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    duration_ms: int

class AnalyzeDocumentResponse(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "run_id": 1,
            "status": "completed",
            "machine_id": "HX-204",
            "tools_used": ["doc_reader", "rag", "calculator", "report_gen"],
            "result": {
                "equipment": "HX-204",
                "measured_thickness_mm": 2.8,
                "required_thickness_mm": 3.5,
                "deviation_mm": -0.7,
                "recommendation": "REJECT - Below minimum thickness",
                "report_path": "reports/Analysis_Report_HX-204_20260909_143022.docx"
            },
            "tool_trace": [
                {"tool": "doc_reader", "input": {}, "output": {}, "duration_ms": 450},
                {"tool": "rag", "input": {}, "output": {}, "duration_ms": 1200}
            ],
            "created_at": "2026-09-09T14:30:22.123Z",
            "completed_at": "2026-09-09T14:30:25.456Z"
        }
    })
    run_id: int
    status: str
    machine_id: Optional[str] = None
    tools_used: List[str]
    result: Dict[str, Any]
    tool_trace: List[ToolCall]
    created_at: datetime
    completed_at: Optional[datetime] = None

class AgentRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    machine_id: Optional[int] = None
    input_file_path: str
    status: str
    tools_used: Optional[str] = None
    result_json: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
