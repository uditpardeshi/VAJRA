import React from 'react'
import { ShieldCheck, Wifi, UserCheck, Menu } from 'lucide-react'
import { useAuthStore, UserRole } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export function TopBar() {
  const { role, setRole, userName } = useAuthStore()
  const { toggleSidebar } = useUIStore()

  const roles: { id: UserRole; label: string }[] = [
    { id: 'worker', label: 'Worker' },
    { id: 'reviewer', label: 'Reviewer' },
    { id: 'admin', label: 'Admin' },
  ]

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20">
            S
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">SOVEREIGN AI</span>
            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-semibold">ON-PREM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === r.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-xs font-medium text-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden md:inline">{userName} ({role})</span>
        </div>
      </div>
    </header>
  )
}
