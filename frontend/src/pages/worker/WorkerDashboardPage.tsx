import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, BookOpen, FileText, CheckCircle2, AlertTriangle, Cpu, Gauge, Clock, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMachines } from '@/hooks/api/useMachines'
import { MachineSelector } from '@/components/common/MachineSelector'

export function WorkerDashboardPage() {
  const navigate = useNavigate()
  const { userName, currentMachine, setCurrentMachine } = useAuthStore()
  const { data: machines } = useMachines()

  const activeMachine = currentMachine || (machines && machines[0])

  const quickStats = [
    { label: 'Shift Inspections', value: '18', sub: 'Today', icon: Camera, color: 'text-primary bg-primary-50' },
    { label: 'Tolerance Pass Rate', value: '94.4%', sub: 'Target: 90%', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Open Escalations', value: '1', sub: 'Under Review', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Machine Health', value: '98%', sub: activeMachine?.name || 'HX-204', icon: Gauge, color: 'text-primary bg-slate-100' },
  ]

  const shiftActivities = [
    { id: 1, type: 'pass', machine: 'HX-204', test: 'Spindle Bearing Runout', result: '4.2 μm (Limit: ≤ 5.0 μm)', time: '12m ago' },
    { id: 2, type: 'warn', machine: 'CNC-500', test: 'Hydraulic Pressure Check', result: '2.1 bar (Nominal: 3.5 bar)', time: '48m ago' },
    { id: 3, type: 'pass', machine: 'LATHE-3', test: 'Carbide Insert Flank Wear', result: '0.18 mm (Max: 0.30 mm)', time: '2h ago' },
    { id: 4, type: 'pass', machine: 'HX-204', test: 'Vibration Harmonic Baseline', result: '55 Hz (Nominal)', time: '3h ago' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Technician Shift Station"
        subtitle={`Operator: ${userName} · Active Bay: Precision Machining Unit 2`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Assigned Unit:</span>
            <MachineSelector
              machines={machines || []}
              value={activeMachine?.machine_id || 'HX-204'}
              onChange={(id) => {
                const found = machines?.find((m) => m.machine_id === id)
                if (found) setCurrentMachine(found)
              }}
              className="w-56"
            />
          </div>
        }
      />

      {/* Compact Shift KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="p-3.5 space-y-1.5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">{stat.value}</span>
                <span className="text-[11px] text-slate-400 font-medium">{stat.sub}</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Workflow Launchers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card
          onClick={() => navigate('/inspect')}
          className="p-4 border border-slate-200 hover:border-primary-400 hover:shadow-sm cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Optical Camera Inspect</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live AR defect detection, bounding reticles, and automated tolerance validation.
            </p>
          </div>
          <div className="pt-1 text-[11px] font-semibold text-primary flex items-center gap-1">
            Launch Camera Viewfinder &rarr;
          </div>
        </Card>

        <Card
          onClick={() => navigate('/chat')}
          className="p-4 border border-slate-200 hover:border-primary-400 hover:shadow-sm cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Technical Manuals &amp; Specs</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant retrieval of torque limits, pressure ranges, and OEM operating tolerances.
            </p>
          </div>
          <div className="pt-1 text-[11px] font-semibold text-primary flex items-center gap-1">
            Open Manual QA Assistant &rarr;
          </div>
        </Card>

        <Card
          onClick={() => navigate('/agent')}
          className="p-4 border border-slate-200 hover:border-primary-400 hover:shadow-sm cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Document Verification</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload thickness sheets, CMM logs, and calibration certs for compliance checks.
            </p>
          </div>
          <div className="pt-1 text-[11px] font-semibold text-primary flex items-center gap-1">
            Upload Document &rarr;
          </div>
        </Card>
      </div>

      {/* Two Column Section: Machine Specs + Shift Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Machine Baseline Profile */}
        <Card className="p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Unit Baseline Profile ({activeMachine?.machine_id || 'HX-204'})
              </h4>
            </div>
            <Badge variant="success">IN SPEC</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Max Spindle Runout</span>
              <p className="font-mono font-bold text-slate-800">5.0 μm</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Coolant Pressure</span>
              <p className="font-mono font-bold text-slate-800">3.5 – 5.0 bar</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Max Spindle Speed</span>
              <p className="font-mono font-bold text-slate-800">12,000 RPM</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Oil Lubrication</span>
              <p className="font-mono font-bold text-slate-800">ISO VG 32</p>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Last Calibration: 3 days ago</span>
            <button onClick={() => navigate('/chat')} className="text-primary font-semibold hover:underline">
              View OEM Manual &rarr;
            </button>
          </div>
        </Card>

        {/* Recent Shift Inspections */}
        <Card className="lg:col-span-2 p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Recent Shift Inspections</h4>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/history')}>
              Full History &rarr;
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {shiftActivities.map((act) => (
              <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${act.type === 'pass' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <span className="font-bold text-slate-800 mr-2">{act.machine}</span>
                    <span className="text-slate-600">{act.test}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-500">{act.result}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
