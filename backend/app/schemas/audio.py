from pydantic import BaseModel
from typing import Optional

class AudioProcessResponse(BaseModel):
    transcript: str
    confidence: float
    language: str
    duration_ms: int
    model_used: str
