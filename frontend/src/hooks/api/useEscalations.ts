import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { Escalation } from '@/types/api'

export function usePendingEscalations() {
  return useQuery<Escalation[]>({
    queryKey: ['escalations', 'pending'],
    queryFn: async () => {
      const res = await api.get<Escalation[]>('/escalations/pending')
      return res.data
    },
  })
}

export function useAllEscalations() {
  return useQuery<Escalation[]>({
    queryKey: ['escalations', 'all'],
    queryFn: async () => {
      const res = await api.get<Escalation[]>('/escalations')
      return res.data
    },
  })
}

export function useAcknowledgeEscalation() {
  const queryClient = useQueryClient()
  return useMutation<Escalation, Error, { escalation_id: number; user_id: number; user_name: string }>({
    mutationFn: async ({ escalation_id, user_id, user_name }) => {
      const res = await api.post<Escalation>(`/escalations/${escalation_id}/acknowledge`, null, {
        params: { user_id, user_name }
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
  return useMutation<Escalation, Error, { escalation_id: number; user_id: number; user_name: string; note?: string }>({
    mutationFn: async ({ escalation_id, user_id, user_name, note }) => {
      const res = await api.post<Escalation>(`/escalations/${escalation_id}/resolve`, null, {
        params: { user_id, user_name, note }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
    },
  })
}
