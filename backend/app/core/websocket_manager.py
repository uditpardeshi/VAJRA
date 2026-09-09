"""WebSocket connection manager for real-time alerts."""
from typing import Dict, Set, List
from fastapi import WebSocket
import json
import logging
from app.schemas.escalation import WSMessage

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        # role -> set of websockets
        self.connections: Dict[str, Set[WebSocket]] = {
            "reviewer": set(),
            "admin": set(),
            "engineer": set(),
        }
        # user_id -> websocket (for targeted messages)
        self.user_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, role: str, user_id: int):
        await websocket.accept()
        self.connections.setdefault(role, set()).add(websocket)
        self.user_connections[user_id] = websocket
        logger.info(f"WS connected: user={user_id}, role={role}, total={self.total_connections()}")

    def disconnect(self, websocket: WebSocket, role: str, user_id: int):
        self.connections.get(role, set()).discard(websocket)
        self.user_connections.pop(user_id, None)
        logger.info(f"WS disconnected: user={user_id}, role={role}, total={self.total_connections()}")

    def total_connections(self) -> int:
        return sum(len(s) for s in self.connections.values())

    async def broadcast_to_role(self, role: str, message: WSMessage):
        """Send to all connections with given role."""
        dead = set()
        for ws in self.connections.get(role, set()):
            try:
                await ws.send_text(message.model_dump_json())
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.connections[role].discard(ws)

    async def broadcast_all(self, message: WSMessage):
        for role in self.connections:
            await self.broadcast_to_role(role, message)

    async def send_to_user(self, user_id: int, message: WSMessage):
        ws = self.user_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(message.model_dump_json())
            except Exception:
                pass

ws_manager = WebSocketManager()
