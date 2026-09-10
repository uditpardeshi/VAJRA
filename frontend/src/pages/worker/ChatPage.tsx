import React, { useState } from 'react'
import { useMachines } from '@/hooks/api/useMachines'
import { useAuthStore } from '@/store/authStore'
import { ChatInterface } from '@/components/chat/ChatInterface'

export function ChatPage() {
  const { data: machines } = useMachines()
  const { currentMachine, setCurrentMachine } = useAuthStore()
  const [selectedId, setSelectedId] = useState(currentMachine?.machine_id || 'HX-204')

  const handleSelectMachine = (id: string) => {
    setSelectedId(id)
    const m = machines?.find((x) => x.machine_id === id)
    if (m) setCurrentMachine(m)
  }

  return (
    <div className="h-full w-full min-w-0 flex flex-col">
      <ChatInterface
        machines={machines || []}
        selectedMachineId={selectedId}
        onSelectMachine={handleSelectMachine}
      />
    </div>
  )
}
