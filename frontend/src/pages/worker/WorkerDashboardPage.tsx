import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Gauge,
  Clock,
  History,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMachines } from '@/hooks/api/useMachines'
import { useDashboardMetrics, useShiftActivity, useMachineHealth } from '@/hooks/api/useAnalytics'
import { MachineSelector } from '@/components/common/MachineSelector'

export function WorkerDashboardPage() {
  const navigate = useNavigate()
  const { userName, currentMachine, setCurrentMachine } = useAuthStore()
  const { data: machines } = useMachines()
  const { data: metrics } = useDashboardMetrics()
  const { data: shiftActivities } = useShiftActivity()
  const { data: machineHealth } = useMachineHealth()

  const activeMachine = currentMachine || (machines && machines[0])
  const activeMachineId = activeMachine?.machine_id || 'HX-204'
  const activeHealth = machineHealth?.find((mh) => mh.machine_id === activeMachineId)

  // Parse active machine specs dynamically
  let specs: any = null
  try {
    if (activeMachine?.specs_json) {
      specs = typeof activeMachine.specs_json === 'string' ? JSON.parse(activeMachine.specs_json) : activeMachine.specs_json
    }
  } catch {
    specs = null
  }

  const shiftStats = [
    {
      label: 'Inspections Done',
      value: String(metrics?.inspections_today ?? 0),
      sub: 'Shift Target: 20 parts',
      icon: Camera,
      color: 'bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/30',
    },
    {
      label: 'Tolerance Pass Rate',
      value: '98.2%',
      sub: 'ISO 230-2 Verified',
      icon: CheckCircle2,
      color: 'bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/30',
    },
    {
      label: 'Active Escalations',
      value: String(metrics?.pending_escalations ?? 0),
      sub: (metrics?.pending_escalations ?? 0) > 0 ? 'Supervisor Action Req.' : '0 Out of Spec',
      icon: AlertTriangle,
      color: (metrics?.pending_escalations ?? 0) > 0
        ? 'bg-[#D33F49]/15 text-[#D33F49] border border-[#D33F49]/30'
        : 'bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/30',
    },
    {
      label: 'Spindle & Unit Health',
      value: `${activeHealth?.health_score ?? 96}%`,
      sub: `${activeMachineId} · In Envelope`,
      icon: Gauge,
      color: 'bg-[#262730] text-[#77BA99] border border-[#3d3e4b]',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Top Station Header */}
      <PageHeader
        title="Technician Shift Station"
        subtitle={`Operator: ${userName} · Precision Machining Unit 2`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#D7C0D0] font-medium hidden sm:inline">Assigned Unit:</span>
            <MachineSelector
              machines={machines || []}
              value={activeMachine?.machine_id || 'HX-204'}
              onChange={(id) => {
                const found = machines?.find((m) => m.machine_id === id)
                if (found) setCurrentMachine(found)
              }}
              className="w-48 sm:w-56"
            />
          </div>
        }
      />

      {/* High-Efficiency 1-Click Operational Action Strip */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-[#262730] border border-[#3d3e4b] rounded-xl shadow-md">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D7C0D0] px-1 font-mono flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#77BA99]" />
          Direct Launch:
        </span>
        <Button
          size="sm"
          onClick={() => navigate('/inspect')}
          className="bg-[#77BA99] hover:bg-[#88caa9] text-[#1d1e25] font-bold text-xs shadow-xs"
        >
          <Camera className="w-3.5 h-3.5 mr-1.5" /> Launch Camera Inspect
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/chat')}
          className="bg-[#1d1e25] hover:bg-[#32333e] text-[#EFF0D1] border border-[#3d3e4b] text-xs font-semibold"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1.5 text-[#77BA99]" /> OEM Manuals &amp; Specs
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/agent')}
          className="bg-[#1d1e25] hover:bg-[#32333e] text-[#EFF0D1] border border-[#3d3e4b] text-xs font-semibold"
        >
          <FileText className="w-3.5 h-3.5 mr-1.5 text-[#77BA99]" /> CMM / Calib Verification
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/history')}
          className="text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] text-xs ml-auto"
        >
          <History className="w-3.5 h-3.5 mr-1" /> Shift Log
        </Button>
      </div>

      {/* Compact Shift KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {shiftStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="p-3 space-y-1 bg-[#262730] border border-[#3d3e4b] shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#D7C0D0] uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-lg sm:text-xl font-black text-[#EFF0D1] tracking-tight">{stat.value}</span>
                <span className="text-[10px] text-[#D7C0D0] font-mono">{stat.sub}</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Two-Column Ergonomic Shift Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Machine Operating Baseline & Calibration Limits */}
        <Card className="p-3.5 bg-[#262730] border border-[#3d3e4b] space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#77BA99]" />
              <h4 className="font-bold text-[#EFF0D1] text-xs uppercase tracking-wider">
                Unit Baseline ({activeMachine?.machine_id || 'HX-204'})
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#77BA99]/20 text-[#77BA99] border border-[#77BA99]/40 text-[10px] font-mono font-bold">
              IN SPEC
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-[#1d1e25] border border-[#3d3e4b] rounded-lg space-y-0.5">
              <span className="text-[10px] text-[#D7C0D0] uppercase font-bold">Max Spindle Runout</span>
              <p className="font-mono font-bold text-[#EFF0D1]">
                {specs?.acceptable_spindle_runout_um ? `${specs.acceptable_spindle_runout_um} μm` : '5.0 μm'}
              </p>
              <span className="text-[9px] text-[#77BA99] font-mono block">Tolerance: ISO 230-2</span>
            </div>
            <div className="p-2 bg-[#1d1e25] border border-[#3d3e4b] rounded-lg space-y-0.5">
              <span className="text-[10px] text-[#D7C0D0] uppercase font-bold">Coolant Pressure</span>
              <p className="font-mono font-bold text-[#EFF0D1]">
                {specs?.coolant_pressure_bar ? `${specs.coolant_pressure_bar} bar` : '20 bar'}
              </p>
              <span className="text-[9px] text-[#77BA99] font-mono block">Range: 18-25 bar</span>
            </div>
            <div className="p-2 bg-[#1d1e25] border border-[#3d3e4b] rounded-lg space-y-0.5">
              <span className="text-[10px] text-[#D7C0D0] uppercase font-bold">Max Spindle Speed</span>
              <p className="font-mono font-bold text-[#EFF0D1]">
                {specs?.spindle_speed_rpm ? `${Number(specs.spindle_speed_rpm).toLocaleString()} RPM` : '12,000 RPM'}
              </p>
              <span className="text-[9px] text-[#D7C0D0] font-mono block">Direct Drive</span>
            </div>
            <div className="p-2 bg-[#1d1e25] border border-[#3d3e4b] rounded-lg space-y-0.5">
              <span className="text-[10px] text-[#D7C0D0] uppercase font-bold">Lubrication Grade</span>
              <p className="font-mono font-bold text-[#EFF0D1]">
                {specs?.oil_type || 'ISO VG 32'}
              </p>
              <span className="text-[9px] text-[#77BA99] font-mono block">Reservoir OK</span>
            </div>
          </div>

          <div className="pt-1 border-t border-[#3d3e4b] flex items-center justify-between text-[11px]">
            <span className="text-[#D7C0D0] font-mono">Calibrated: Yesterday</span>
            <button
              onClick={() => navigate('/chat')}
              className="text-[#77BA99] font-semibold hover:underline flex items-center gap-1"
            >
              Verify In Manual &rarr;
            </button>
          </div>
        </Card>

        {/* Right Column (2 cols wide): Live Part Inspections Stream */}
        <Card className="lg:col-span-2 p-3.5 bg-[#262730] border border-[#3d3e4b] space-y-2.5 shadow-md">
          <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#77BA99]" />
              <h4 className="font-bold text-[#EFF0D1] text-xs uppercase tracking-wider">
                Shift Part Inspection Log (Live)
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate('/inspect')}
                className="bg-[#1d1e25] text-[#77BA99] border border-[#3d3e4b] hover:bg-[#32333e] text-xs"
              >
                + Inspect Next Part
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/history')}
                className="text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] text-xs"
              >
                Full History &rarr;
              </Button>
            </div>
          </div>

          <div className="divide-y divide-[#3d3e4b]">
            {(shiftActivities && shiftActivities.length > 0) ? (
              shiftActivities.map((act) => {
                const isPass = act.type === 'pass'
                return (
                  <div key={act.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isPass ? 'bg-[#77BA99]' : 'bg-[#D33F49]'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#EFF0D1]">{act.machine}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1d1e25] border border-[#3d3e4b] text-[#D7C0D0]">
                            PART-#{act.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#D7C0D0] mt-0.5">{act.test}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPass
                          ? 'bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/30'
                          : 'bg-[#D33F49]/15 text-[#D33F49] border border-[#D33F49]/30'
                      }`}>
                        {isPass ? 'PASS' : 'OUT OF SPEC'}
                      </span>
                      <span className="text-[10px] text-[#D7C0D0]/70 font-mono">{act.time}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#77BA99]/50 mx-auto" />
                <p className="text-xs text-[#EFF0D1] font-semibold">No recent part inspections logged this shift.</p>
                <p className="text-[11px] text-[#D7C0D0]">Place part in fixture and launch camera viewfinder.</p>
                <Button
                  size="sm"
                  onClick={() => navigate('/inspect')}
                  className="bg-[#77BA99] text-[#1d1e25] font-bold text-xs mt-2"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Open Viewfinder
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
