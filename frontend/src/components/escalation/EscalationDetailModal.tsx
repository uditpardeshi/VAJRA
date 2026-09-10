import React from 'react'
import type { Escalation } from '@/types/api'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/format'

export interface EscalationDetailModalProps {
  escalation: Escalation | null
  onClose: () => void
  onAcknowledge: (id: number) => void
  onResolve: (id: number) => void
}

export function EscalationDetailModal({ escalation, onClose, onAcknowledge, onResolve }: EscalationDetailModalProps) {
  if (!escalation) return null

  return (
    <Modal isOpen={!!escalation} onClose={onClose} title={`Escalation Detail #${escalation.id}`}>
      <div className="space-y-4 text-sm text-slate-200">
        <div className="flex items-center justify-between border-b border-[#23334d] pb-3">
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold">Reason</span>
            <span className="font-bold text-white text-base">{escalation.reason}</span>
          </div>
          <Badge variant={escalation.status === 'pending' ? 'accent' : 'success'}>
            {escalation.status}
          </Badge>
        </div>

        <div>
          <span className="text-xs text-slate-400 block uppercase font-bold">Created At</span>
          <span className="text-slate-200 font-mono">{formatDate(escalation.created_at)}</span>
        </div>

        {escalation.ticket && (
          <div className="p-3 bg-[#0c1220] border border-[#23334d] rounded-xl space-y-1">
            <span className="text-xs font-bold text-white">Associated Ticket #{escalation.ticket.id}</span>
            <p className="text-xs text-slate-200">{escalation.ticket.title}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#23334d]">
          {escalation.status === 'pending' && (
            <Button variant="outline" onClick={() => onAcknowledge(escalation.id)}>
              Acknowledge
            </Button>
          )}
          <Button variant="primary" onClick={() => onResolve(escalation.id)}>
            Resolve &amp; Close Ticket
          </Button>
        </div>
      </div>
    </Modal>
  )
}
