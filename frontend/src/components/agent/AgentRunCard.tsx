import React from 'react'
import { CheckCircle2, Wrench, FileCheck, ArrowRight, Download } from 'lucide-react'
import type { AgentRunResponse } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export interface AgentRunCardProps {
  run: AgentRunResponse
}

export function AgentRunCard({ run }: AgentRunCardProps) {
  return (
    <Card className="space-y-4 bg-white border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs text-slate-400 font-bold uppercase">Verification Run #{run.run_id}</span>
          <h4 className="font-bold text-slate-900 text-sm">Target Equipment: {run.machine_id || 'Standard Machinery'}</h4>
        </div>
        <Badge variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'accent' : 'warning'}>
          {run.status.toUpperCase()}
        </Badge>
      </div>

      {/* Tool Execution Trace */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verification Steps &amp; Execution Trace</span>
        <div className="space-y-1.5">
          {run.tool_trace?.map((trace, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
              <div className="flex items-center gap-2 font-mono font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{trace.tool}</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">{trace.duration_ms}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Output */}
      {run.result && (
        <div className="p-4 bg-primary-50/40 border border-primary-100 rounded-xl space-y-2 text-xs text-slate-700">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">Engineering Assessment:</div>
          {run.result.equipment && <p><strong>Equipment Identified:</strong> {run.result.equipment}</p>}
          {run.result.measured_thickness_mm !== undefined && (
            <p className="font-mono">
              <strong>Measured Thickness:</strong> {run.result.measured_thickness_mm} mm{' '}
              <span className="text-slate-400">(Required: {run.result.required_thickness_mm} mm)</span>
            </p>
          )}
          {run.result.recommendation && <p><strong>Action / Recommendation:</strong> {run.result.recommendation}</p>}

          {run.result.report_path && (
            <div className="pt-2">
              <Button size="sm" variant="accent" onClick={() => window.open(run.result.report_path, '_blank')}>
                <Download className="w-4 h-4 mr-1.5" /> Download Formal Audit Report (.DOCX)
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
