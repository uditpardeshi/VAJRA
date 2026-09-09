"""Run once to ingest PDF manuals into ChromaDB: python -m app.db.ingest_manuals"""
import os
import sys
from pathlib import Path
from app.core.rag import rag_engine

MANUALS_DIR = Path(__file__).parent.parent.parent / "manuals"

MANUAL_MAP = {
    "HX-204": "HX-204_maintenance.pdf",
    "CNC-500": "CNC-500_maintenance.pdf",
    "LATHE-3": "LATHE-3_maintenance.pdf",
}

SAMPLE_MANUAL_DATA = {
    "HX-204": """Horizontal Machining Center HX-204 Maintenance Manual
Page 1: Overview & Specs
Spindle Speed: 12,000 RPM maximum. Tool Taper: BT40. Coolant Pressure: 20 bar.
Acceptable Spindle Runout: 5 um maximum allowable tolerance.
Oil Type: ISO VG 32. Bearing replacement interval: 8,000 operational hours.

Page 2: Troubleshooting & Repair Steps
If abnormal noise or spindle runout exceeds 5 um, lock out power and inspect spindle seal and bearing alignment.
Replace seal if worn. Reassemble housing cover and test run at 2,000 RPM increments.
""",
    "CNC-500": """Vertical Machining Center CNC-500 Maintenance Manual
Page 1: System Specifications
Spindle Speed: 15,000 RPM maximum. Tool Taper: HSK-A63. Coolant Pressure: 30 bar.
Acceptable Spindle Runout: 3 um maximum allowable tolerance.
Oil Type: ISO VG 46. Bearing replacement interval: 6,000 operational hours.

Page 2: Maintenance Protocol
Clean coolant filtration screens daily. Verify spindle cooling loop pressure is maintained at 30 bar.
Check spindle runout with dial indicator every 500 hours.
""",
    "LATHE-3": """CNC Lathe LATHE-3 Maintenance Manual
Page 1: Operating Parameters
Max Turning Diameter: 300 mm. Max Turning Length: 500 mm. Spindle Speed: 4,000 RPM.
Chuck Size: 10 inch. Tailstock Taper: MT4.
Acceptable Spindle Runout: 8 um maximum allowable tolerance.
Oil Type: ISO VG 68. Bearing replacement interval: 10,000 operational hours.

Page 2: Lubrication & Inspection
Inspect chuck hydraulic pressure daily. Change ISO VG 68 spindle oil every 2,000 operational hours.
Calibrate tailstock alignment quarterly.
"""
}

def generate_sample_pdf(pdf_path: Path, content: str):
    """Generates a minimal valid PDF file with content using pypdf / PyMuPDF if available."""
    try:
        from pymupdf import open as fitz_open
        doc = fitz_open()
        pages_text = content.split("\n\nPage ")
        for p_idx, page_text in enumerate(pages_text):
            text_to_write = page_text if p_idx == 0 else f"Page {page_text}"
            page = doc.new_page()
            page.insert_text((50, 50), text_to_write)
        doc.save(str(pdf_path))
        doc.close()
    except Exception:
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        pdf_path.write_text(content, encoding="utf-8")

def main():
    MANUALS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Scanning {MANUALS_DIR} for manuals...")
    total = 0
    for machine_id, filename in MANUAL_MAP.items():
        pdf_path = MANUALS_DIR / filename
        if not pdf_path.exists():
            print(f"  [INFO] Generating sample manual for {machine_id}: {filename}")
            generate_sample_pdf(pdf_path, SAMPLE_MANUAL_DATA[machine_id])
        
        count = rag_engine.ingest_pdf(machine_id, str(pdf_path))
        total += count
        print(f"  [OK] {machine_id}: {count} chunks from {filename}")
    
    stats = rag_engine.get_stats()
    print(f"\nIngestion complete. Total chunks: {stats['total_chunks']}")
    print(f"Machines indexed: {stats['machines']}")

if __name__ == "__main__":
    main()
