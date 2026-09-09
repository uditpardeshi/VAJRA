import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore, UserRole } from '@/store/authStore'
import type { WSMessage } from '@/types/api'

interface UseWebSocketOptions {
  role?: UserRole;
  userId?: number;
  enabled?: boolean;
  onMessage?: (msg: WSMessage) => void;
}

export function useWebSocket({ role = 'reviewer', userId = 1, enabled = true, onMessage }: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const { wsBase } = useAuthStore()

  const connect = useCallback(() => {
    if (!enabled) return
    try {
      const url = `${wsBase}/escalations?role=${role}&user_id=${userId}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data)
          setLastMessage(data)
          if (onMessage) onMessage(data)
        } catch {
          // ignore non-json messages
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        // Auto-reconnect after 3s
        setTimeout(() => connect(), 3000)
      }

      ws.onerror = () => {
        setIsConnected(false)
      }
    } catch (e) {
      console.warn('WS Connection Error:', e)
    }
  }, [wsBase, role, userId, enabled, onMessage])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return { isConnected, lastMessage }
}
