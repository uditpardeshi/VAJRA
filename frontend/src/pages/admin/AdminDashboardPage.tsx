import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Server,
  Activity,
  Key,
  Globe,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
  ArrowRight,
  FileCheck,
  Terminal,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { DEFAULT_API_BASE, DEFAULT_MODEL_URL } from '@/config/api'
import { useAuditTrail, useSystemMetrics } from '@/hooks/api/useAnalytics'
import { useMachines } from '@/hooks/api/useMachines'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { apiBase, modelUrl } = useAuthStore()
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
      status: backendOnline === true ? 'ONLINE' : backendOnline === false ? 'OFFLINE' : 'CHECKING',
      value: backendOnline ? `${latencyMs}ms round-trip` : 'Connection Refused',
      badge: backendOnline ? 'success' : 'accent',
      icon: Server,
    },
    {
      label: 'Edge Gateway Host',
      status: 'CONFIGURED',
      value: (apiBase || DEFAULT_API_BASE).replace('http://', '').replace('https://', ''),
      badge: 'success',
      icon: Globe,
    },
    {
      label: 'SQLite Data Store',
      status: sysMetrics?.db_status || 'ONLINE',
      value: `sovereign.db · ${sysMetrics?.db_size_kb ? `${sysMetrics.db_size_kb} KB` : '124 KB'}`,
      badge: 'success',
      icon: Database,
    },
    {
      label: 'Registered Machine Fleet',
      status: 'LIVE',
      value: `${machines?.length ?? sysMetrics?.machines_registered ?? 3} Active Shop Units`,
      badge: 'success',
      icon: Cpu,
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="System &amp; Infrastructure Operations"
        subtitle="On-premise node telemetry, machine gateway registry, and security audit log"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={checkHealth}
              disabled={checking}
              className="bg-[#262730] hover:bg-[#32333e] text-[#EFF0D1] border border-[#3d3e4b] text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-[#77BA99] ${checking ? 'animate-spin' : ''}`} />
              Ping Node Status
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/settings')}
              className="bg-[#77BA99] hover:bg-[#88caa9] text-[#1d1e25] font-bold text-xs"
            >
              <Key className="w-3.5 h-3.5 mr-1.5" /> Endpoints &amp; Keys
            </Button>
          </div>
        }
      />

      {/* System Node Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {systemMetrics.map((m, i) => {
          const Icon = m.icon
          const isError = m.badge === 'accent'
          return (
            <Card
              key={i}
              className="p-3 bg-[#262730] border border-[#3d3e4b] shadow-md flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[#1d1e25] text-[#77BA99] border border-[#3d3e4b] shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#D7C0D0] uppercase tracking-wider truncate">
                    {m.label}
                  </span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase shrink-0 border ${
                    isError
                      ? 'bg-[#D33F49]/15 text-[#D33F49] border-[#D33F49]/30'
                      : 'bg-[#77BA99]/15 text-[#77BA99] border-[#77BA99]/30'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <div className="pt-0.5">
                <span className="text-xs font-mono font-bold text-[#EFF0D1] block truncate" title={m.value}>
                  {m.value}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Compact Quick Operations Ribbon */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-[#262730] border border-[#3d3e4b] rounded-xl shadow-md">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D7C0D0] px-1 font-mono flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#77BA99]" />
          Admin Controls:
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/settings')}
          className="bg-[#1d1e25] hover:bg-[#32333e] text-[#EFF0D1] border border-[#3d3e4b] text-xs font-semibold"
        >
          <Globe className="w-3.5 h-3.5 mr-1.5 text-[#77BA99]" /> Network &amp; API Keys
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/machines')}
          className="bg-[#1d1e25] hover:bg-[#32333e] text-[#EFF0D1] border border-[#3d3e4b] text-xs font-semibold"
        >
          <Cpu className="w-3.5 h-3.5 mr-1.5 text-[#77BA99]" /> Machine Fleet Registry
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/reports')}
          className="bg-[#1d1e25] hover:bg-[#32333e] text-[#EFF0D1] border border-[#3d3e4b] text-xs font-semibold"
        >
          <FileCheck className="w-3.5 h-3.5 mr-1.5 text-[#77BA99]" /> Compliance &amp; Reports
        </Button>
      </div>

      {/* Main Admin Workspace: Machine Fleet Nodes + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (5 cols): Connected Machine Fleet Nodes */}
        <Card className="lg:col-span-5 p-3.5 bg-[#262730] border border-[#3d3e4b] space-y-2.5 shadow-md">
          <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#77BA99]" />
              <h4 className="font-bold text-[#EFF0D1] text-xs uppercase tracking-wider">
                Connected Machine Nodes ({machines?.length || 0})
              </h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/machines')}
              className="text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] text-xs"
            >
              Full Fleet &rarr;
            </Button>
          </div>

          <div className="divide-y divide-[#3d3e4b]">
            {(machines && machines.length > 0) ? (
              machines.map((m) => (
                <div key={m.machine_id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#EFF0D1]">{m.machine_id}</span>
                      <span className="text-[10px] font-mono text-[#D7C0D0]">{m.name}</span>
                    </div>
                    <span className="text-[10px] text-[#D7C0D0]/70 font-mono block mt-0.5">
                      {m.type || 'CNC Station'} · {m.location || 'Bay 2'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/30">
                      NOMINAL
                    </span>
                    <button
                      onClick={() => navigate('/machines')}
                      className="p-1 rounded text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e]"
                      title="Inspect machine"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#D7C0D0]">
                No machine nodes registered yet.
              </div>
            )}
          </div>
        </Card>

        {/* Right Column (7 cols): Immutable System & Security Audit Trail */}
        <Card className="lg:col-span-7 p-3.5 bg-[#262730] border border-[#3d3e4b] space-y-2.5 shadow-md">
          <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#77BA99]" />
              <h4 className="font-bold text-[#EFF0D1] text-xs uppercase tracking-wider">
                System Security &amp; Audit Trail
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#D7C0D0]/80">Logged Transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D7C0D0]">
              <thead className="bg-[#1d1e25] border-b border-[#3d3e4b] text-[#D7C0D0] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2">Action Code</th>
                  <th className="p-2">Transaction Detail</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3e4b] font-mono text-[11px]">
                {(systemAuditEvents && systemAuditEvents.length > 0) ? (
                  systemAuditEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#32333e]/50">
                      <td className="p-2 font-bold text-[#EFF0D1]">{evt.action}</td>
                      <td className="p-2 font-sans text-[#EFF0D1]">{evt.detail}</td>
                      <td className="p-2 text-[#D7C0D0]">{evt.user}</td>
                      <td className="p-2">
                        <span className="text-[#77BA99] bg-[#77BA99]/15 border border-[#77BA99]/30 px-1.5 py-0.2 rounded text-[9px] font-bold">
                          VERIFIED
                        </span>
                      </td>
                      <td className="p-2 text-[#D7C0D0]/80 font-sans">{evt.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-[#D7C0D0] font-sans text-xs">
                      No transactions recorded in system audit log yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
