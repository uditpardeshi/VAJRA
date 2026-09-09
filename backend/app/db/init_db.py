from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.tables import Base
from app.db.seed_data import seed_data

async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE inspections ADD COLUMN model_status VARCHAR(20) DEFAULT 'success'"))
        except Exception:
            pass  # Column already exists

    async with AsyncSessionLocal() as session:
        await seed_data(session)
