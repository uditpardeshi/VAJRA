import json
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.tables import AuditLog, ChatMessageRecord
from app.core.model_router import model_router
from app.core.rag_multimodal import multimodal_rag
from app.schemas.chat import ChatRequest, ChatResponse, Citation

SYSTEM_PROMPT_REASONING = """You are VAJRA, the sovereign AI Diagnostic & Calibration Engineer for industrial machining equipment.
You possess definitive OEM specifications for the machine fleet:
1. UNIT HX-204 (5-Axis Precision Vertical Machining Center):
   - Max Acceptable Spindle Runout: <= 0.005 mm (5.0 um) at spindle taper (ISO 230-2 / DIN 8605).
   - Hydraulic / Coolant Pressure: 20 bar nominal (operating range: 18 - 25 bar).
   - Spindle Speed Limit: 12,000 RPM direct-drive.
   - Lubricant: ISO VG 32 synthetic spindle oil.
   - Bearing Service Milestone: 4,000 operational hours.
2. UNIT TM-300 (CNC Lathe):
   - Spindle Runout: <= 0.008 mm. Chuck Clamping Pressure: 25-35 bar. Max RPM: 4,500.
3. UNIT GRIND-50 (Surface Grinder):
   - Wheel Runout: <= 0.002 mm. Coolant: Flow rate 45 L/min.

Structure your response with clear, visually distinct sections:
1. **Diagnosis & Parameter Identification**: Identify machine components, nominal values, and symptom roots.
2. **OEM Specification & Verification**: Cross-reference acceptable limits, dial indicator/torque specs, and tolerances.
3. **Risk & Safety Assessment**: Note safety hazards, lockout/tagout (LOTO) rules, or catastrophic failure risks.
4. **Step-by-Step Action Plan**: Provide numbered, actionable resolution steps with exact tools and lubricants.

Rules:
- Enclose internal technical reflections inside <think>...</think>.
- Cite sources clearly with [document_name, page/section X] when available.
- Always state exact values (tolerances in μm/mm, pressures in bar/PSI, torque in Nm, speeds in RPM).
- Maintain full continuity with all previous context discussed in this specific chat thread."""

SYSTEM_PROMPT_DIRECT = """You are VAJRA, the sovereign AI Diagnostic & Calibration Engineer for industrial machining equipment.
You possess definitive OEM specifications for the machine fleet:
1. UNIT HX-204 (5-Axis Precision Vertical Machining Center):
   - Max Acceptable Spindle Runout: <= 0.005 mm (5.0 um) (ISO 230-2 / DIN 8605).
   - Hydraulic / Coolant Pressure: 20 bar nominal (range: 18-25 bar).
   - Spindle Speed Limit: 12,000 RPM. Lubricant: ISO VG 32 synthetic spindle oil.
2. UNIT TM-300 (CNC Lathe): Spindle Runout <= 0.008 mm. Clamping: 25-35 bar. Max RPM: 4,500.
3. UNIT GRIND-50 (Surface Grinder): Wheel Runout <= 0.002 mm.

Provide a direct, concise, and immediately actionable answer to the technician's inquiry without preliminary rambling.
- State exact specifications, measurements, tolerances, and steps clearly and succinctly.
- Do NOT output <think> tags. Provide the final diagnostic solution directly.
- Maintain full continuity with all previous context discussed in this specific chat thread."""

async def chat_with_rag(
    db: AsyncSession,
    request: ChatRequest,
    user_id: int = 1
) -> ChatResponse:
    # 1. Retrieve prior session history for this specific chat thread
    session_id = request.session_id or "default-session"
    history_turns: List[Dict[str, str]] = []

    # If caller supplied history, prioritize it; otherwise fetch from DB
    if request.history:
        for item in request.history:
            history_turns.append({"role": item.role, "content": item.content})
    else:
        res = await db.execute(
            select(ChatMessageRecord)
            .where(ChatMessageRecord.session_id == session_id)
            .order_by(ChatMessageRecord.created_at.asc())
            .limit(20)
        )
        for msg in res.scalars().all():
            history_turns.append({"role": msg.role, "content": msg.content})

    # 2. Retrieve relevant chunks from both session-attached files and machine manuals
    hits = multimodal_rag.search(
        query=request.question,
        machine_id=request.machine_id,
        session_id=session_id,
        top_k=request.top_k
    )

    system = SYSTEM_PROMPT_REASONING if request.reasoning else SYSTEM_PROMPT_DIRECT

    context_parts = []
    citations: List[Citation] = []

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

    # 3. Assemble full prompt and conversation turns
    if hits:
        context = "\n\n---\n\n".join(context_parts)
        user_turn_content = f"DOCUMENT CONTEXT:\n{context}\n\nQUESTION: {request.question}"
    else:
        user_turn_content = request.question

    # Construct complete multi-turn message history
    messages_payload: List[Dict[str, str]] = [
        {"role": "system", "content": system}
    ]
    # Add earlier turns (up to last 10 messages for token budget)
    if history_turns:
        for turn in history_turns[-10:]:
            messages_payload.append({"role": turn["role"], "content": turn["content"]})
    # Add current question turn
    messages_payload.append({"role": "user", "content": user_turn_content})

    # 4. Invoke model via router
    temp = 0.2 if request.reasoning else 0.15
    max_tok = 1024 if request.reasoning else 512

    raw_answer = await model_router.text_chat(
        prompt=user_turn_content,
        system=system,
        temperature=temp,
        max_tokens=max_tok,
        messages=messages_payload
    )

    # Process reasoning <think> tags based on request.reasoning toggle
    import re
    if not request.reasoning:
        # Strip all think tags so technician receives direct solution
        answer = re.sub(r"<think>.*?</think>", "", raw_answer, flags=re.DOTALL).strip()
        if not answer:
            answer = raw_answer.strip()
    else:
        answer = raw_answer.strip()

    # 5. Compute confidence heuristic
    if hits:
        avg_score = sum(h["score"] for h in hits) / len(hits)
        confidence = round(min(0.96, avg_score * 0.8 + 0.2), 2)
    else:
        confidence = 0.85

    now = datetime.utcnow()

    # 6. Save conversational memory into ChatMessageRecord for this session
    try:
        user_msg_record = ChatMessageRecord(
            session_id=session_id,
            role="user",
            content=request.question,
            citations_json=None,
            confidence=None,
            created_at=now
        )
        assistant_msg_record = ChatMessageRecord(
            session_id=session_id,
            role="assistant",
            content=answer.strip(),
            citations_json=json.dumps([c.model_dump() for c in citations]) if citations else None,
            confidence=confidence,
            created_at=now
        )
        db.add(user_msg_record)
        db.add(assistant_msg_record)

        # 7. Audit log entry
        audit = AuditLog(
            user_id=user_id,
            action="chat",
            resource_type="chat",
            resource_id=0,
            details=json.dumps({
                "question": request.question,
                "machine_id": request.machine_id,
                "session_id": session_id,
                "reasoning": request.reasoning,
                "source": request.source,
                "voice_confidence": request.voice_confidence,
                "voice_language": request.language,
                "citations_count": len(citations),
                "confidence": confidence
            }),
            voice_source=request.source,
            voice_confidence=request.voice_confidence,
            voice_language=request.language,
            created_at=now
        )
        db.add(audit)
        await db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception(f"Failed to persist chat message: {e}")
        await db.rollback()

    return ChatResponse(
        answer=answer.strip(),
        citations=citations,
        confidence=confidence,
        created_at=now
    )
