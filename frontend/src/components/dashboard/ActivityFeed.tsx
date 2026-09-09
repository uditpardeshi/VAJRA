import React from 'react'
import { Activity, Camera, AlertTriangle, FileText, CheckCircle } from 'lucide-react'

export interface ActivityFeedProps {
  limit?: number
}

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const activities = [
    { id: 1, type: 'inspect', text: 'Worker performed inspection on HX-204', time: '5m ago', icon: Camera, color: 'text-primary' },
    { id: 2, type: 'escalation', text: 'Low-confidence escalation triggered for CNC-500', time: '12m ago', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 3, type: 'agent', text: 'Agent generated DOCX report for LATHE-3', time: '25m ago', icon: FileText, color: 'text-purple-500' },
    { id: 4, type: 'resolve', text: 'Reviewer resolved escalation #104', time: '40m ago', icon: CheckCircle, color: 'text-emerald-500' },
  ].slice(0, limit)

  return (
    <div className="p-4 space-y-3">
      {activities.map((act) => {
        const Icon = act.icon
        return (
          <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-0">
            <div className={`p-1.5 rounded-lg bg-slate-100 ${act.color} shrink-0 mt-0.5`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{act.text}</p>
              <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
