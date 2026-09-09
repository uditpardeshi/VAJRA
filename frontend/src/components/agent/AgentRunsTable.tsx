import React from 'react'
import type { AgentRunListItem } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/format'

export interface AgentRunsTableProps {
  runs: AgentRunListItem[]
}

export function AgentRunsTable({ runs }: AgentRunsTableProps) {
  if (runs.length === 0) {
    return <div className="p-6 text-center text-slate-400 text-sm">No historical agent runs.</div>
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
          <tr>
            <th className="p-3">Run ID</th>
            <th className="p-3">Input File</th>
            <th className="p-3">Status</th>
            <th className="p-3">Tools Used</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/50">
              <td className="p-3 font-mono font-bold text-slate-900">#{r.id}</td>
              <td className="p-3 font-mono">{r.input_file_path.split('/').pop()}</td>
              <td className="p-3">
                <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>
                  {r.status}
                </Badge>
              </td>
              <td className="p-3 font-mono text-[11px] text-slate-500">{r.tools_used || 'N/A'}</td>
              <td className="p-3 text-slate-400">{formatDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
