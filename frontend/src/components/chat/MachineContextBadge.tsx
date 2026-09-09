import React from 'react'
import { Cpu } from 'lucide-react'

export interface MachineContextBadgeProps {
  machineId?: string
  machineName?: string
}

export function MachineContextBadge({ machineId, machineName }: MachineContextBadgeProps) {
  if (!machineId) return null

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold">
      <Cpu className="w-3.5 h-3.5" />
      <span>Manual Context: {machineName || machineId}</span>
    </div>
  )
}
