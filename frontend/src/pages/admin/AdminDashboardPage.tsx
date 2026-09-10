import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Server, Activity, Key, Globe, Shield, RefreshCw, CheckCircle2, AlertTriangle, Database, Cpu, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { DEFAULT_API_BASE, DEFAULT_MODEL_URL } from '@/config/api'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { apiBase, modelUrl, wsBase } = useAuthStore()
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
      value: backendOnline ? `${latencyMs}ms latency` : 'Connection Refused',
      badge: backendOnline ? 'success' : 'accent',
      icon: Server,
    },
    {
      label: 'Model Inference Tunnel',
      status: 'CONFIGURED',
      value: (modelUrl || DEFAULT_MODEL_URL).replace('https://', '').slice(0, 24) + '...',
      badge: 'success',
      icon: Cpu,
    },
    {
      label: 'Local SQLite / ChromaDB',
      status: 'INITIALIZED',
      value: 'sovereign.db · 3 manuals vector-indexed',
      badge: 'success',
      icon: Database,
    },
    {
      label: 'WebSocket Alerts Bus',
      status: 'ACTIVE',
      value: wsBase || 'ws://localhost:8000/api/v1',
      badge: 'warning',
      icon: Activity,
    },
  ]

  const systemAuditEvents = [
    { id: 1, action: 'CONFIG_SYNC', detail: 'Settings updated with ngrok tunnel endpoint', user: 'Admin (avoxb)', time: '8m ago', status: 'ok' },
    { id: 2, action: 'INSPECTION_STORE', detail: 'Stored AR inspection #104 on HX-204 with 0.88 confidence', user: 'Technician', time: '18m ago', status: 'ok' },
    { id: 3, action: 'RAG_QUERY', detail: 'Retrieved 3 manual chunks for spindle runout', user: 'Technician', time: '35m ago', status: 'ok' },
    { id: 4, action: 'ESCALATION_RESOLVE', detail: 'Reviewed and closed escalation #101 with note', user: 'Lead Reviewer', time: '1h ago', status: 'ok' },
    { id: 5, action: 'AGENT_RUN', detail: 'Analyzed thickness sheet; issued DOCX compliance report', user: 'Technician', time: '2h ago', status: 'ok' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="System &amp; Infrastructure Operations"
        subtitle="On-premise runtime telemetry, model router state, and audit logs"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={checkHealth} disabled={checking}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${checking ? 'animate-spin' : ''}`} />
              Refresh Node Status
            </Button>
            <Button size="sm" variant="primary" onClick={() => navigate('/settings')}>
              <Key className="w-3.5 h-3.5 mr-1.5" /> Endpoints &amp; Keys
            </Button>
          </div>
        }
      />

      {/* System Node Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {systemMetrics.map((m, i) => {
          const Icon = m.icon
          return (
            <Card
              key={i}
              className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-soft transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate" title={m.label}>
                    {m.label}
                  </span>
                </div>
                <Badge variant={m.badge as any} size="sm" className="shrink-0 font-bold uppercase tracking-wider text-[10px]">
                  {m.status}
                </Badge>
              </div>

              <div className="pt-0.5">
                <span className="text-sm font-mono font-bold text-slate-900 block truncate" title={m.value}>
                  {m.value}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Admin Quick Launch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card
          onClick={() => navigate('/settings')}
          className="p-4 border border-slate-200 hover:border-primary-400 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Network Endpoints &amp; API Keys</h4>
          <p className="text-xs text-slate-500">
            Configure FastAPI URL, Ngrok tunnel, X-VAJRA-KEY token, and run live ping connectivity diagnostics.
          </p>
        </Card>

        <Card
          onClick={() => navigate('/machines')}
          className="p-4 border border-slate-200 hover:border-primary-400 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Cpu className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Equipment Registry &amp; Specs</h4>
          <p className="text-xs text-slate-500">
            Catalog of registered CNCs, lathes, OEM maintenance PDFs, and baseline parameter envelopes.
          </p>
        </Card>

        <Card
          onClick={() => navigate('/reports')}
          className="p-4 border border-slate-200 hover:border-primary-400 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Compliance &amp; Audit Reports</h4>
          <p className="text-xs text-slate-500">
            Export formal inspection reports, review historical agent runs, and download generated audit artifacts.
          </p>
        </Card>
      </div>

      {/* System Audit Trail Table */}
      <Card className="p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Immutable System &amp; Security Audit Trail
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-medium">5 Latest Logged Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-2.5">Action Code</th>
                <th className="p-2.5">Transaction Detail</th>
                <th className="p-2.5">Principal / User</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Elapsed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {systemAuditEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-bold text-slate-800">{evt.action}</td>
                  <td className="p-2.5 font-sans text-slate-600">{evt.detail}</td>
                  <td className="p-2.5 text-slate-500">{evt.user}</td>
                  <td className="p-2.5">
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      VERIFIED
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-400 font-sans">{evt.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
