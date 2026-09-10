# Product Requirements Document

## Sovereign On-Premise Agentic AI Workbench
### Using Open-Weight Multimodal LLMs for Confidential Industrial Work

---

## 1. Overview

An AI-powered workbench that runs entirely inside an organization's own
local network — no cloud, no internet dependency — enabling industries
with confidential data (manufacturing, pharma, defense, healthcare) to
use AI-assisted inspection, troubleshooting, and reporting without any
risk of data leaving their premises.

---

## 2. Problem Statement

Industries handling highly confidential data cannot use mainstream
cloud AI tools (ChatGPT, Gemini, Claude) because these tools transmit
user data — including images of equipment, internal documents, and
queries — to third-party servers over the internet.

This creates two blockers:
- **Data leak risk** — confidential designs, formulas, or records could
  be exposed
- **Compliance/legal risk** — many regulated industries are prohibited
  from sending data outside their own premises

As a result, workers in these industries are unable to access AI
assistance for tasks like equipment troubleshooting, referencing
manuals, or logging maintenance issues — despite clear potential
benefit.

---

## 3. Proposed Solution

A workbench where the AI model, document knowledge base, and all
processing run **locally**, inside the organization's own network.
Workers interact via mobile devices connected over local WiFi; nothing
is ever sent to the internet.

Core capabilities:
- Visual equipment inspection via phone camera
- AI-guided repair instructions overlaid on the camera feed (AR-style)
- Question-answering grounded in the company's own private manuals/SOPs
- Automatic ticket creation and escalation when needed
- A manager dashboard for oversight and trend tracking

---

## 4. Target Users / Roles

| Role | Description | Primary Needs |
|---|---|---|
| Worker | Frontline staff on the floor | Fast, visual, minimal-friction answers |
| Manager/Supervisor | Oversees operations | Visibility into issues, trends, escalations |

Both roles share the same backend and AI model; only the frontend
differs per role.

---

## 5. Architecture

- **Server (on-premise "brain")**: A laptop/workstation hosts the AI
  model (via Ollama) and backend (FastAPI). This plays the role of the
  organization's private server.
- **Client (worker/manager device)**: A phone/tablet connects to the
  server over the same local WiFi/LAN — no internet required. Accessed
  via a browser-based PWA.
- **Data flow**: All requests (image, text, voice) go from
  device → local server → local model/RAG → response back to device.
  At no point does data leave the local network.

This directly mirrors real-world deployment: the laptop becomes a
proper on-premise server, and worker devices become their handheld
clients — just demoed at a smaller scale.

---

## 6. Hero Features

Selected from a larger feature list based on two criteria: **real
practical value on the floor**, and **clarity of impact in a demo**.

### 6.1 AI Camera Inspection
Worker points their phone camera at equipment. The image is sent to
the local multimodal LLM, which analyzes it against known
specifications/manual data and reports whether the equipment looks
normal or has a detected issue.

### 6.2 Live AR Guidance
When an issue is detected, the camera view is overlaid (via HTML5
Canvas) with a marker/arrow pointing to the exact problem area, along
with step-by-step repair instructions shown directly on screen.

### 6.3 Local RAG over Confidential Documents
Company manuals, SOPs, and maintenance logs are indexed into a local
vector database (ChromaDB). When a worker asks a question or the AI
needs context, it retrieves relevant sections from these documents
rather than relying on the model's general knowledge — keeping answers
accurate and fully private.

### 6.4 Agentic Actions (Ticket Creation)
Beyond just answering, the AI can take action — automatically creating
a maintenance ticket in the system database when an issue is
confirmed, without requiring the worker to fill out a form.

### 6.5 Confidence-Based Escalation
Every AI response includes a confidence score. If confidence is low
(an uncertain or high-risk case), the system automatically escalates
the case to a human supervisor rather than letting the AI proceed
alone.

### 6.6 Manager Analytics Dashboard
A separate dashboard aggregates all worker activity — tickets raised,
escalations, and trends such as which machines fail most often and
average repair time — giving managers visibility without needing to be
on the floor.

### 6.7 100% On-Premise / Zero Cloud
The foundation underlying every other feature: all inference, storage,
and processing happen inside the local network. No component makes an
external API/internet call.

---

## 7. End-to-End Workflow

```
Worker opens phone app (connected to laptop server via local WiFi)
        ↓
Points camera at machine  →  [AI Camera Inspection]
        ↓
AI analyzes image + cross-checks local manual (RAG)
        ↓
Issue found?
   ├── No  → "All Normal" shown, flow ends
   └── Yes → AR overlay shows exact spot + repair steps  [Live AR Guidance]
              ↓
        AI checks its own confidence  [Confidence-Based Escalation]
              ↓
        Confidence high?
           ├── Yes → Auto-creates maintenance ticket  [Agentic Actions]
           └── No  → Escalates to supervisor immediately
              ↓
        Manager sees ticket/escalation live on dashboard  [Manager Dashboard]
        ↓
        All of the above occurs with zero internet/cloud involvement
```

---

## 8. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| AI Model | Ollama + Qwen2-VL / LLaVA (multimodal), Llama 3.2 (lightweight text) | Local model inference, no cloud calls |
| Backend | FastAPI (Python) | Wraps Ollama, exposes REST endpoints, handles WebSockets |
| RAG | ChromaDB + sentence-transformers | Local vector search over confidential documents |
| Database | SQLite | Stores tickets, escalations, audit logs, machine data |
| Worker Frontend | React (Vite) + Tailwind, PWA | Mobile-friendly, installable without app store |
| AR Overlay | HTML5 Canvas | Lightweight overlay on camera feed, no native AR SDK needed |
| Manager Dashboard | Same React app, separate role-based route + Recharts | Analytics and trend visualization |
| Real-Time Updates | WebSockets | Live dashboard updates as workers interact with the system |
| Voice (stretch) | Web Speech API | Hands-free interaction, browser-native |
| Networking | Local IP over WiFi/LAN (e.g. laptop at 192.168.x.x:8000) | Zero internet dependency |

All components are free and open-source, reinforcing the sovereignty
pitch even at the tooling level.

---

## 9. Non-Functional Requirements

- **Privacy**: No data (image, text, voice, documents) leaves the local
  network at any point.
- **Offline capability**: The entire workflow must function without
  internet access.
- **Low latency**: Given on-device/on-laptop inference, responses
  should remain fast enough for real-time interaction during a demo.
- **Simplicity of demo setup**: The full system should run on a single
  laptop + a single phone, connected over local WiFi, without
  additional infrastructure.

---

## 10. Out of Scope (for Hackathon MVP)

- Full native AR SDK integration (ARKit/ARCore)
- Admin role and full user management system
- Multi-server/distributed deployment
- Production-grade security hardening
- Support for more than a small number of simultaneous users

---

## 11. Success Criteria (Demo)

The demo is considered successful if it can show, end-to-end:
1. A worker scanning equipment and getting an AI-generated diagnosis
2. AR-style overlay guidance for a detected issue
3. An answer sourced from a private/local document via RAG
4. An automatically created ticket or escalation
5. That ticket/escalation appearing live on the manager dashboard
6. All of the above with no internet connection active

---

## 12. Open Questions

- Specific target industry/use case for the demo (manufacturing,
  pharma, defense, etc.) — not yet finalized
- Final decision on which stretch features (voice, QR/NFC scan) make
  it into the MVP given time constraints
