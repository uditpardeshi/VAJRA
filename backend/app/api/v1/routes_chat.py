import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.chat_service import chat_with_rag
from app.core.rag_multimodal import multimodal_rag
from app.schemas.chat import ChatRequest, ChatResponse, SessionFileItem, UploadFilesResponse

router = APIRouter(prefix="/api/v1", tags=["chat"])

UPLOAD_BASE = Path(__file__).parent.parent.parent.parent / "uploads" / "sessions"
UPLOAD_BASE.mkdir(parents=True, exist_ok=True)

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_manual(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ask a question about equipment manuals and session-attached files.
    Returns answer with source file and page citations.
    """
    try:
        return await chat_with_rag(db, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/chat/upload", response_model=UploadFilesResponse, status_code=status.HTTP_201_CREATED)
async def upload_chat_files(
    files: List[UploadFile] = File(...),
    session_id: str = Form("default")
):
    """
    Upload one or multiple files in any format (PDF, DOCX, XLSX, CSV, TXT, MD, JSON, Images)
    for a specific chat session.
    Automatically parses, chunks, and indexes them into the multimodal RAG engine.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    session_folder = UPLOAD_BASE / session_id
    session_folder.mkdir(parents=True, exist_ok=True)

    results: List[SessionFileItem] = []
    total_indexed = 0

    for file in files:
        try:
            dest_path = session_folder / file.filename
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Ingest and parse into RAG
            meta = multimodal_rag.ingest_session_file(
                session_id=session_id,
                file_path=str(dest_path),
                filename=file.filename
            )

            results.append(SessionFileItem(
                filename=file.filename,
                total_chunks=meta.get("total_chunks", 0),
                tables=meta.get("tables_count", 0),
                figures=meta.get("figures_count", 0),
                status="indexed"
            ))
            total_indexed += meta.get("total_chunks", 0)
        except Exception as e:
            results.append(SessionFileItem(
                filename=file.filename,
                total_chunks=0,
                tables=0,
                figures=0,
                status=f"error: {str(e)}"
            ))

    return UploadFilesResponse(
        session_id=session_id,
        files=results,
        total_indexed=total_indexed
    )

@router.get("/chat/sessions/{session_id}/files", response_model=List[SessionFileItem])
async def list_session_files(session_id: str):
    """List all indexed files for a given chat session."""
    files = multimodal_rag.get_session_files(session_id)
    return [
        SessionFileItem(
            filename=f["filename"],
            total_chunks=f["total_chunks"],
            tables=f.get("tables", 0),
            figures=f.get("figures", 0),
            status="indexed"
        )
        for f in files
    ]
