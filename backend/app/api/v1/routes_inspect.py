from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.inspection_service import create_inspection
from app.schemas.inspection import InspectRequest, InspectResponse

router = APIRouter(prefix="/api/v1", tags=["inspection"])

@router.post("/inspect", response_model=InspectResponse, status_code=status.HTTP_201_CREATED)
async def inspect_equipment(
    request: InspectRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze equipment photo via multimodal LLM.
    Returns structured inspection result + auto-creates ticket if issue found.
    """
    try:
        return await create_inspection(db, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection failed: {str(e)}")
