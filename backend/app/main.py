import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import routes_inspect, routes_machines, routes_chat, routes_escalation, routes_agent, routes_tickets

BASE_DIR = Path(__file__).parent.parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Sovereign AI Workbench API",
    version="1.0.0",
    description="On-premise agentic AI for confidential industrial inspection",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_inspect.router)
app.include_router(routes_machines.router)
app.include_router(routes_chat.router)
app.include_router(routes_escalation.router)
app.include_router(routes_agent.router)
app.include_router(routes_tickets.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "sovereign-workbench"}

@app.get("/test", include_in_schema=False)
async def test_page():
    test_file = BASE_DIR / "test_frontend.html"
    if test_file.exists():
        return FileResponse(str(test_file))
    return {"error": "test_frontend.html not found"}

@app.get("/")
async def root():
    return {"message": "Sovereign AI Workbench API", "docs": "/docs", "test_harness": "/test"}
