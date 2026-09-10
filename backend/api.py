# ============================================================
# VAJRA | CALIBRATED INDUSTRIAL PC CLIENT
# ============================================================

import requests
import time
import re
import os

VAJRA_URL = "https://elmiest-julieta-unmelodramatically.ngrok-free.dev"
API_KEY = "VAJRA-2026-SECRET"

# In-Context Calibration System Prompt (No-Colab-Update Fine Tuning)
CALIBRATED_SYSTEM_PROMPT = """You are VAJRA, the sovereign AI Diagnostic & Calibration Engineer for industrial machining equipment.
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

Instruction Rules:
- When asked a question, provide direct, authoritative engineering answers immediately.
- If reasoning is needed, enclose internal step-by-step thoughts inside <think>...</think>.
- Ensure the final answer is structured, highly professional, and specifies exact measurements, tolerances, and corrective protocols.
- If asked about an equipment parameter, cite the exact OEM specification and relevant ISO standard."""

SHOW_TRACE = False  # Toggle reasoning trace display

def ask_vajra(message, show_trace=False):
    payload = {
        "messages": [
            {
                "role": "system",
                "content": CALIBRATED_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "max_tokens": 512,
        "temperature": 0.15,
        "top_p": 0.9
    }

    print("\n↑ Sending calibrated request to VAJRA...")
    start = time.time()

    response = requests.post(
        VAJRA_URL + "/api/chat",
        headers={
            "X-VAJRA-KEY": API_KEY,
            "ngrok-skip-browser-warning": "true"
        },
        json=payload,
        timeout=120
    )

    response.raise_for_status()
    data = response.json()
    elapsed = time.time() - start

    raw_answer = data["choices"][0]["message"]["content"]

    # Extract <think> reasoning if present
    think_match = re.search(r"<think>(.*?)</think>", raw_answer, re.DOTALL)
    clean_answer = re.sub(r"<think>.*?</think>", "", raw_answer, flags=re.DOTALL).strip()

    print(f"↓ Response received | {elapsed:.1f}s")

    if show_trace and think_match:
        print("\n--- [DIAGNOSTIC VERIFICATION TRACE] ---")
        print(think_match.group(1).strip())
        print("---------------------------------------\n")

    print("\nVAJRA:")
    print(clean_answer if clean_answer else raw_answer)


# ============================================================
# INTERACTIVE CLI
# ============================================================

if __name__ == "__main__":
    print("============================================================")
    print("⚡ VAJRA INDUSTRIAL CALIBRATION CLIENT (FINE-TUNED)")
    print("Target Node: " + VAJRA_URL)
    print("Commands: '/trace' (toggle think trace), '/specs' (view fleet tolerances), 'exit' (quit)")
    print("============================================================")

    while True:
        try:
            message = input("\nYou: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if not message:
            continue

        if message.lower() in ("exit", "quit"):
            break
        elif message.lower() == "/trace":
            SHOW_TRACE = not SHOW_TRACE
            print(f"⚙️ Diagnostic trace display: {'ON' if SHOW_TRACE else 'OFF'}")
            continue
        elif message.lower() == "/specs":
            print("\n--- [FLEET OEM CALIBRATION BASELINE] ---")
            print("• HX-204 (5-Axis VMC): Runout <= 0.005mm | Pressure: 20 bar | 12,000 RPM | ISO VG 32")
            print("• TM-300 (CNC Lathe): Runout <= 0.008mm | Pressure: 25-35 bar | 4,500 RPM")
            print("• GRIND-50 (Surface Grinder): Runout <= 0.002mm | Flow: 45 L/min")
            print("----------------------------------------")
            continue

        try:
            ask_vajra(message, show_trace=SHOW_TRACE)
        except Exception as e:
            print(f"\n❌ Request failed: {e}")