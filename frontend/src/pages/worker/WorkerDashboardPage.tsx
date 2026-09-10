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
  ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMachines } from '@/hooks/api/useMachines'
import { useDashboardMetrics, useShiftActivity, useMachineHealth } from '@/hooks/api/useAnalytics'

export function WorkerDashboardPage() {
  const navigate = useNavigate()
  const { userName, currentMachine } = useAuthStore()
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

  const kpis = [
    {
      label: 'Inspections Completed',
      value: String(metrics?.inspections_today ?? 0),
      detail: 'Current shift',
      icon: Camera,
      color: 'text-[#77BA99]',
    },
    {
      label: 'Quality Pass Rate',
      value: '98.2%',
      detail: 'Parts in tolerance',
      icon: CheckCircle2,
      color: 'text-[#77BA99]',
    },
    {
      label: 'Open Escalations',
      value: String(metrics?.pending_escalations ?? 0),
      detail: (metrics?.pending_escalations ?? 0) > 0 ? 'Action required' : 'No open issues',
      icon: AlertTriangle,
      color: (metrics?.pending_escalations ?? 0) > 0 ? 'text-[#D33F49]' : 'text-[#77BA99]',
    },
    {
      label: 'Active Machine Health',
      value: `${activeHealth?.health_score ?? 96}%`,
      detail: activeMachineId,
      icon: Gauge,
      color: 'text-[#77BA99]',
    },
  ]

  const workflowTools = [
    {
      title: 'Optical Defect Inspection',
      desc: 'Capture part photographs for automated surface crack, dimensional variance, and defect detection.',
      actionText: 'Start Inspection',
      route: '/inspect',
      icon: Camera,
    },
    {
      title: 'Manuals & Specifications',
      desc: 'Query OEM operating parameters, hydraulic pressure limits, torque specs, and troubleshooting procedures.',
      actionText: 'Search Manuals',
      route: '/chat',
      icon: BookOpen,
    },
    {
      title: 'CMM & Document Check',
      desc: 'Upload coordinate measurement sheets, ultrasonic logs, or calibration certs to verify tolerance limits.',
      actionText: 'Verify Document',
      route: '/agent',
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#22232d] p-4 rounded-xl border border-[#2e303d]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#EFF0D1]">
            Operator Station
          </h1>
          <p className="text-xs text-[#D7C0D0]/80 mt-0.5">
            Active Unit: <span className="font-semibold text-[#EFF0D1]">{activeMachine?.name || '5-Axis VMC'} ({activeMachineId})</span> · {activeMachine?.location || 'Bay 2'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/inspect')}
            className="bg-[#77BA99] hover:bg-[#88caa9] text-[#1a1b23] font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5" /> + New Inspection
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-[#22232d] border border-[#2e303d] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#D7C0D0]/70 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#EFF0D1] pt-0.5">
                {kpi.value}
              </div>
              <p className="text-[11px] text-[#D7C0D0]/60">
                {kpi.detail}
              </p>
            </div>
          )
        })}
      </div>

      {/* Workflow Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {workflowTools.map((tool, i) => {
          const Icon = tool.icon
          return (
            <div
              key={i}
              onClick={() => navigate(tool.route)}
              className="bg-[#22232d] border border-[#2e303d] hover:border-[#77BA99]/50 hover:bg-[#262730] p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#181920] border border-[#2e303d] flex items-center justify-center text-[#77BA99]">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#EFF0D1] group-hover:text-white transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-[#D7C0D0]/70 leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-[#2e303d] flex items-center justify-between text-xs font-semibold text-[#77BA99]">
                <span>{tool.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Column Section: Machine Baseline Specs + Recent Inspection History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (5 cols): Machine Operating Envelope */}
        <div className="lg:col-span-5 bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e303d] pb-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#77BA99]" />
              <h3 className="font-semibold text-xs sm:text-sm text-[#EFF0D1]">
                Operating Envelope ({activeMachineId})
              </h3>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="text-[11px] text-[#77BA99] hover:underline"
            >
              View Manual
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#181920] border border-[#2e303d] rounded-lg">
              <span className="text-[10px] text-[#D7C0D0]/70 block font-medium">Max Spindle Runout</span>
              <span className="text-sm font-semibold text-[#EFF0D1] block mt-0.5">
                {specs?.acceptable_spindle_runout_um ? `${specs.acceptable_spindle_runout_um} μm` : '5.0 μm'}
              </span>
            </div>
            <div className="p-2.5 bg-[#181920] border border-[#2e303d] rounded-lg">
              <span className="text-[10px] text-[#D7C0D0]/70 block font-medium">Coolant Pressure</span>
              <span className="text-sm font-semibold text-[#EFF0D1] block mt-0.5">
                {specs?.coolant_pressure_bar ? `${specs.coolant_pressure_bar} bar` : '20 bar'}
              </span>
            </div>
            <div className="p-2.5 bg-[#181920] border border-[#2e303d] rounded-lg">
              <span className="text-[10px] text-[#D7C0D0]/70 block font-medium">Max Spindle Speed</span>
              <span className="text-sm font-semibold text-[#EFF0D1] block mt-0.5">
                {specs?.spindle_speed_rpm ? `${Number(specs.spindle_speed_rpm).toLocaleString()} RPM` : '12,000 RPM'}
              </span>
            </div>
            <div className="p-2.5 bg-[#181920] border border-[#2e303d] rounded-lg">
              <span className="text-[10px] text-[#D7C0D0]/70 block font-medium">Oil Lubricant</span>
              <span className="text-sm font-semibold text-[#EFF0D1] block mt-0.5">
                {specs?.oil_type || 'ISO VG 32'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Recent Shift Activity */}
        <div className="lg:col-span-7 bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e303d] pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#77BA99]" />
              <h3 className="font-semibold text-xs sm:text-sm text-[#EFF0D1]">
                Recent Part Inspections
              </h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/history')}
              className="text-xs text-[#D7C0D0] hover:text-[#EFF0D1]"
            >
              All Inspections &rarr;
            </Button>
          </div>

          <div className="divide-y divide-[#2e303d]">
            {(shiftActivities && shiftActivities.length > 0) ? (
              shiftActivities.map((act) => {
                const isPass = act.type === 'pass'
                return (
                  <div key={act.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isPass ? 'bg-[#77BA99]' : 'bg-[#D33F49]'}`} />
                      <div>
                        <span className="font-medium text-[#EFF0D1] mr-2">{act.machine}</span>
                        <span className="text-[#D7C0D0]/80">{act.test}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isPass
                          ? 'bg-[#77BA99]/15 text-[#77BA99]'
                          : 'bg-[#D33F49]/15 text-[#D33F49]'
                      }`}>
                        {isPass ? 'Passed' : 'Action Req.'}
                      </span>
                      <span className="text-[11px] text-[#D7C0D0]/50 font-mono">{act.time}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#D7C0D0]/60">
                No inspections recorded for this shift yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
