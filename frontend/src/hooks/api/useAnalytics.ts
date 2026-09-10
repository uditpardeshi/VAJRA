import { useQuery } from '@tanstack/react-query'
import { api } from '@/config/api'
import type {
  DashboardMetrics,
  TrendPoint,
  MachineHealth,
  EscalationHeatmapCell,
  ConfidenceBucket,
  ShiftActivityItem,
  AuditTrailItem,
  SystemMetrics
} from '@/types/api'

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['analytics', 'metrics'],
    queryFn: async () => {
      const res = await api.get<DashboardMetrics>('/analytics/metrics')
      return res.data
    },
    refetchInterval: 10000,
  })
}

export function useTicketsTrend() {
  return useQuery<TrendPoint[]>({
    queryKey: ['analytics', 'tickets-trend'],
    queryFn: async () => {
      const res = await api.get<TrendPoint[]>('/analytics/tickets-trend')
      return res.data
    },
    refetchInterval: 30000,
  })
}

export function useMachineHealth() {
  return useQuery<MachineHealth[]>({
    queryKey: ['analytics', 'machine-health'],
    queryFn: async () => {
      const res = await api.get<MachineHealth[]>('/analytics/machine-health')
      return res.data
    },
    refetchInterval: 15000,
  })
}

export function useEscalationHeatmap() {
  return useQuery<EscalationHeatmapCell[]>({
    queryKey: ['analytics', 'heatmap'],
    queryFn: async () => {
      const res = await api.get<EscalationHeatmapCell[]>('/analytics/escalation-heatmap')
      return res.data
    },
    refetchInterval: 30000,
  })
}

export function useMTTR() {
  return useQuery<TrendPoint[]>({
    queryKey: ['analytics', 'mttr'],
    queryFn: async () => {
      const res = await api.get<TrendPoint[]>('/analytics/mttr')
      return res.data
    },
    refetchInterval: 30000,
  })
}

export function useConfidenceDistribution() {
  return useQuery<ConfidenceBucket[]>({
    queryKey: ['analytics', 'confidence-dist'],
    queryFn: async () => {
      const res = await api.get<ConfidenceBucket[]>('/analytics/confidence-dist')
      return res.data
    },
    refetchInterval: 30000,
  })
}

export function useShiftActivity() {
  return useQuery<ShiftActivityItem[]>({
    queryKey: ['analytics', 'shift-activity'],
    queryFn: async () => {
      const res = await api.get<ShiftActivityItem[]>('/analytics/shift-activity')
      return res.data
    },
    refetchInterval: 10000,
  })
}

export function useAuditTrail() {
  return useQuery<AuditTrailItem[]>({
    queryKey: ['analytics', 'audit-trail'],
    queryFn: async () => {
      const res = await api.get<AuditTrailItem[]>('/analytics/audit-trail')
      return res.data
    },
    refetchInterval: 10000,
  })
}

export function useSystemMetrics() {
  return useQuery<SystemMetrics>({
    queryKey: ['analytics', 'system-metrics'],
    queryFn: async () => {
      const res = await api.get<SystemMetrics>('/analytics/system-metrics')
      return res.data
    },
    refetchInterval: 15000,
  })
}
