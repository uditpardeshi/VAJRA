import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
TOKEN_TTL_MINUTES = getattr(settings, "WS_TOKEN_TTL_MINUTES", 5)

def create_ws_token(user_id: int, role: str) -> str:
    """Short-lived JWT for WS auth (5 min)."""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES),
        "type": "ws"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_ws_token(token: str) -> dict:
    """Validate JWT, return {user_id, role}. Raises on invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "ws":
            raise ValueError("Invalid token type")
        return {"user_id": payload["user_id"], "role": payload["role"]}
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
