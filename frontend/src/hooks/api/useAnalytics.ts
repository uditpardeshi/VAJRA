import { useQuery } from '@tanstack/react-query'
import { api } from '@/config/api'
import type {
  DashboardMetrics,
  TrendPoint,
  MachineHealth,
  EscalationHeatmapCell,
  ConfidenceBucket
} from '@/types/api'

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['analytics', 'metrics'],
    queryFn: async () => {
      // Mock metrics when backend doesn't have an explicit analytics route
      return {
        total_inspections: 142,
        open_tickets: 8,
        pending_escalations: 3,
        avg_confidence: 0.88,
        mttr_hours: 4.2,
        machines_online: 3,
        inspections_today: 18,
        escalations_today: 2,
      }
    },
  })
}

export function useTicketsTrend() {
  return useQuery<TrendPoint[]>({
    queryKey: ['analytics', 'tickets-trend'],
    queryFn: async () => [
      { date: 'Mon', value: 12 },
      { date: 'Tue', value: 19 },
      { date: 'Wed', value: 15 },
      { date: 'Thu', value: 8 },
      { date: 'Fri', value: 22 },
      { date: 'Sat', value: 14 },
      { date: 'Sun', value: 18 },
    ],
  })
}

export function useMachineHealth() {
  return useQuery<MachineHealth[]>({
    queryKey: ['analytics', 'machine-health'],
    queryFn: async () => [
      { machine_id: 'HX-204', health_score: 94, last_inspection: '10m ago', open_issues: 0 },
      { machine_id: 'CNC-500', health_score: 72, last_inspection: '1h ago', open_issues: 2 },
      { machine_id: 'LATHE-3', health_score: 88, last_inspection: '30m ago', open_issues: 1 },
    ],
  })
}

export function useEscalationHeatmap() {
  return useQuery<EscalationHeatmapCell[]>({
    queryKey: ['analytics', 'heatmap'],
    queryFn: async () => [
      { machine_id: 'HX-204', date: '2026-09-03', count: 1 },
      { machine_id: 'CNC-500', date: '2026-09-04', count: 3 },
      { machine_id: 'LATHE-3', date: '2026-09-05', count: 0 },
    ],
  })
}

export function useMTTR() {
  return useQuery<TrendPoint[]>({
    queryKey: ['analytics', 'mttr'],
    queryFn: async () => [
      { date: 'Week 1', value: 6.5 },
      { date: 'Week 2', value: 5.2 },
      { date: 'Week 3', value: 4.8 },
      { date: 'Week 4', value: 4.2 },
    ],
  })
}

export function useConfidenceDistribution() {
  return useQuery<ConfidenceBucket[]>({
    queryKey: ['analytics', 'confidence-dist'],
    queryFn: async () => [
      { range: '90-100%', count: 85, percentage: 60 },
      { range: '70-89%', count: 42, percentage: 30 },
      { range: '50-69%', count: 12, percentage: 8 },
      { range: '<50%', count: 3, percentage: 2 },
    ],
  })
}
