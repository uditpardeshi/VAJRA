"""WebSocket connection manager for real-time alerts with JWT auth and ACK reliability."""
import json
import uuid
import asyncio
import logging
from typing import Dict, Set, Optional, Any, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class PendingMessage:
    """Track unacked message for retry."""
    def __init__(self, msg_id: str, data: str, max_retries: int = 3, retry_delay: float = 2.0):
        self.msg_id = msg_id
        self.data = data
        self.retries = 0
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def should_retry(self) -> bool:
        return self.retries < self.max_retries

    def increment(self):
        self.retries += 1


class WebSocketManager:
    def __init__(self):
        # role -> set of websockets
        self.connections: Dict[str, Set[WebSocket]] = {
            "worker": set(),
            "engineer": set(),
            "reviewer": set(),
            "admin": set(),
        }
        # user_id -> websocket (for targeted messages)
        self.user_connections: Dict[int, WebSocket] = {}
        # websocket -> msg_id -> PendingMessage
        self.pending: Dict[WebSocket, Dict[str, PendingMessage]] = {}

    async def connect(self, websocket: WebSocket, role: str, user_id: int):
        await websocket.accept()
        self.connections.setdefault(role, set()).add(websocket)
        self.user_connections[user_id] = websocket
        self.pending[websocket] = {}
        logger.info(f"WS connected: user={user_id}, role={role}, total={self.total_connections()}")

    def disconnect(self, websocket: WebSocket, role: str, user_id: int):
        self.connections.get(role, set()).discard(websocket)
        self.user_connections.pop(user_id, None)
        self.pending.pop(websocket, None)
        logger.info(f"WS disconnected: user={user_id}, role={role}, total={self.total_connections()}")

    def total_connections(self) -> int:
        return sum(len(s) for s in self.connections.values())

    def _add_msg_id(self, msg: dict) -> dict:
        """Attach msg_id to outgoing message if missing."""
        msg_copy = dict(msg)
        if "msg_id" not in msg_copy:
            msg_copy["msg_id"] = str(uuid.uuid4())
        return msg_copy

    def _normalize_msg(self, message: Any) -> dict:
        if hasattr(message, "model_dump"):
            return message.model_dump()
        elif isinstance(message, dict):
            return dict(message)
        else:
            return {"payload": str(message)}

    async def _ack_received(self, websocket: WebSocket, msg_id: str):
        """Called when client sends an ACK message."""
        if websocket in self.pending and msg_id:
            self.pending[websocket].pop(msg_id, None)
            logger.debug(f"ACK received for msg_id={msg_id}")

    async def _wait_for_ack(self, websocket: WebSocket, msg_id: str, timeout: float = 2.0) -> bool:
        """Wait up to timeout for msg_id to be removed from pending dictionary via ACK."""
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < timeout:
            if websocket not in self.pending or msg_id not in self.pending[websocket]:
                return True
            await asyncio.sleep(0.05)
        return False

    async def send_json(self, websocket: WebSocket, msg: dict):
        """Send with ACK tracking + retry loop."""
        msg = self._add_msg_id(msg)
        data = json.dumps(msg)
        pending = PendingMessage(msg["msg_id"], data)
        if websocket not in self.pending:
            self.pending[websocket] = {}
        self.pending[websocket][msg["msg_id"]] = pending

        for attempt in range(pending.max_retries):
            try:
                await websocket.send_text(data)
                ack_ok = await self._wait_for_ack(websocket, msg["msg_id"], timeout=2.0)
                if ack_ok:
                    return
                pending.increment()
                logger.warning(f"Msg {msg['msg_id']} not acked (attempt {attempt+1})")
            except Exception as e:
                logger.error(f"Send failed for {msg['msg_id']}: {e}")
                break

        if websocket in self.pending:
            self.pending[websocket].pop(msg["msg_id"], None)
        logger.error(f"Msg {msg['msg_id']} dropped after {pending.max_retries} attempts")

    async def broadcast_to_role(self, role: str, message: Any):
        """Send to all connections with given role."""
        msg_dict = self._normalize_msg(message)
        tasks = []
        dead = set()
        for ws in list(self.connections.get(role, set())):
            try:
                tasks.append(asyncio.create_task(self.send_json(ws, msg_dict)))
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.connections[role].discard(ws)
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast_all(self, message: Any):
        msg_dict = self._normalize_msg(message)
        for role in list(self.connections.keys()):
            await self.broadcast_to_role(role, msg_dict)

    async def send_to_user(self, user_id: int, message: Any):
        msg_dict = self._normalize_msg(message)
        ws = self.user_connections.get(user_id)
        if ws:
            await self.send_json(ws, msg_dict)

ws_manager = WebSocketManager()
