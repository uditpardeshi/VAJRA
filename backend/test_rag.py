# test_rag.py - Run after ingestion: python test_rag.py
import httpx
import sys
import asyncio

BASE = "http://localhost:8000/api/v1"

def test_chat():
    r = httpx.post(f"{BASE}/chat", json={
        "question": "What is the acceptable spindle runout for HX-204?",
        "machine_id": "HX-204",
        "top_k": 3
    }, timeout=30)
    
    assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
    data = r.json()
    required = ["answer", "citations", "confidence", "created_at"]
    for k in required:
        assert k in data, f"Missing key: {k}"
    assert isinstance(data["citations"], list)
    assert 0 <= data["confidence"] <= 1
    print(f"✅ Chat: confidence={data['confidence']}, citations={len(data['citations'])}")
    print(f"   Answer: {data['answer'][:100]}...")
    for c in data["citations"]:
        print(f"   📄 {c['machine_id']} p.{c['source_page']} (score={c['score']})")
    return True

def test_chat_no_filter():
    r = httpx.post(f"{BASE}/chat", json={
        "question": "What oil type for CNC machines?",
        "top_k": 5
    }, timeout=30)
    assert r.status_code == 200
    data = r.json()
    print(f"✅ Chat (no filter): {len(data['citations'])} citations")
    return True

if __name__ == "__main__":
    try:
        test_chat()
        test_chat_no_filter()
        print("\n🎉 RAG SMOKE TESTS PASSED")
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
