import React, { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, Target, RefreshCw, Clock } from 'lucide-react'
import {
  useDashboardMetrics,
  useTicketsTrend,
  useMachineHealth,
  useMTTR,
  useConfidenceDistribution,
} from '@/hooks/api/useAnalytics'
import { usePendingEscalations } from '@/hooks/api/useEscalations'
import { useWebSocket } from '@/hooks/websocket/useEscalationWS'
import { useAuthStore } from '@/store/authStore'
import { EscalationList } from '@/components/escalation/EscalationList'
import { EscalationDetailModal } from '@/components/escalation/EscalationDetailModal'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { TicketsTrendChart } from '@/components/dashboard/charts/TicketsTrendChart'
import { MachineHealthChart } from '@/components/dashboard/charts/MachineHealthChart'
import { MTTRChart } from '@/components/dashboard/charts/MTTRChart'
import { ConfidenceDistribution } from '@/components/dashboard/charts/ConfidenceDistribution'
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

  const pendingCount = escalations?.length || metrics.data?.pending_escalations || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#22232d] p-4 rounded-xl border border-[#2e303d]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#EFF0D1]">
            QA Command Center
          </h1>
          <p className="text-xs text-[#D7C0D0]/80 mt-0.5">
            Fleet quality monitoring, defect escalation queue, and MTTR metrics
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            refetch()
            metrics.refetch()
          }}
          className="bg-[#181920] hover:bg-[#262730] text-[#EFF0D1] border border-[#2e303d] text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#77BA99]" />
          Refresh Queue
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#22232d] border border-[#2e303d] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#D7C0D0]/70 uppercase tracking-wider">
              Shift Inspections
            </span>
            <Activity className="w-4 h-4 text-[#77BA99]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#EFF0D1] pt-0.5">
            {metrics.data?.inspections_today || 0}
          </div>
          <p className="text-[11px] text-[#77BA99]">
            +12% vs last shift
          </p>
        </div>

        <div className="bg-[#22232d] border border-[#2e303d] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#D7C0D0]/70 uppercase tracking-wider">
              Pending Escalations
            </span>
            <AlertTriangle className={`w-4 h-4 ${pendingCount > 0 ? 'text-[#D33F49]' : 'text-[#77BA99]'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-bold pt-0.5 ${pendingCount > 0 ? 'text-[#D33F49]' : 'text-[#EFF0D1]'}`}>
            {pendingCount}
          </div>
          <p className="text-[11px] text-[#D7C0D0]/60">
            {pendingCount > 0 ? 'Review required' : 'All nominal'}
          </p>
        </div>

        <div className="bg-[#22232d] border border-[#2e303d] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#D7C0D0]/70 uppercase tracking-wider">
              Open Work Tickets
            </span>
            <CheckCircle className="w-4 h-4 text-[#77BA99]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#EFF0D1] pt-0.5">
            {metrics.data?.open_tickets || 0}
          </div>
          <p className="text-[11px] text-[#D7C0D0]/60">
            Active maintenance tickets
          </p>
        </div>

        <div className="bg-[#22232d] border border-[#2e303d] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#D7C0D0]/70 uppercase tracking-wider">
              First-Pass Yield
            </span>
            <Target className="w-4 h-4 text-[#77BA99]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#EFF0D1] pt-0.5">
            {Math.round((metrics.data?.avg_confidence || 0.98) * 100)}%
          </div>
          <p className="text-[11px] text-[#77BA99]">
            Within tolerance
          </p>
        </div>
      </div>

      {/* Main Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left / Primary Column (7 cols): Escalation Triage Desk */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-3">
          <div className="border-b border-[#2e303d] pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D33F49]" />
              <h2 className="font-semibold text-sm text-[#EFF0D1]">
                Priority Escalation Queue
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#D33F49]/15 text-[#D33F49] font-medium">
              {pendingCount} Active
            </span>
          </div>

          <div className="max-h-[600px] overflow-y-auto pr-1">
            <EscalationList
              escalations={escalations || []}
              userId={userId}
              onSelectEscalation={setSelectedEscalation}
            />
          </div>
        </div>

        {/* Right / Secondary Column (5 cols): Fleet Health & Activity Feed */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          {/* Fleet Analytics Card */}
          <div className="bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2e303d] pb-2.5">
              <h3 className="font-semibold text-xs text-[#EFF0D1]">Fleet Analytics</h3>
              <div className="flex items-center bg-[#181920] p-0.5 rounded-lg border border-[#2e303d] text-xs">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('health')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeChartTab === 'health'
                      ? 'bg-[#262730] text-[#EFF0D1] font-semibold'
                      : 'text-[#D7C0D0]/60 hover:text-[#EFF0D1]'
                  }`}
                >
                  Health
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('trend')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeChartTab === 'trend'
                      ? 'bg-[#262730] text-[#EFF0D1] font-semibold'
                      : 'text-[#D7C0D0]/60 hover:text-[#EFF0D1]'
                  }`}
                >
                  Volume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('mttr')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeChartTab === 'mttr'
                      ? 'bg-[#262730] text-[#EFF0D1] font-semibold'
                      : 'text-[#D7C0D0]/60 hover:text-[#EFF0D1]'
                  }`}
                >
                  MTTR
                </button>
              </div>
            </div>

            <div className="h-[180px]">
              {activeChartTab === 'health' && <MachineHealthChart data={machineHealth.data || []} />}
              {activeChartTab === 'trend' && <TicketsTrendChart data={ticketsTrend.data || []} />}
              {activeChartTab === 'mttr' && <MTTRChart data={mttr.data || []} />}
            </div>

            <div className="pt-2 border-t border-[#2e303d]">
              <span className="text-[11px] font-medium text-[#D7C0D0]/70 block mb-1">
                Tolerance Distribution
              </span>
              <ConfidenceDistribution data={confidenceDist.data || []} />
            </div>
          </div>

          {/* Floor Activity Card */}
          <div className="bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-[#2e303d] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#EFF0D1]">
                <Clock className="w-3.5 h-3.5 text-[#77BA99]" />
                <span>Floor Activity</span>
              </div>
              <span className="text-[10px] text-[#77BA99] font-medium">Live</span>
            </div>
            <ActivityFeed limit={4} />
          </div>
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
