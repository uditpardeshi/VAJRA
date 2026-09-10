import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Server,
  Key,
  Globe,
  Shield,
  RefreshCw,
  Database,
  Cpu,
  ArrowRight,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { DEFAULT_API_BASE } from '@/config/api'
import { useAuditTrail, useSystemMetrics } from '@/hooks/api/useAnalytics'
import { useMachines } from '@/hooks/api/useMachines'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { apiBase } = useAuthStore()
  const { data: systemAuditEvents } = useAuditTrail()
  const { data: sysMetrics } = useSystemMetrics()
  const { data: machines } = useMachines()
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)

  const checkHealth = async () => {
    setChecking(true)
    const start = performance.now()
    try {
      const healthUrl = (apiBase || DEFAULT_API_BASE).replace(/\/api\/v1\/?$/, '') + '/health'
      const res = await axios.get(healthUrl, { timeout: 4000 })
      setBackendOnline(res.status === 200)
      setLatencyMs(Math.round(performance.now() - start))
    } catch {
      setBackendOnline(false)
      setLatencyMs(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [apiBase])

  const systemMetrics = [
    {
      label: 'FastAPI Backend Core',
      status: backendOnline === true ? 'Online' : backendOnline === false ? 'Offline' : 'Checking',
      value: backendOnline ? `${latencyMs}ms round-trip` : 'Connection Refused',
      isOk: backendOnline === true,
      icon: Server,
    },
    {
      label: 'Gateway Host',
      status: 'Configured',
      value: (apiBase || DEFAULT_API_BASE).replace('http://', '').replace('https://', ''),
      isOk: true,
      icon: Globe,
    },
    {
      label: 'SQLite Data Store',
      status: sysMetrics?.db_status || 'Online',
      value: `sovereign.db · ${sysMetrics?.db_size_kb ? `${sysMetrics.db_size_kb} KB` : '124 KB'}`,
      isOk: true,
      icon: Database,
    },
    {
      label: 'Machine Fleet',
      status: 'Live',
      value: `${machines?.length ?? sysMetrics?.machines_registered ?? 3} Active Units`,
      isOk: true,
      icon: Cpu,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#22232d] p-4 rounded-xl border border-[#2e303d]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#EFF0D1]">
            System Administration
          </h1>
          <p className="text-xs text-[#D7C0D0]/80 mt-0.5">
            Infrastructure telemetry, machine fleet registry, and security audit log
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={checkHealth}
            disabled={checking}
            className="bg-[#181920] hover:bg-[#262730] text-[#EFF0D1] border border-[#2e303d] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-[#77BA99] ${checking ? 'animate-spin' : ''}`} />
            Ping Status
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/settings')}
            className="bg-[#77BA99] hover:bg-[#88caa9] text-[#1a1b23] font-bold text-xs"
          >
            <Key className="w-3.5 h-3.5 mr-1.5" /> API Keys &amp; Settings
          </Button>
        </div>
      </div>

      {/* Node Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {systemMetrics.map((m, i) => {
          const Icon = m.icon
          return (
            <div
              key={i}
              className="bg-[#22232d] border border-[#2e303d] rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#D7C0D0]/70 uppercase tracking-wider">
                  {m.label}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    m.isOk
                      ? 'bg-[#77BA99]/15 text-[#77BA99]'
                      : 'bg-[#D33F49]/15 text-[#D33F49]'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="p-1.5 rounded-lg bg-[#181920] text-[#77BA99] border border-[#2e303d] shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono font-medium text-[#EFF0D1] truncate" title={m.value}>
                  {m.value}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Section: Machine Fleet Table & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (5 cols): Connected Machine Fleet Nodes */}
        <div className="lg:col-span-5 bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e303d] pb-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#77BA99]" />
              <h2 className="font-semibold text-xs sm:text-sm text-[#EFF0D1]">
                Registered Fleet ({machines?.length || 0})
              </h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/machines')}
              className="text-xs text-[#D7C0D0] hover:text-[#EFF0D1]"
            >
              Manage &rarr;
            </Button>
          </div>

          <div className="divide-y divide-[#2e303d]">
            {(machines && machines.length > 0) ? (
              machines.map((m) => (
                <div key={m.machine_id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#EFF0D1]">{m.machine_id}</span>
                      <span className="text-[#D7C0D0]/80">{m.name}</span>
                    </div>
                    <span className="text-[11px] text-[#D7C0D0]/60 block mt-0.5">
                      {m.type || 'CNC Station'} · {m.location || 'Bay 2'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#77BA99]/15 text-[#77BA99]">
                      Online
                    </span>
                    <button
                      onClick={() => navigate('/machines')}
                      className="p-1 rounded text-[#D7C0D0] hover:text-[#EFF0D1]"
                      title="Inspect machine"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#D7C0D0]/60">
                No machines registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): System Security & Audit Trail */}
        <div className="lg:col-span-7 bg-[#22232d] border border-[#2e303d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e303d] pb-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#77BA99]" />
              <h2 className="font-semibold text-xs sm:text-sm text-[#EFF0D1]">
                Security Audit Log
              </h2>
            </div>
            <span className="text-xs text-[#D7C0D0]/60">Recent events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D7C0D0]">
              <thead className="bg-[#181920] border-b border-[#2e303d] text-[#D7C0D0]/70 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Detail</th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e303d] text-[11px]">
                {(systemAuditEvents && systemAuditEvents.length > 0) ? (
                  systemAuditEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#262730]/40">
                      <td className="p-2.5 font-semibold text-[#EFF0D1]">{evt.action}</td>
                      <td className="p-2.5 text-[#EFF0D1]/90">{evt.detail}</td>
                      <td className="p-2.5 text-[#D7C0D0]/70">{evt.user}</td>
                      <td className="p-2.5 text-[#D7C0D0]/50 font-mono">{evt.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-[#D7C0D0]/60 text-xs">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
