from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db
from app.services.handover_service import HandoverService
from app.schemas.handover import (
    ShiftHandoverCreate, ShiftHandoverResponse, 
    ShiftHandoverViewResponse
)

router = APIRouter(prefix="/api/v1", tags=["handover"])

@router.post("/handover/generate", response_model=ShiftHandoverResponse, status_code=status.HTTP_201_CREATED)
async def generate_handover(
    request: ShiftHandoverCreate,
    db: AsyncSession = Depends(get_db)
):
    """Generate shift handover report with QR code."""
    try:
        user_id = request.user_id or 1
        return await HandoverService.generate_handover(db, request, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate handover: {str(e)}")

@router.get("/handover/{qr_code}", response_model=ShiftHandoverViewResponse)
async def view_handover_by_qr(
    qr_code: str,
    user_id: int = Query(default=1, description="Viewer user ID"),
    db: AsyncSession = Depends(get_db)
):
    """View handover by scanning QR code."""
    try:
        return await HandoverService.get_handover_by_qr(db, qr_code, user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve handover: {str(e)}")

@router.get("/handovers", response_model=List[ShiftHandoverResponse])
async def list_handovers(
    limit: int = Query(default=20, ge=1, le=100),
    shift_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List recent handovers (admin/manager)."""
    try:
        return await HandoverService.list_handovers(db, limit, shift_type)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to list handovers: {str(e)}")
