import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Save } from 'lucide-react'

export function SettingsPage() {
  const { apiBase, setApiBase, wsBase } = useAuthStore()
  const [url, setUrl] = useState(apiBase)
  const toast = useToast()

  const handleSave = () => {
    setApiBase(url)
    toast.success('Configuration saved')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System &amp; Network Settings" subtitle="Configure on-premise backend endpoints and model registry" />

      <Card className="space-y-4 max-w-xl">
        <h3 className="font-bold text-slate-900 text-sm">FastAPI Endpoint Configuration</h3>
        <Input
          label="Backend API Base URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:8000/api/v1"
        />
        <Input
          label="WebSocket Base URL"
          value={wsBase}
          disabled
        />
        <Button variant="primary" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" /> Save Settings
        </Button>
      </Card>
    </div>
  )
}
