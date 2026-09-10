from fastapi import APIRouter, HTTPException, status
from app.core.security import create_ws_token

router = APIRouter(prefix="/api/v1", tags=["auth"])

@router.post("/auth/ws-token")
async def get_ws_token(request: dict):
    """Returns a short-lived JWT for WS auth.
    Request: {"user_id": 2, "role": "reviewer"}
    Response: {"token": "...", "expires_in": 300}
    """
    user_id = request.get("user_id")
    role = request.get("role")
    valid_roles = ("worker", "engineer", "reviewer", "admin")
    if user_id is None or role not in valid_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id and valid role required")
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id must be an integer")

    token = create_ws_token(user_id_int, role)
    return {"token": token, "expires_in": 300}
