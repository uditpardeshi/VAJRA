from pydantic import BaseModel, ConfigDict
from typing import Optional

class AudioProcessResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    transcript: str
    confidence: float
    language: str
    duration_ms: int
    model_used: str
