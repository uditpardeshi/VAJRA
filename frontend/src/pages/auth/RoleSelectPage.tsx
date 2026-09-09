import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react'
import { useAuthStore, UserRole } from '@/store/authStore'
import { Card } from '@/components/ui/Card'

export function RoleSelectPage() {
  const { setRole } = useAuthStore()
  const navigate = useNavigate()

  const handleSelectRole = (r: UserRole) => {
    setRole(r)
    if (r === 'worker') navigate('/inspect')
    else if (r === 'reviewer') navigate('/dashboard')
    else navigate('/settings')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-xl">
          S
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sovereign AI Workbench</h1>
          <p className="text-slate-400 text-xs mt-1">Select your operating role to launch session</p>
        </div>

        <div className="space-y-3">
          <Card
            onClick={() => handleSelectRole('worker')}
            className="bg-slate-800 border-slate-700 hover:border-primary cursor-pointer flex items-center gap-4 text-left p-4"
          >
            <div className="p-3 bg-primary/20 text-primary rounded-xl">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Floor Worker</h3>
              <p className="text-xs text-slate-400">AR Inspection, QA Chat &amp; Document Workflow</p>
            </div>
          </Card>

          <Card
            onClick={() => handleSelectRole('reviewer')}
            className="bg-slate-800 border-slate-700 hover:border-accent cursor-pointer flex items-center gap-4 text-left p-4"
          >
            <div className="p-3 bg-accent/20 text-accent rounded-xl">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Reviewer / Manager</h3>
              <p className="text-xs text-slate-400">Command Center, Escalations &amp; Fleet Analytics</p>
            </div>
          </Card>

          <Card
            onClick={() => handleSelectRole('admin')}
            className="bg-slate-800 border-slate-700 hover:border-emerald-500 cursor-pointer flex items-center gap-4 text-left p-4"
          >
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">System Admin</h3>
              <p className="text-xs text-slate-400">Host Endpoints &amp; Model Router Settings</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
