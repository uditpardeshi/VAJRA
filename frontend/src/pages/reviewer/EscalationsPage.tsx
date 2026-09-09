import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EscalationList } from '@/components/escalation/EscalationList'
import { EscalationDetailModal } from '@/components/escalation/EscalationDetailModal'
import { useAllEscalations } from '@/hooks/api/useEscalations'
import { useAuthStore } from '@/store/authStore'
import type { Escalation } from '@/types/api'

export function EscalationsPage() {
  const { userId } = useAuthStore()
  const { data: escalations } = useAllEscalations()
  const [selected, setSelected] = useState<Escalation | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader title="Escalation Management" subtitle="Review and acknowledge low-confidence inspection alerts" />
      <EscalationList
        escalations={escalations || []}
        userId={userId}
        onSelectEscalation={setSelected}
      />
      <EscalationDetailModal
        escalation={selected}
        onClose={() => setSelected(null)}
        onAcknowledge={() => setSelected(null)}
        onResolve={() => setSelected(null)}
      />
    </div>
  )
}
