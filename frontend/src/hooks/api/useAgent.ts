import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/config/api'
import type { AgentRunResponse, AgentRunListItem } from '@/types/api'

export function useAnalyzeDocument() {
  const queryClient = useQueryClient()
  return useMutation<AgentRunResponse, Error, { file: File; user_id?: number; machine_id?: string; analysis_type?: string }>({
    mutationFn: async ({ file, user_id = 1, machine_id, analysis_type = 'thickness_approval' }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', String(user_id))
      formData.append('analysis_type', analysis_type)
      if (machine_id) formData.append('machine_id', machine_id)

      const res = await api.post<AgentRunResponse>('/analyze-doc', formData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
    },
  })
}

export function useAgentRuns() {
  return useQuery<AgentRunListItem[]>({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      const res = await api.get<AgentRunListItem[]>('/agent/runs')
      return res.data
    },
  })
}
