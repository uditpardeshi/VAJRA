from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.chat_service import chat_with_rag
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/v1", tags=["chat"])

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_manual(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ask a question about equipment manuals. Returns answer with citations.
    Optional machine_id filters search to that machine's manual.
    """
    try:
        return await chat_with_rag(db, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
