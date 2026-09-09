import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ReportsPage() {
  const mockReports = [
    { id: 'REP-2026-001', name: 'HX-204 Spindle Inspection Report.docx', date: '2026-09-09', size: '245 KB' },
    { id: 'REP-2026-002', name: 'CNC-500 Coolant Pressure Audit.docx', date: '2026-09-08', size: '180 KB' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Generated Reports Browser" subtitle="DOCX / PDF inspection summaries created by agent" />

      <div className="space-y-3">
        {mockReports.map((r) => (
          <Card key={r.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                <span className="text-xs text-slate-400 font-mono">{r.id} · {r.date} · {r.size}</span>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
