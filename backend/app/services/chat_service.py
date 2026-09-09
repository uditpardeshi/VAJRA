import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tables import AuditLog
from app.core.model_router import model_router
from app.core.rag import rag_engine
from app.schemas.chat import ChatRequest, ChatResponse, Citation

SYSTEM_PROMPT = """You are an expert industrial maintenance engineer. Answer questions using ONLY the provided context from manufacturing manuals.
- Cite sources with [machine_id, page X] format
- If context doesn't contain the answer, say "Information not found in available manuals"
- Be concise and technical
- Include specific values (tolerances, pressures, intervals) when available"""

async def chat_with_rag(
    db: AsyncSession,
    request: ChatRequest,
    user_id: int = 1
) -> ChatResponse:
    # 1. Retrieve relevant chunks
    hits = rag_engine.search(request.question, request.machine_id, request.top_k)
    
    if not hits:
        return ChatResponse(
            answer="No relevant information found in the knowledge base.",
            citations=[],
            confidence=0.0,
            created_at=datetime.utcnow()
        )
    
    # 2. Build context
    context_parts = []
    citations = []
    for h in hits:
        context_parts.append(f"[SOURCE: {h['machine_id']}, PAGE {h['source_page']}]\n{h['text']}")
        citations.append(Citation(
            machine_id=h["machine_id"],
            source_page=h["source_page"],
            text_snippet=h["text"][:200] + "..." if len(h["text"]) > 200 else h["text"],
            score=round(h["score"], 3)
        ))
    
    context = "\n\n---\n\n".join(context_parts)
    prompt = f"CONTEXT:\n{context}\n\nQUESTION: {request.question}\n\nANSWER:"
    
    # 3. Call text model
    answer = await model_router.text_chat(prompt, system=SYSTEM_PROMPT, temperature=0.2)
    
    # 4. Confidence heuristic: avg retrieval score * 0.8 + 0.2
    avg_score = sum(h["score"] for h in hits) / len(hits)
    confidence = round(min(0.95, avg_score * 0.8 + 0.2), 2)
    
    # 5. Audit log
    audit = AuditLog(
        user_id=user_id,
        action="chat",
        resource_type="chat",
        resource_id=0,
        details=json.dumps({
            "question": request.question,
            "machine_id": request.machine_id,
            "citations_count": len(citations),
            "confidence": confidence
        })
    )
    db.add(audit)
    await db.commit()
    
    return ChatResponse(
        answer=answer.strip(),
        citations=citations,
        confidence=confidence,
        created_at=datetime.utcnow()
    )
