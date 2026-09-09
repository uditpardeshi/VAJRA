import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, ShieldAlert, Wrench } from 'lucide-react'
import type { InspectResponse } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatConfidence } from '@/utils/format'

export interface InspectionResultCardProps {
  data: InspectResponse
  onDismiss: () => void
  onViewDetails?: () => void
}

export function InspectionResultCard({ data, onDismiss, onViewDetails }: InspectionResultCardProps) {
  const isHighConfidence = data.confidence >= 0.8
  const isLowConfidence = data.confidence < 0.7

  return (
    <Card className="m-4 bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white ${data.needs_escalation ? 'bg-rose-500' : 'bg-emerald-500'}`}>
            {data.needs_escalation ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">{data.machine_id} Inspection</h3>
              <Badge variant={isHighConfidence ? 'success' : isLowConfidence ? 'accent' : 'warning'}>
                {formatConfidence(data.confidence)} Confidence
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Finding: {data.finding}</p>
          </div>
        </div>

        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
          ✕
        </button>
      </div>

      {data.needs_escalation && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Auto-Escalated to Reviewer Queue (Confidence &lt; 70% or Safety Critical)</span>
        </div>
      )}

      {data.repair_steps && data.repair_steps.length > 0 && (
        <div className="space-y-1.5 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Wrench className="w-3.5 h-3.5 text-primary" /> Recommended Repair Steps
          </div>
          <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
            {data.repair_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {onViewDetails && (
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            View Full Image &amp; AR
          </Button>
        )}
        <Button size="sm" variant="primary" onClick={onDismiss}>
          Done
        </Button>
      </div>
    </Card>
  )
}
