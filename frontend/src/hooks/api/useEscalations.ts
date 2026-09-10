import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { Escalation } from '@/types/api'

export function usePendingEscalations() {
  return useQuery<Escalation[]>({
    queryKey: ['escalations', 'pending'],
    queryFn: async () => {
      const res = await api.get<any>('/escalations/pending')
      if (Array.isArray(res.data)) return res.data
      if (res.data && Array.isArray(res.data.escalations)) return res.data.escalations
      return []
    },
  })
}

export function useAllEscalations() {
  return useQuery<Escalation[]>({
    queryKey: ['escalations', 'all'],
    queryFn: async () => {
      const res = await api.get<any>('/escalations')
      if (Array.isArray(res.data)) return res.data
      if (res.data && Array.isArray(res.data.escalations)) return res.data.escalations
      return []
    },
  })
}

export function useAcknowledgeEscalation() {
  const queryClient = useQueryClient()
  return useMutation<Escalation, Error, { escalation_id: number; user_id: number; user_name?: string }>({
    mutationFn: async ({ escalation_id, user_id }) => {
      const res = await api.post<Escalation>(`/escalations/${escalation_id}/acknowledge`, {
        reviewer_id: user_id,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
    },
  })
}

export function useResolveEscalation() {
  const queryClient = useQueryClient()
  return useMutation<Escalation, Error, { escalation_id: number; user_id: number; user_name?: string; note?: string }>({
    mutationFn: async ({ escalation_id, user_id, note }) => {
      const res = await api.post<Escalation>(`/escalations/${escalation_id}/resolve`, {
        reviewer_id: user_id,
        resolution_note: note || 'Resolved by reviewer',
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
    },
  })
}
