import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { api, DEFAULT_MODEL_URL, DEFAULT_API_KEY } from '@/config/api'
import { useAuthStore } from '@/store/authStore'
import type { ChatRequest, ChatResponse } from '@/types/api'

export function useChat() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: async (req) => {
      // 1. First attempt: on-premise backend RAG chat
      try {
        const res = await api.post<ChatResponse>('/chat', req, { timeout: 90000 })
        if (res.data && res.data.answer) {
          return res.data
        }
      } catch (backendErr) {
        console.warn('Backend /chat unreachable or timed out, falling back to direct ngrok model endpoint:', backendErr)
      }

      // 2. Direct model endpoint via ngrok URL (referenced from backend/api.py)
      const { modelUrl, apiKey } = useAuthStore.getState()
      const targetModelUrl = (modelUrl || DEFAULT_MODEL_URL).replace(/\/$/, '')
      const key = apiKey || DEFAULT_API_KEY

      const isReasoning = req.reasoning !== false
      const directMessages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: isReasoning
            ? 'You are VAJRA, an expert industrial AI engineering reasoning engine. Perform a structured multi-step engineering analysis with exact tolerances, safety protocols, and step-by-step resolution.'
            : 'You are VAJRA, an expert industrial maintenance assistant. Provide a direct, concise, and immediately actionable answer with exact specifications without verbose preliminary reasoning.',
        },
      ]

      if (req.history && req.history.length > 0) {
        req.history.slice(-8).forEach((h) => {
          directMessages.push({ role: h.role, content: h.content })
        })
      }
      directMessages.push({ role: 'user', content: req.question })

      const payload = {
        messages: directMessages,
        max_tokens: isReasoning ? 1536 : 768,
        temperature: isReasoning ? 0.4 : 0.2,
      }

      const directRes = await axios.post(
        `${targetModelUrl}/api/chat`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VAJRA-KEY': key,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 120000,
        }
      )

      const answer =
        directRes.data?.choices?.[0]?.message?.content ||
        directRes.data?.answer ||
        directRes.data?.response ||
        (typeof directRes.data === 'string' ? directRes.data : JSON.stringify(directRes.data))

      return {
        answer,
        citations: [],
        confidence: 0.95,
        created_at: new Date().toISOString(),
      }
    },
  })
}
