from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.inspection_service import get_machines, get_machine
from app.models.tables import Machine

class MachineService:
    @staticmethod
    async def list_all(db: AsyncSession) -> List[Machine]:
        return await get_machines(db)

    @staticmethod
    async def get_by_machine_id(db: AsyncSession, machine_id: str) -> Optional[Machine]:
        return await get_machine(db, machine_id)
