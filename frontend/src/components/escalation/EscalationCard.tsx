import React from 'react'
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import type { Escalation } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatTimeAgo } from '@/utils/format'

export interface EscalationCardProps {
  escalation: Escalation
  userId: number
  onAcknowledge: (id: number) => void
  onResolve: (id: number) => void
  onSelect?: (escalation: Escalation) => void
}

export function EscalationCard({ escalation, userId, onAcknowledge, onResolve, onSelect }: EscalationCardProps) {
  const isPending = escalation.status === 'pending'
  const isAck = escalation.status === 'acknowledged'

  return (
    <Card className="hover:border-slate-300 transition-all cursor-pointer space-y-3" onClick={() => onSelect && onSelect(escalation)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl text-white ${isPending ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">Escalation #{escalation.id}</h4>
              <Badge variant={isPending ? 'accent' : isAck ? 'warning' : 'success'}>
                {escalation.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Reason: {escalation.reason}</p>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {formatTimeAgo(escalation.created_at)}
        </span>
      </div>

      {escalation.ticket && (
        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
          {escalation.ticket.title}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        {isPending && (
          <Button size="sm" variant="outline" onClick={() => onAcknowledge(escalation.id)}>
            Acknowledge
          </Button>
        )}
        {(isPending || isAck) && (
          <Button size="sm" variant="primary" onClick={() => onResolve(escalation.id)}>
            <CheckCircle className="w-4 h-4 mr-1" /> Resolve
          </Button>
        )}
      </div>
    </Card>
  )
}
