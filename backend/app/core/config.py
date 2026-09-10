from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Dict

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # ngrok tunnel to Colab / Model endpoint
    NGROK_OLLAMA_URL: str = "https://elmiest-julieta-unmelodramatically.ngrok-free.dev"
    NGROK_SKIP_WARNING: bool = True
    VAJRA_API_KEY: str = "VAJRA-2026-SECRET"

    # Model registry (task -> model name)
    MODEL_VISION: str = "qwen2-vl"
    MODEL_TEXT: str = "llama3.2"
    MODEL_CODE: str = "codellama"
    MODEL_EMBEDDING: str = "nomic-embed-text"

    @property
    def model_registry(self) -> Dict[str, str]:
        return {
            "vision": self.MODEL_VISION,
            "text": self.MODEL_TEXT,
            "code": self.MODEL_CODE,
            "embedding": self.MODEL_EMBEDDING,
        }

    DATABASE_URL: str = "sqlite+aiosqlite:///./sovereign.db"
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    SECRET_KEY: str = "sovereign-demo-secret-change-me-prod"
    WS_TOKEN_TTL_MINUTES: int = 5

    # Multimodal RAG (RAG-Anything) settings
    RAG_MODE: str = "multimodal"  # "multimodal" | "chroma"
    RAG_STORAGE_DIR: str = "./rag_storage"
    ENABLE_MULTIMODAL_EXTRACTION: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
