import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMachines } from '@/hooks/api/useMachines'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Cpu, MapPin, FileText } from 'lucide-react'

export function MachinesPage() {
  const { data: machines } = useMachines()

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet Health &amp; Specifications" subtitle="Registered CNC and lathe equipment catalog" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {machines?.map((m) => (
          <Card key={m.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary-50 text-primary rounded-xl">
                <Cpu className="w-6 h-6" />
              </div>
              <Badge variant="success">ONLINE</Badge>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">{m.name}</h4>
              <span className="text-xs font-mono text-slate-400">{m.machine_id} · {m.type}</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.location}</div>
              <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {m.manual_path}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
