import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tables import AuditLog
from app.core.model_router import model_router
from app.core.rag_multimodal import multimodal_rag
from app.schemas.chat import ChatRequest, ChatResponse, Citation

SYSTEM_PROMPT = """You are VAJRA, an expert industrial maintenance, machining, and engineering AI assistant.
Answer technical questions using the provided context from manufacturing manuals, attached engineering reports, specification tables, and schematics.
- Cite sources clearly with [document_name, page/section X]
- Include precise values (tolerances, pressures, dimensions, intervals, torque) when available
- If context does not contain the answer, use your engineering knowledge but explicitly state that it is general guidance rather than OEM spec
- Be concise, technical, and structured"""

async def chat_with_rag(
    db: AsyncSession,
    request: ChatRequest,
    user_id: int = 1
) -> ChatResponse:
    # 1. Retrieve relevant chunks from both session-attached files and machine manuals
    hits = multimodal_rag.search(
        query=request.question,
        machine_id=request.machine_id,
        session_id=request.session_id,
        top_k=request.top_k
    )

    if not hits:
        system = (
            "You are VAJRA, an expert industrial maintenance, machining, and engineering AI workbench assistant. "
            "Provide a concise, technically precise, and actionable answer to the technician's inquiry."
        )
        answer = await model_router.text_chat(request.question, system=system, temperature=0.7)
        return ChatResponse(
            answer=answer.strip(),
            citations=[],
            confidence=0.85,
            created_at=datetime.utcnow()
        )

    # 2. Build context
    context_parts = []
    citations = []
    for h in hits:
        source_name = h.get("source_file") or h.get("machine_id", "Manual")
        extra_ctx = f"\n[EXTRACTED TABLE / SPECS]:\n{h['table_data']}" if h.get("table_data") else ""
        context_parts.append(f"[SOURCE: {source_name}, PAGE/SECTION {h['source_page']}]{extra_ctx}\n{h['text']}")
        citations.append(Citation(
            machine_id=h.get("machine_id", "Manual"),
            source_file=h.get("source_file") or source_name,
            source_page=h.get("source_page", 1),
            text_snippet=h["text"][:220] + "..." if len(h["text"]) > 220 else h["text"],
            score=round(h.get("score", 0.8), 3),
            table_data=h.get("table_data"),
            image_snippet_url=h.get("image_snippet_url"),
            modality=h.get("modality", "text")
        ))

    context = "\n\n---\n\n".join(context_parts)
    prompt = f"RELEVANT DOCUMENT & MANUAL CONTEXT:\n{context}\n\nQUESTION: {request.question}\n\nANSWER:"

    # 3. Call text model with context
    answer = await model_router.text_chat(prompt, system=SYSTEM_PROMPT, temperature=0.3)

    # 4. Confidence heuristic: avg retrieval score * 0.8 + 0.2
    avg_score = sum(h["score"] for h in hits) / len(hits)
    confidence = round(min(0.96, avg_score * 0.8 + 0.2), 2)

    # 5. Audit log
    try:
        audit = AuditLog(
            user_id=user_id,
            action="chat",
            resource_type="chat",
            resource_id=0,
            details=json.dumps({
                "question": request.question,
                "machine_id": request.machine_id,
                "session_id": request.session_id,
                "citations_count": len(citations),
                "confidence": confidence
            })
        )
        db.add(audit)
        await db.commit()
    except Exception:
        pass

    return ChatResponse(
        answer=answer.strip(),
        citations=citations,
        confidence=confidence,
        created_at=datetime.utcnow()
    )
