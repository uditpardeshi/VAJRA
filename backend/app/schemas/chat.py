from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class Citation(BaseModel):
    machine_id: str
    source_page: int
    text_snippet: str
    score: float

class ChatRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "question": "What is the acceptable spindle runout for HX-204?",
            "machine_id": "HX-204",
            "top_k": 3
        }
    })
    question: str
    machine_id: Optional[str] = None
    top_k: int = Field(5, ge=1, le=10)

class ChatResponse(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "answer": "According to the HX-204 maintenance manual (page 12), the acceptable spindle runout is 5 μm.",
            "citations": [
                {
                    "machine_id": "HX-204",
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
