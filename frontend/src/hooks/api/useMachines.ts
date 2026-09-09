import { useQuery } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { Machine } from '@/types/api'

export function useMachines() {
  return useQuery<Machine[]>({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await api.get<Machine[]>('/machines')
      return res.data
    },
  })
}

export function useMachine(machineId?: string) {
  return useQuery<Machine>({
    queryKey: ['machines', machineId],
    queryFn: async () => {
      const res = await api.get<Machine>(`/machines/${machineId}`)
      return res.data
    },
    enabled: !!machineId,
  })
}
