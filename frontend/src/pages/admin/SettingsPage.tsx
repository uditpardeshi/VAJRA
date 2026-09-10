import React, { useState } from 'react'
import axios from 'axios'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Save, Activity, Key, Globe, Radio, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { DEFAULT_API_BASE, DEFAULT_MODEL_URL, DEFAULT_API_KEY } from '@/config/api'

export function SettingsPage() {
  const {
    apiBase,
    setApiBase,
    wsBase,
    setWsBase,
    modelUrl,
    setModelUrl,
    apiKey,
    setApiKey,
  } = useAuthStore()

  const [localApiBase, setLocalApiBase] = useState(apiBase || DEFAULT_API_BASE)
  const [localWsBase, setLocalWsBase] = useState(wsBase || 'ws://localhost:8000/api/v1')
  const [localModelUrl, setLocalModelUrl] = useState(modelUrl || DEFAULT_MODEL_URL)
  const [localApiKey, setLocalApiKey] = useState(apiKey || DEFAULT_API_KEY)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ backend?: boolean; model?: boolean; message?: string } | null>(null)

  const toast = useToast()

  const handleSave = () => {
    setApiBase(localApiBase.trim())
    setWsBase(localWsBase.trim())
    setModelUrl(localModelUrl.trim())
    setApiKey(localApiKey.trim())
    toast.success('Configuration saved successfully')
  }

  const handleReset = () => {
    setLocalApiBase(DEFAULT_API_BASE)
    setLocalWsBase('ws://localhost:8000/api/v1')
    setLocalModelUrl(DEFAULT_MODEL_URL)
    setLocalApiKey(DEFAULT_API_KEY)
    setApiBase(DEFAULT_API_BASE)
    setWsBase('ws://localhost:8000/api/v1')
    setModelUrl(DEFAULT_MODEL_URL)
    setApiKey(DEFAULT_API_KEY)
    toast.info('Reset to default endpoints')
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    const result: { backend?: boolean; model?: boolean; message?: string } = {}

    // 1. Test Backend API
    try {
      const backendHealthUrl = localApiBase.replace(/\/api\/v1\/?$/, '') + '/health'
      const res = await axios.get(backendHealthUrl, { timeout: 5000 })
      result.backend = res.status === 200
    } catch {
      result.backend = false
    }

    // 2. Test Model ngrok endpoint
    try {
      const cleanModelUrl = localModelUrl.replace(/\/$/, '')
      const res = await axios.post(
        `${cleanModelUrl}/api/chat`,
        {
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VAJRA-KEY': localApiKey,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        }
      )
      result.model = res.status === 200
    } catch (err: any) {
      result.model = false
      result.message = err?.response?.data?.message || err?.message || 'Model endpoint unreachable'
    }

    setTestResult(result)
    setTesting(false)

    if (result.backend || result.model) {
      toast.success('Connectivity test completed')
    } else {
      toast.error('Could not reach configured endpoints')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="System & Network Settings"
        subtitle="Configure on-premise backend endpoints, model access keys, and ngrok tunnel"
      />

      <Card className="space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Backend API Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            FastAPI on-premise backend for inspection records, RAG manuals, and audit logs.
          </p>
        </div>

        <Input
          label="Backend API Base URL"
          value={localApiBase}
          onChange={(e) => setLocalApiBase(e.target.value)}
          placeholder="http://localhost:8000/api/v1"
        />

        <Input
          label="WebSocket Base URL"
          value={localWsBase}
          onChange={(e) => setLocalWsBase(e.target.value)}
          placeholder="ws://localhost:8000/api/v1"
        />
      </Card>

      <Card className="space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-accent" /> Model Access & Tunnel (VAJRA)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ngrok tunnel URL and API Key for direct sovereign model inference referenced from backend/api.py.
          </p>
        </div>

        <Input
          label="Model Ngrok / Inference URL"
          value={localModelUrl}
          onChange={(e) => setLocalModelUrl(e.target.value)}
          placeholder="https://elmiest-julieta-unmelodramatically.ngrok-free.dev"
        />

        <Input
          label="Model API Key (X-VAJRA-KEY)"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
          placeholder="VAJRA-2026-SECRET"
          type="password"
        />
      </Card>

      {/* Connectivity Status Display */}
      {testResult && (
        <Card className="bg-slate-50 border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Connection Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <Activity className="w-4 h-4" /> FastAPI Backend ({localApiBase})
              </span>
              {testResult.backend ? (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs bg-amber-50 px-2 py-1 rounded">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline / Unreachable
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <Radio className="w-4 h-4" /> Ngrok Model ({localModelUrl})
              </span>
              {testResult.model ? (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs bg-amber-50 px-2 py-1 rounded">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline / Check Tunnel
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1.5" /> Save Configuration
        </Button>
        <Button variant="secondary" onClick={handleTestConnection} disabled={testing}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Test Connections'}
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
