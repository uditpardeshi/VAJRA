import React from 'react'
import type { Machine } from '@/types/api'
import { Select } from '@/components/ui/Select'
import { Cpu } from 'lucide-react'

export interface MachineSelectorProps {
  machines: Machine[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MachineSelector({ machines, value, onChange, className }: MachineSelectorProps) {
  const options = machines.map((m) => ({
    value: m.machine_id,
    label: `${m.name} (${m.machine_id})`,
  }))

  return (
    <div className={className}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options.length > 0 ? options : [{ value: '', label: 'No machines available' }]}
      />
    </div>
  )
}
