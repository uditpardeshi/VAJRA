import { useMutation } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { ChatRequest, ChatResponse } from '@/types/api'

export function useChat() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: async (req) => {
      const res = await api.post<ChatResponse>('/chat', req)
      return res.data
    },
  })
}
