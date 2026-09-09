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
      <PageHeader title="Agentic Document Workflow" subtitle="Multi-tool autonomous PDF/DOCX analysis and report generation" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentUpload onSuccessRun={setLatestRun} />

        {latestRun ? (
          <AgentRunCard run={latestRun} />
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 text-sm">
            Upload a document on the left to initiate multi-tool agent execution.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Historical Agent Executions</h3>
        <AgentRunsTable runs={historyRuns || []} />
      </div>
    </div>
  )
}
