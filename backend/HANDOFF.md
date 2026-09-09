# Sovereign AI Workbench — Backend Handoff

## Current Status
- **Slice**: All Backend Slices Complete (Camera Inspection + Multi-Model Router + Local RAG + Confidence & Escalation + WebSocket + Agentic Document Workflow + Interactive Test Harness)
- **Last Updated**: 2026-09-09
- **Implemented By**: Antigravity
- **Reviewed By Planner**: Yes

## Completed Components
- [x] FastAPI project structure
- [x] Config (Pydantic Settings + .env with model registry & ChromaDB settings)
- [x] Model Router (vision, text, code, embedding tasks via ngrok / local)
- [x] SQLite models (Machine, Inspection, Ticket, Escalation, User, AuditLog, AgentRun)
- [x] Pydantic schemas (InspectRequest, InspectResponse, MachineResponse, ChatRequest, ChatResponse, Citation, EscalationResponse, WSMessage, AnalyzeDocumentRequest, AnalyzeDocumentResponse, AgentRunResponse)
- [x] Inspection service (create_inspection, get_machines, auto-escalation integration)
- [x] RAG engine (`app/core/rag.py`: ChromaDB PersistentClient + SentenceTransformer embeddings + pypdf)
- [x] Chat service (`app/services/chat_service.py`: semantic search + prompt formatting + text LLM + audit log)
- [x] WebSocket manager (`app/core/websocket_manager.py`: connection manager, role broadcast, targeted send)
- [x] Escalation service (`app/services/escalation_service.py`: create, acknowledge, resolve + WS broadcast)
- [x] Agent Tools (`app/core/agent_tools.py`: DocReader, KnowledgeSearch, Calculator, ReportGenerator)
- [x] Agent Orchestrator (`app/services/agent_orchestrator.py`: tool loop planning, LLM extraction, execution trace)
- [x] API routes (POST /inspect, GET /machines, GET /machines/{id}, POST /chat, GET /escalations/pending, GET /escalations, POST /escalations/{id}/acknowledge, POST /escalations/{id}/resolve, WS /ws/escalations, POST /analyze-doc, GET /agent/runs, GET /agent/runs/{id})
- [x] Database init + seed data (3 machines, 3 users)
- [x] Manual ingestion script (`python -m app.db.ingest_manuals`)
- [x] Interactive Test Frontend Harness (`GET /test` -> `test_frontend.html`)
- [x] Main app (lifespan, CORS, health endpoint, routers, test harness mount)
- [x] Requirements.txt (locked dependencies including chromadb, sentence-transformers, pypdf, websockets, python-docx, openpyxl)
- [x] README with run instructions
- [x] Smoke test scripts (`test_smoke.py`, `test_rag.py`, `test_escalation.py`, `test_agent.py`)
- [x] HANDOFF.md (this file)

## Test Harness UI
Visually test all endpoints on desktop or phone:
```http
GET http://<LAPTOP_IP>:8000/test
```
Features:
- Camera live capture & vision inspection
- RAG manual Q&A with citations
- Real-time escalation WebSocket alerts log
- PDF/DOCX document upload & agent analysis
- Agent run history browser

## API Contracts (frozen for frontend)
```http
POST /api/v1/inspect
Request: { machine_id: string, image_base64: string, prompt_override?: string }
Response: { inspection_id, machine_id, finding, confidence, defect_location?, repair_steps[], needs_escalation, created_at }

POST /api/v1/chat
Request: { question: string, machine_id?: string, top_k?: int }
Response: { answer: string, citations: [{ machine_id, source_page, text_snippet, score }], confidence: float, created_at: string }

GET /api/v1/escalations/pending
Response: { escalations: [{ id, ticket_id, reason, status, reviewer_id, created_at, resolved_at }] }

POST /api/v1/escalations/{id}/acknowledge
Request: { reviewer_id: int }

POST /api/v1/escalations/{id}/resolve
Request: { reviewer_id: int, resolution_note: string }

WS /api/v1/ws/escalations?role=reviewer&user_id=2
Real-time Messages: { type: "escalation_created|escalation_acknowledged|escalation_resolved", payload: {...}, timestamp: string }

POST /api/v1/analyze-doc (multipart/form-data)
Request: file=@report.pdf, machine_id=HX-204, analysis_type=thickness_approval
Response: { run_id, status, tools_used, result{equipment, measured_thickness_mm, required_thickness_mm, deviation_mm, recommendation, report_path}, tool_trace, created_at, completed_at }

GET /api/v1/agent/runs
Response: [{ id, user_id, machine_id, input_file_path, status, tools_used, result_json, error_message, created_at, completed_at }]
```

## Commands to Run
```bash
# Ingest manuals (run once after adding PDFs to manuals/)
python -m app.db.ingest_manuals

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Open Test Harness
# Browser: http://localhost:8000/test

# Automated Smoke Tests
python test_smoke.py
python test_rag.py
python test_escalation.py
python test_agent.py

# Contract Tests
.\.venv\Scripts\pytest tests/ -v
```
