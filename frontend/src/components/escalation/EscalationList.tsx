import React from 'react'
import type { Escalation } from '@/types/api'
import { EscalationCard } from './EscalationCard'
import { useAcknowledgeEscalation, useResolveEscalation } from '@/hooks/api/useEscalations'
import { useToast } from '@/hooks/useToast'

export interface EscalationListProps {
  escalations: Escalation[]
  userId: number
  onSelectEscalation?: (escalation: Escalation) => void
}

export function EscalationList({ escalations, userId, onSelectEscalation }: EscalationListProps) {
  const { mutate: ack } = useAcknowledgeEscalation()
  const { mutate: resolve } = useResolveEscalation()
  const toast = useToast()

  const handleAck = (id: number) => {
    ack({ escalation_id: id, user_id: userId, user_name: 'Reviewer' }, {
      onSuccess: () => toast.success(`Escalation #${id} acknowledged`),
      onError: () => toast.error('Failed to acknowledge escalation'),
    })
  }

  const handleResolve = (id: number) => {
    resolve({ escalation_id: id, user_id: userId, user_name: 'Reviewer', note: 'Resolved by manager' }, {
      onSuccess: () => toast.success(`Escalation #${id} resolved`),
      onError: () => toast.error('Failed to resolve escalation'),
    })
  }

  if (escalations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No active escalations. Fleet running smoothly.
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      {escalations.map((esc) => (
        <EscalationCard
          key={esc.id}
          escalation={esc}
          userId={userId}
          onAcknowledge={handleAck}
          onResolve={handleResolve}
          onSelect={onSelectEscalation}
        />
      ))}
    </div>
  )
}
