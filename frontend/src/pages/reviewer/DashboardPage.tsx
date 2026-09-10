import React, { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, Target, RefreshCw, BarChart2, TrendingUp, Clock } from 'lucide-react'
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
import { MTTRChart } from '@/components/dashboard/charts/MTTRChart'
import { ConfidenceDistribution } from '@/components/dashboard/charts/ConfidenceDistribution'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Escalation } from '@/types/api'

export function DashboardPage() {
  const { userId } = useAuthStore()
  const metrics = useDashboardMetrics()
  const ticketsTrend = useTicketsTrend()
  const machineHealth = useMachineHealth()
  const mttr = useMTTR()
  const confidenceDist = useConfidenceDistribution()
  const { data: escalations, refetch } = usePendingEscalations()
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null)
  const [activeChartTab, setActiveChartTab] = useState<'health' | 'trend' | 'mttr'>('health')

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
    <div className="space-y-3">
      <PageHeader
        title="Quality &amp; Defect Command Center"
        subtitle="Live escalation queue triage, fleet health index, and MTTR telemetry"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              refetch()
              metrics.refetch()
            }}
            className="bg-[#262730] text-[#EFF0D1] border border-[#3d3e4b] hover:bg-[#32333e] text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#77BA99]" />
            Refresh Triage Queue
          </Button>
        }
      />

      {/* Compact Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <MetricCard
          icon={Activity}
          label="Shift Inspections"
          value={metrics.data?.inspections_today || 0}
          trend={{ value: 12, positive: true }}
          color="primary"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Pending Escalations"
          value={metrics.data?.pending_escalations || 0}
          trend={{ value: (metrics.data?.pending_escalations || 0), positive: false }}
          color={(metrics.data?.pending_escalations || 0) > 0 ? 'accent' : 'primary'}
        />
        <MetricCard
          icon={CheckCircle}
          label="Open Work Tickets"
          value={metrics.data?.open_tickets || 0}
          trend={{ value: -5, positive: true }}
          color="warning"
        />
        <MetricCard
          icon={Target}
          label="First-Pass Yield"
          value={`${Math.round((metrics.data?.avg_confidence || 0.98) * 100)}%`}
          trend={{ value: 2, positive: true }}
          color="success"
        />
      </div>

      {/* High-Efficiency 2-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left / Primary Column (7 cols): Priority Escalation Triage Desk */}
        <Card className="lg:col-span-7 xl:col-span-8 p-3.5 bg-[#262730] border border-[#3d3e4b] space-y-3 shadow-md">
          <div className="border-b border-[#3d3e4b] pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D33F49]" />
              <h3 className="font-bold text-[#EFF0D1] text-xs sm:text-sm uppercase tracking-wider">
                Priority Defect &amp; Escalation Queue
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-[#D33F49]/15 text-[#D33F49] border border-[#D33F49]/30 px-2 py-0.5 rounded-full font-bold">
              {escalations?.length || 0} ACTION REQUIRED
            </span>
          </div>

          <div className="max-h-[620px] overflow-y-auto pr-1">
            <EscalationList
              escalations={escalations || []}
              userId={userId}
              onSelectEscalation={setSelectedEscalation}
            />
          </div>
        </Card>

        {/* Right / Secondary Column (5 cols): Compact Tabbed Fleet Oversight & Floor Activity */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          {/* Tabbed Analytics Card */}
          <Card className="p-3 bg-[#262730] border border-[#3d3e4b] space-y-2.5 shadow-md">
            {/* Chart Tab Selector */}
            <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D7C0D0]">Fleet Analytics</span>
              <div className="flex items-center bg-[#1d1e25] p-0.5 rounded-lg border border-[#3d3e4b] text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('health')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    activeChartTab === 'health'
                      ? 'bg-[#77BA99] text-[#1d1e25] font-bold'
                      : 'text-[#D7C0D0] hover:text-[#EFF0D1]'
                  }`}
                >
                  Health
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('trend')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    activeChartTab === 'trend'
                      ? 'bg-[#77BA99] text-[#1d1e25] font-bold'
                      : 'text-[#D7C0D0] hover:text-[#EFF0D1]'
                  }`}
                >
                  Volume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('mttr')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    activeChartTab === 'mttr'
                      ? 'bg-[#77BA99] text-[#1d1e25] font-bold'
                      : 'text-[#D7C0D0] hover:text-[#EFF0D1]'
                  }`}
                >
                  MTTR
                </button>
              </div>
            </div>

            {/* Chart Display Area */}
            <div className="h-[210px]">
              {activeChartTab === 'health' && (
                <MachineHealthChart data={machineHealth.data || []} />
              )}
              {activeChartTab === 'trend' && (
                <TicketsTrendChart data={ticketsTrend.data || []} />
              )}
              {activeChartTab === 'mttr' && (
                <MTTRChart data={mttr.data || []} />
              )}
            </div>

            {/* Tolerance Distribution Bar (Compact) */}
            <div className="pt-2 border-t border-[#3d3e4b]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D7C0D0] block mb-1">
                Tolerance Verification Range
              </span>
              <ConfidenceDistribution data={confidenceDist.data || []} />
            </div>
          </Card>

          {/* Real-Time Shift Activity */}
          <Card className="p-3 bg-[#262730] border border-[#3d3e4b] space-y-2 shadow-md">
            <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EFF0D1]">
                <Clock className="w-3.5 h-3.5 text-[#77BA99]" />
                <span>Recent Floor Activity</span>
              </div>
              <span className="text-[9px] font-mono text-[#77BA99] bg-[#77BA99]/15 border border-[#77BA99]/30 px-1.5 py-0.2 rounded font-bold">
                LIVE
              </span>
            </div>
            <ActivityFeed limit={4} />
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
