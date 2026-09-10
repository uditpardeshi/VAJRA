import { useQuery } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { Machine } from '@/types/api'

export function useMachines() {
  return useQuery<Machine[]>({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await api.get<any>('/machines')
      if (Array.isArray(res.data)) return res.data
      if (res.data && Array.isArray(res.data.machines)) return res.data.machines
      return []
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
