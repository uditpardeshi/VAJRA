import React, { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, Target, Settings } from 'lucide-react'
import {
  useDashboardMetrics,
  useTicketsTrend,
  useMachineHealth,
  useEscalationHeatmap,
  useMTTR,
  useConfidenceDistribution,
} from '@/hooks/api/useAnalytics'
import { usePendingEscalations } from '@/hooks/api/useEscalations'
import { useWebSocket } from '@/hooks/websocket/useEscalationWS'
import { useAuthStore } from '@/store/authStore'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EscalationList } from '@/components/escalation/EscalationList'
import { EscalationDetailModal } from '@/components/escalation/EscalationDetailModal'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { TicketsTrendChart } from '@/components/dashboard/charts/TicketsTrendChart'
import { MachineHealthChart } from '@/components/dashboard/charts/MachineHealthChart'
import { EscalationHeatmap } from '@/components/dashboard/charts/EscalationHeatmap'
import { MTTRChart } from '@/components/dashboard/charts/MTTRChart'
import { ConfidenceDistribution } from '@/components/dashboard/charts/ConfidenceDistribution'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import type { Escalation } from '@/types/api'

export function DashboardPage() {
  const { userId } = useAuthStore()
  const metrics = useDashboardMetrics()
  const ticketsTrend = useTicketsTrend()
  const machineHealth = useMachineHealth()
  const escalationHeatmap = useEscalationHeatmap()
  const mttr = useMTTR()
  const confidenceDist = useConfidenceDistribution()
  const { data: escalations, refetch } = usePendingEscalations()
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null)

  useWebSocket({
    role: 'reviewer',
    userId,
    enabled: true,
    onMessage: () => {
      refetch()
      metrics.refetch()
    },
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Command Center" subtitle="Real-time fleet oversight, MTTR metrics, and escalation triage" />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Activity} label="Inspections Today" value={metrics.data?.inspections_today || 0} trend={{ value: 12, positive: true }} color="primary" />
        <MetricCard icon={AlertTriangle} label="Pending Escalations" value={metrics.data?.pending_escalations || 0} trend={{ value: 3, positive: false }} color="accent" />
        <MetricCard icon={CheckCircle} label="Open Tickets" value={metrics.data?.open_tickets || 0} trend={{ value: -5, positive: true }} color="success" />
        <MetricCard icon={Target} label="Avg Confidence" value={`${Math.round((metrics.data?.avg_confidence || 0) * 100)}%`} trend={{ value: 2, positive: true }} color="warning" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="h-[280px] p-3.5">
          <TicketsTrendChart data={ticketsTrend.data || []} />
        </Card>
        <Card className="h-[280px] p-3.5">
          <MachineHealthChart data={machineHealth.data || []} />
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-3.5">
          <EscalationHeatmap data={escalationHeatmap.data || []} />
        </Card>
        <Card className="h-[240px] p-3.5">
          <MTTRChart data={mttr.data || []} />
        </Card>
      </div>

      {/* Live Escalations & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-3.5 space-y-3">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Live Pending Escalations
            </h3>
            <span className="text-xs font-mono bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
              {escalations?.length || 0} ACTIVE
            </span>
          </div>
          <EscalationList
            escalations={escalations || []}
            userId={userId}
            onSelectEscalation={setSelectedEscalation}
          />
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="border-b border-slate-100 pb-3 font-bold text-slate-900 text-sm">Confidence Distribution</div>
            <ConfidenceDistribution data={confidenceDist.data || []} />
          </Card>
          <Card>
            <div className="border-b border-slate-100 pb-3 font-bold text-slate-900 text-sm">Real-time Activity</div>
            <ActivityFeed limit={5} />
          </Card>
        </div>
      </div>

      <EscalationDetailModal
        escalation={selectedEscalation}
        onClose={() => setSelectedEscalation(null)}
        onAcknowledge={() => setSelectedEscalation(null)}
        onResolve={() => setSelectedEscalation(null)}
      />
    </div>
  )
}
