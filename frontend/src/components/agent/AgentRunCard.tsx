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
    <Card className="space-y-4 bg-[#111927] border border-[#23334d]">
      <div className="flex items-center justify-between border-b border-[#23334d] pb-3">
        <div>
          <span className="text-xs text-slate-300 font-bold uppercase">Verification Run #{run.run_id}</span>
          <h4 className="font-bold text-white text-base">Target Equipment: {run.machine_id || 'Standard Machinery'}</h4>
        </div>
        <Badge variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'accent' : 'warning'}>
          {run.status.toUpperCase()}
        </Badge>
      </div>

      {/* Tool Execution Trace */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Verification Steps &amp; Execution Trace</span>
        <div className="space-y-1.5">
          {run.tool_trace?.map((trace, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-[#0c1220] border border-[#23334d] rounded-xl text-xs">
              <div className="flex items-center gap-2 font-mono font-semibold text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{trace.tool}</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">{trace.duration_ms}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Output */}
      {run.result && (
        <div className="p-4 bg-[#142033] border border-[#2d4163] rounded-xl space-y-2 text-xs text-slate-100">
          <div className="font-bold text-white text-xs uppercase tracking-wider">Engineering Assessment:</div>
          {run.result.equipment && <p><strong className="text-white">Equipment Identified:</strong> {run.result.equipment}</p>}
          {run.result.measured_thickness_mm !== undefined && (
            <p className="font-mono">
              <strong className="text-white">Measured Thickness:</strong> {run.result.measured_thickness_mm} mm{' '}
              <span className="text-slate-400">(Required: {run.result.required_thickness_mm} mm)</span>
            </p>
          )}
          {run.result.recommendation && <p><strong className="text-white">Action / Recommendation:</strong> {run.result.recommendation}</p>}

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
