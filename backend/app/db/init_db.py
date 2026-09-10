from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.tables import Base
from app.db.seed_data import seed_data

async def init_database():
    async with engine.begin() as conn:
        # Check if escalations table has NOT NULL ticket_id and recreate if needed
        try:
            res = await conn.execute(text("PRAGMA table_info(escalations)"))
            columns = res.fetchall()
            for col in columns:
                if col[1] == 'ticket_id' and col[3] == 1:
                    await conn.execute(text("DROP TABLE escalations"))
                    break
        except Exception:
            pass

        await conn.run_sync(Base.metadata.create_all)

        try:
            await conn.execute(text("ALTER TABLE inspections ADD COLUMN model_status VARCHAR(20) DEFAULT 'success'"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE audit_log ADD COLUMN voice_source VARCHAR(20)"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE audit_log ADD COLUMN voice_confidence FLOAT"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE audit_log ADD COLUMN voice_language VARCHAR(10)"))
        except Exception:
            pass

    async with AsyncSessionLocal() as session:
        await seed_data(session)
