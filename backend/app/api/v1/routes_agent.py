import shutil
from pathlib import Path
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.services.agent_orchestrator import run_agent_analysis
from app.schemas.agent import AnalyzeDocumentRequest, AnalyzeDocumentResponse, AgentRunResponse
from app.models.tables import AgentRun
from app.core.config import settings

router = APIRouter(prefix="/api/v1", tags=["agent"])

UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/analyze-doc", response_model=AnalyzeDocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def analyze_document(
    file: UploadFile = File(...),
    machine_id: str = Form(None),
    analysis_type: str = Form("thickness_approval"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload inspection report PDF/DOCX -> Agent analyzes -> returns structured result + DOCX report.
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    request = AnalyzeDocumentRequest(
        file_path=str(file_path),
        machine_id=machine_id,
        analysis_type=analysis_type
    )
    
    return await run_agent_analysis(db, request)

@router.get("/agent/runs", response_model=List[AgentRunResponse])
async def list_agent_runs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentRun).order_by(AgentRun.created_at.desc()).limit(limit)
    )
    runs = result.scalars().all()
    return [AgentRunResponse.model_validate(r) for r in runs]

@router.get("/agent/runs/{run_id}", response_model=AgentRunResponse)
async def get_agent_run(run_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentRun).where(AgentRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return AgentRunResponse.model_validate(run)
