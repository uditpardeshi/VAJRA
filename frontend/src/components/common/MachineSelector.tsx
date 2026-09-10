import React from 'react'
import type { Machine } from '@/types/api'
import { Cpu, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface MachineSelectorProps {
  machines: Machine[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MachineSelector({ machines, value, onChange, className }: MachineSelectorProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1d1e25] border border-[#3d3e4b] hover:border-[#77BA99]/60 rounded-full text-xs font-semibold text-[#EFF0D1] shadow-2xs transition-colors w-full relative">
        <Cpu className="w-3.5 h-3.5 text-[#77BA99] shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-0 text-xs font-semibold text-[#EFF0D1] focus:outline-none focus:ring-0 cursor-pointer pr-4 appearance-none truncate w-full"
        >
          {machines && machines.length > 0 ? (
            machines.map((m) => (
              <option key={m.machine_id} value={m.machine_id} className="bg-[#262730] text-[#EFF0D1]">
                {m.machine_id} · {m.name}
              </option>
            ))
          ) : (
            <option value="" className="bg-[#262730] text-[#EFF0D1]">No machines</option>
          )}
        </select>
        <ChevronDown className="w-3 h-3 text-[#D7C0D0]/70 shrink-0 pointer-events-none absolute right-2.5" />
      </div>
    </div>
  )
}
