import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export function HistoryPage() {
  const mockHistory = [
    { id: 101, machine: 'HX-204', finding: 'Spindle bearing runout verified at 4.2 μm (OEM tolerance: ≤ 5.0 μm)', confidence: 0.94, date: '14m ago', status: 'pass' },
    { id: 102, machine: 'CNC-500', finding: 'Hydraulic chuck pressure below threshold (2.1 bar vs 3.5 bar nominal)', confidence: 0.64, date: '1h ago', status: 'escalated' },
    { id: 103, machine: 'LATHE-3', finding: 'Carbide insert flank wear measured at 0.18 mm (wear limit: 0.30 mm)', confidence: 0.91, date: '3h ago', status: 'pass' },
    { id: 104, machine: 'HX-204', finding: 'Drive belt tension within calibrated range (55 Hz harmonic)', confidence: 0.96, date: '5h ago', status: 'pass' },
    { id: 105, machine: 'CNC-500', finding: 'Spindle chiller temperature nominal at 21.4°C', confidence: 0.89, date: 'Yesterday', status: 'pass' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Inspection History" subtitle="Audit logs of past machine inspections" />

      <div className="space-y-3">
        {mockHistory.map((item) => (
          <Card key={item.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl text-white ${item.status === 'pass' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {item.status === 'pass' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{item.machine} Inspection</h4>
                <p className="text-xs text-slate-300 mt-0.5">{item.finding}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={item.status === 'pass' ? 'success' : 'accent'}>
                {Math.round(item.confidence * 100)}% Confidence
              </Badge>
              <span className="block text-[11px] text-slate-300 font-mono mt-1">{item.date}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
