from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class Citation(BaseModel):
    machine_id: str
    source_page: int
    text_snippet: str
    score: float
    source_file: Optional[str] = None
    table_data: Optional[str] = None
    image_snippet_url: Optional[str] = None
    modality: str = "text"  # "text" | "table" | "figure"

class ChatRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "question": "What is the acceptable spindle runout for HX-204?",
            "machine_id": "HX-204",
            "session_id": "thread-12345",
            "top_k": 5
        }
    })
    question: str
    machine_id: Optional[str] = None
    session_id: Optional[str] = None
    top_k: int = Field(5, ge=1, le=10)

class ChatResponse(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "answer": "According to the maintenance manual (page 12), acceptable spindle runout is 5 μm.",
            "citations": [
                {
                    "machine_id": "HX-204",
                    "source_file": "HX-204_Manual.pdf",
                    "source_page": 12,
                    "text_snippet": "Acceptable spindle runout: 5 μm maximum...",
                    "score": 0.92
                }
            ],
            "confidence": 0.89,
            "created_at": "2026-09-09T15:45:22.123Z"
        }
    })
    answer: str
    citations: List[Citation]
    confidence: float = Field(..., ge=0, le=1)
    created_at: datetime

class SessionFileItem(BaseModel):
    filename: str
    total_chunks: int = 0
    tables: int = 0
    figures: int = 0
    status: str = "indexed"

class UploadFilesResponse(BaseModel):
    session_id: str
    files: List[SessionFileItem]
    total_indexed: int
