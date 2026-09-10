import React from 'react'
import type { AgentRunListItem } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/format'

export interface AgentRunsTableProps {
  runs: AgentRunListItem[]
}

export function AgentRunsTable({ runs }: AgentRunsTableProps) {
  if (runs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-300 text-xs bg-[#111927] border border-[#23334d] rounded-2xl">
        No document verification records logged yet. Uploaded compliance documents will appear here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-[#23334d] rounded-2xl bg-[#111927] shadow-md">
      <table className="w-full text-left text-xs text-slate-200">
        <thead className="bg-[#18233a] border-b border-[#23334d] text-sky-200 font-bold uppercase tracking-wider">
          <tr>
            <th className="p-3">Record ID</th>
            <th className="p-3">Source Document</th>
            <th className="p-3">Validation Status</th>
            <th className="p-3">Pipeline Executed</th>
            <th className="p-3">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#23334d]">
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-[#152236] transition-colors">
              <td className="p-3 font-mono font-bold text-white">#{r.id}</td>
              <td className="p-3 font-mono text-slate-200">{r.input_file_path.split('/').pop()}</td>
              <td className="p-3">
                <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>
                  {r.status}
                </Badge>
              </td>
              <td className="p-3 font-mono text-[11px] text-slate-300">{r.tools_used || 'N/A'}</td>
              <td className="p-3 text-slate-400 font-mono">{formatDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
