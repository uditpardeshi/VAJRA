import React from 'react'
import type { EscalationHeatmapCell } from '@/types/api'

export interface EscalationHeatmapProps {
  data: EscalationHeatmapCell[]
}

export function EscalationHeatmap({ data }: EscalationHeatmapProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-sm text-slate-800">Fleet Escalation Density</h4>
      <div className="grid grid-cols-3 gap-3">
        {['HX-204', 'CNC-500', 'LATHE-3'].map((machine) => {
          const count = data.find((d) => d.machine_id === machine)?.count || 0
          return (
            <div
              key={machine}
              className={`p-4 rounded-2xl border text-center transition-all ${
                count > 2
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : count > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <div className="font-bold text-sm">{machine}</div>
              <div className="text-2xl font-extrabold mt-1">{count}</div>
              <div className="text-[10px] font-semibold tracking-wider uppercase mt-0.5">Escalations</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
