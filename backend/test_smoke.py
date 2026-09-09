import base64
import httpx
import json
import sys
import asyncio

BASE = "http://localhost:8000/api/v1"
ROOT = "http://localhost:8000"

# 1x1 pixel JPEG base64 (tiny test image)
TINY_JPEG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AB//2Q=="

def test_health():
    r = httpx.get(f"{ROOT}/health", timeout=5)
    assert r.status_code == 200 and r.json()["status"] == "ok"
    print("✅ Health check")

def test_machines():
    r = httpx.get(f"{BASE}/machines", timeout=5)
    assert r.status_code == 200
    machines = r.json()["machines"]
    assert len(machines) == 3
    ids = {m["machine_id"] for m in machines}
    assert ids == {"HX-204", "CNC-500", "LATHE-3"}
    print(f"✅ Machines: {ids}")

def test_inspect():
    r = httpx.post(f"{BASE}/inspect", json={
        "machine_id": "HX-204",
        "image_base64": TINY_JPEG
    }, timeout=180)  # Colab cold start timeout
    
    assert r.status_code == 201, f"Status {r.status_code}: {r.text}"
    data = r.json()
    required = ["inspection_id", "machine_id", "finding", "confidence", "defect_location", "repair_steps", "needs_escalation", "created_at"]
    for k in required:
        assert k in data, f"Missing key: {k}"
    assert 0 <= data["confidence"] <= 1
    assert isinstance(data["repair_steps"], list)
    assert isinstance(data["needs_escalation"], bool)
    print(f"✅ Inspect: id={data['inspection_id']}, confidence={data['confidence']}, escalation={data['needs_escalation']}")
    return data["inspection_id"]

async def test_db_persisted(inspection_id: int):
    import aiosqlite
    async with aiosqlite.connect("sovereign.db") as db:
        cur = await db.execute("SELECT finding, confidence, needs_escalation FROM inspections WHERE id=?", (inspection_id,))
        row = await cur.fetchone()
        assert row, "Inspection not in DB"
        print(f"✅ DB inspection: finding={row[0][:40]}..., conf={row[1]}, esc={row[2]}")
        
        cur = await db.execute("SELECT id, status FROM tickets WHERE inspection_id=?", (inspection_id,))
        ticket = await cur.fetchone()
        if ticket:
            print(f"✅ Ticket auto-created: id={ticket[0]}, status={ticket[1]}")
        else:
            print("ℹ️ No ticket (confidence <= 0.5 or finding='normal')")
        
        cur = await db.execute("SELECT action, resource_type FROM audit_log WHERE resource_id=?", (inspection_id,))
        audit = await cur.fetchone()
        assert audit and audit[0] == "inspect"
        print(f"✅ Audit log: {audit}")

if __name__ == "__main__":
    try:
        test_health()
        test_machines()
        insp_id = test_inspect()
        asyncio.run(test_db_persisted(insp_id))
        print("\n🎉 ALL SMOKE TESTS PASSED")
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
