from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.inspection_service import get_machines, get_machine
from app.schemas.inspection import MachineListResponse, MachineResponse

router = APIRouter(prefix="/api/v1", tags=["machines"])

@router.get("/machines", response_model=MachineListResponse)
async def list_machines(db: AsyncSession = Depends(get_db)):
    machines = await get_machines(db)
    return MachineListResponse(machines=[MachineResponse.model_validate(m) for m in machines])

@router.get("/machines/{machine_id}", response_model=MachineResponse)
async def get_machine_detail(machine_id: str, db: AsyncSession = Depends(get_db)):
    machine = await get_machine(db, machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return MachineResponse.model_validate(machine)
