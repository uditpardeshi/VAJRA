# Sovereign AI Workbench — Backend

## Prerequisites
- Python 3.11+
- **Google Colab** running Ollama with models:
  ```bash
  # In Colab notebook:
  !curl -fsSL https://ollama.com/install.sh | sh
  !ollama serve &
  !ollama pull qwen2-vl
  !ollama pull llama3.2
  !ollama pull codellama
  !ollama pull nomic-embed-text
  # Expose via ngrok:
  !ngrok http 11434
  ```
- Copy ngrok HTTPS URL to backend `.env` as `NGROK_OLLAMA_URL`

## Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set NGROK_OLLAMA_URL=https://xxxx.ngrok-free.app
```

## Run
```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Test
```bash
# Automated smoke test
python test_smoke.py

# Contract tests
.\.venv\Scripts\pytest tests/test_inspect.py -v

# Manual curl
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/machines

# Real image test
python -c "
import base64
with open('test_machine.jpg', 'rb') as f:
    print(base64.b64encode(f.read()).decode())
" > img.b64

curl -X POST http://localhost:8000/api/v1/inspect \
  -H "Content-Type: application/json" \
  -d "{\"machine_id\": \"HX-204\", \"image_base64\": \"$(cat img.b64)\"}"
```

## Network Access (Phone on same WiFi)
1. Find laptop IP: `ipconfig` (Windows) / `hostname -I` (Linux/Mac)
2. Phone browser: `http://<LAPTOP_IP>:8000/docs` -> Swagger UI
3. Frontend calls `http://<LAPTOP_IP>:8000/api/v1/inspect`

## Model Switching
Edit `.env` to change models per task:
```env
MODEL_VISION=qwen2-vl
MODEL_TEXT=llama3.2
MODEL_CODE=codellama
MODEL_EMBEDDING=nomic-embed-text
```
No code changes needed — router reads directly from configuration.
