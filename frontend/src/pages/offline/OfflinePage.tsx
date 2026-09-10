import React from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full mb-4">
        <WifiOff className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold text-white mb-1">Local Network Offline</h2>
      <p className="text-sm text-slate-300 max-w-sm mb-6">
        Your inspections will be queued in IndexedDB and automatically synced once connected.
      </p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
      </Button>
    </div>
  )
}
