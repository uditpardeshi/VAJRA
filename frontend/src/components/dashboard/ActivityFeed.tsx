import React from 'react'
import { Activity, Camera, AlertTriangle, FileText, CheckCircle } from 'lucide-react'

export interface ActivityFeedProps {
  limit?: number
}

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const activities = [
    { id: 1, type: 'inspect', text: 'Shift inspection logged: HX-204 spindle runout (4.2 μm)', time: '4m ago', icon: Camera, color: 'text-primary' },
    { id: 2, type: 'escalation', text: 'Pressure anomaly flagged: CNC-500 line 2 (2.1 bar)', time: '12m ago', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 3, type: 'agent', text: 'Compliance report filed: LATHE-3 carbide flank wear', time: '25m ago', icon: FileText, color: 'text-primary-600' },
    { id: 4, type: 'resolve', text: 'Reviewer approved seal replacement on ticket #104', time: '41m ago', icon: CheckCircle, color: 'text-emerald-500' },
  ].slice(0, limit)

  return (
    <div className="p-3 space-y-2">
      {activities.map((act) => {
        const Icon = act.icon
        return (
          <div key={act.id} className="flex items-start gap-2.5 text-xs border-b border-[#3d3e4b] pb-2 last:border-0 last:pb-0">
            <div className="p-1.5 rounded-lg bg-[#1d1e25] border border-[#3d3e4b] text-[#77BA99] shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#EFF0D1] text-[11px] leading-snug">{act.text}</p>
              <span className="text-[10px] text-[#D7C0D0]/80 font-mono">{act.time}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
