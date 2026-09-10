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

      const payload = {
        messages: [
          {
            role: 'user',
            content: req.question,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
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
