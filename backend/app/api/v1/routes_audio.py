from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.services.audio_service import process_audio_file
from app.schemas.audio import AudioProcessResponse

router = APIRouter(prefix="/api/v1", tags=["audio"])

@router.post("/audio/transcribe", response_model=AudioProcessResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en-US"),
    machine_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Fallback: Frontend uploads audio file -> backend transcribes -> returns text.
    Use when Web Speech API fails or for unsupported browsers.
    """
    allowed = {"audio/wav", "audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "application/octet-stream"}
    if file.content_type and file.content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format: {file.content_type}"
        )

    try:
        result = await process_audio_file(file, language, machine_id, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )
