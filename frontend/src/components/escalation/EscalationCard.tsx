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
    <Card className="hover:border-[#77BA99]/60 hover:bg-[#32333e] transition-all cursor-pointer space-y-2.5 p-3 bg-[#262730] border border-[#3d3e4b]" onClick={() => onSelect && onSelect(escalation)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg text-[#1d1e25] font-bold ${isPending ? 'bg-[#D33F49] text-white shadow-xs' : 'bg-[#77BA99]'}`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs sm:text-sm text-[#EFF0D1]">Escalation #{escalation.id}</h4>
              <Badge variant={isPending ? 'accent' : isAck ? 'warning' : 'success'} size="sm">
                {escalation.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[11px] text-[#D7C0D0] mt-0.5">Reason: {escalation.reason}</p>
          </div>
        </div>

        <span className="text-[10px] text-[#D7C0D0]/80 font-mono">
          {formatTimeAgo(escalation.created_at)}
        </span>
      </div>

      {escalation.ticket && (
        <p className="text-xs text-[#EFF0D1] bg-[#1d1e25] p-2 rounded-lg border border-[#3d3e4b] font-mono">
          {escalation.ticket.title}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3d3e4b]" onClick={(e) => e.stopPropagation()}>
        {isPending && (
          <Button size="sm" variant="secondary" onClick={() => onAcknowledge(escalation.id)} className="text-xs bg-[#1d1e25] text-[#EFF0D1] border border-[#3d3e4b] hover:bg-[#32333e]">
            Acknowledge
          </Button>
        )}
        {(isPending || isAck) && (
          <Button size="sm" variant="primary" onClick={() => onResolve(escalation.id)} className="text-xs bg-[#77BA99] hover:bg-[#88caa9] text-[#1d1e25] font-bold">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolve
          </Button>
        )}
      </div>
    </Card>
  )
}
