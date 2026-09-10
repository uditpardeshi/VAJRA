import React, { useState } from 'react'
import { AgentUpload } from '@/components/agent/AgentUpload'
import { AgentRunCard } from '@/components/agent/AgentRunCard'
import { AgentRunsTable } from '@/components/agent/AgentRunsTable'
import { useAgentRuns } from '@/hooks/api/useAgent'
import { PageHeader } from '@/components/layout/PageHeader'
import type { AgentRunResponse } from '@/types/api'

export function AgentPage() {
  const [latestRun, setLatestRun] = useState<AgentRunResponse | null>(null)
  const { data: historyRuns } = useAgentRuns()

  return (
    <div className="space-y-6">
      <PageHeader title="Document Verification & Compliance" subtitle="Automated extraction of measurement parameters, tolerance checks, and compliance reporting" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentUpload onSuccessRun={setLatestRun} />

        {latestRun ? (
          <AgentRunCard run={latestRun} />
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 text-sm bg-slate-50/50">
            <p className="font-medium text-slate-600">No active verification run</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Upload an inspection report, ultrasonic thickness sheet, or calibration log on the left to verify tolerances against equipment specs.</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Verification Audit Trail</h3>
        <AgentRunsTable runs={historyRuns || []} />
      </div>
    </div>
  )
}
