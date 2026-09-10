import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, LayoutDashboard, Shield, Menu, ChevronDown } from 'lucide-react'
import { useAuthStore, UserRole } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export function TopBar() {
  const navigate = useNavigate()
  const { role, setRole, userName } = useAuthStore()
  const { toggleSidebar } = useUIStore()

  const roles: { id: UserRole; label: string; icon: any; defaultRoute: string }[] = [
    { id: 'worker', label: 'Technician', icon: Wrench, defaultRoute: '/worker-dashboard' },
    { id: 'reviewer', label: 'Reviewer', icon: LayoutDashboard, defaultRoute: '/dashboard' },
    { id: 'admin', label: 'Admin', icon: Shield, defaultRoute: '/admin-dashboard' },
  ]

  const handleRoleSelect = (selectedRole: UserRole, route: string) => {
    setRole(selectedRole)
    navigate(route)
  }

  return (
    <header className="h-14 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 text-slate-600 hover:bg-slate-100/80 active:bg-slate-200 rounded-xl lg:hidden transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Logo & Pill Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 via-primary to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs tracking-wider ring-2 ring-sky-100">
            V
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              VAJRA <span className="text-[11px] font-semibold text-primary">AI</span>
            </span>

            {/* Model Selector Pill (matching the image) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-100/70 cursor-pointer transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Qwen 3.0 Pro</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Role Selector Tabs & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role pills */}
        <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full border border-slate-200/60 shadow-2xs">
          {roles.map((r) => {
            const Icon = r.icon
            const active = role === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id, r.defaultRoute)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            )
          })}
        </div>

        {/* User Avatar Circle */}
        <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[11px] ring-2 ring-white shadow-2xs">
              {userName?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
          </div>
          <span className="hidden md:inline font-sans text-xs text-slate-700 font-semibold">{userName}</span>
        </div>
      </div>
    </header>
  )
}
