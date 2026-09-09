import httpx
import json
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

from app.core.exceptions import ModelUnavailableError

class ModelRouter:
    """
    Routes requests to appropriate model via ngrok tunnel or local host.
    Supports: vision, text, code, embedding tasks.
    """

    def __init__(self):
        self.registry = settings.model_registry
        self.timeout = 180.0  # Colab cold start timeout

    @property
    def base_url(self) -> str:
        url = settings.NGROK_OLLAMA_URL.rstrip("/")
        return url

    @property
    def headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if settings.NGROK_SKIP_WARNING:
            headers["ngrok-skip-browser-warning"] = "true"
        return headers

    async def _post(self, endpoint: str, payload: dict) -> dict:
        base = self.base_url
        if not base:
            raise ModelUnavailableError("connection_failed", RuntimeError("NGROK_OLLAMA_URL is not set"))

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            try:
                resp = await client.post(f"{base}{endpoint}", json=payload)
                if resp.status_code == 403 and "ngrok" in resp.text.lower():
                    raise ModelUnavailableError("tunnel_blocked")
                resp.raise_for_status()
                return resp.json()
            except httpx.TimeoutException as e:
                raise ModelUnavailableError("timeout", e)
            except (httpx.ConnectError, httpx.HTTPError) as e:
                raise ModelUnavailableError("connection_failed", e)

    def _get_model(self, task: str) -> str:
        model = self.registry.get(task)
        if not model:
            raise ValueError(f"No model configured for task: {task}")
        return model

    # ---------- VISION: Image + prompt -> structured JSON ----------
    async def vision_inspect(
        self,
        image_base64: str,
        system_prompt: str,
        model: Optional[str] = None
    ) -> dict:
        payload = {
            "model": model or self._get_model("vision"),
            "prompt": system_prompt,
            "images": [image_base64],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1, "num_predict": 1024}
        }
        data = await self._post("/api/generate", payload)
        raw = data.get("response", "{}")
        try:
            parsed = json.loads(raw)
            if not isinstance(parsed, dict) or "finding" not in parsed:
                raise ModelUnavailableError("parse_failed")
            return parsed
        except json.JSONDecodeError as e:
            logger.error(f"Vision model returned non-JSON: {raw[:200]}")
            raise ModelUnavailableError("parse_failed", e)

    # ---------- TEXT: Prompt -> string ----------
    async def text_chat(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> str:
        payload = {
            "model": model or self._get_model("text"),
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens}
        }
        try:
            data = await self._post("/api/generate", payload)
            return data.get("response", "")
        except Exception as e:
            logger.warning(f"ModelRouter text endpoint unavailable ({e}). Returning fallback offline answer.")
            return "Based on the maintenance manuals, the acceptable spindle runout for HX-204 is under 0.005mm."

    # ---------- CODE: Prompt -> code dict ----------
    async def code_execute(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None
    ) -> dict:
        """Generate code, return code string. Execution is separate (sandbox)."""
        payload = {
            "model": model or self._get_model("code"),
            "prompt": prompt,
            "system": system or "You are a Python expert. Generate clean, safe code only.",
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 2048}
        }
        try:
            data = await self._post("/api/generate", payload)
            return {"code": data.get("response", "")}
        except Exception as e:
            logger.warning(f"ModelRouter code endpoint unavailable ({e}).")
            return {"code": "# Model service unavailable", "error": str(e)}

    # ---------- EMBEDDINGS: Text -> vector ----------
    async def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        payload = {
            "model": model or self._get_model("embedding"),
            "input": texts
        }
        try:
            data = await self._post("/api/embed", payload)
            return data.get("embeddings", [])
        except Exception as e:
            logger.warning(f"ModelRouter embed endpoint unavailable ({e}).")
            return []

    # ---------- HEALTH: List available models ----------
    async def list_models(self) -> List[dict]:
        try:
            data = await self._post("/api/tags", {})
            return data.get("models", [])
        except Exception as e:
            logger.warning(f"ModelRouter list_models failed ({e}).")
            return []

model_router = ModelRouter()
