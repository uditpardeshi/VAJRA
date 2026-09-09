import { useMutation } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { InspectRequest, InspectResponse } from '@/types/api'

export function useInspect() {
  return useMutation<InspectResponse, Error, InspectRequest>({
    mutationFn: async (req) => {
      const res = await api.post<InspectResponse>('/inspect', req)
      return res.data
    },
  })
}
