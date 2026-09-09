import React from 'react'
import { NavLink } from 'react-router-dom'
import { Camera, MessageSquare, FileText, LayoutDashboard, AlertTriangle, Cpu, Settings, History, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export function SideNav() {
  const { role } = useAuthStore()
  const { sidebarOpen } = useUIStore()

  const workerNav = [
    { to: '/inspect', label: 'Camera Inspect', icon: Camera },
    { to: '/chat', label: 'Manual QA Chat', icon: MessageSquare },
    { to: '/agent', label: 'Doc Workflow', icon: FileText },
    { to: '/history', label: 'History', icon: History },
  ]

  const reviewerNav = [
    { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { to: '/escalations', label: 'Escalations', icon: AlertTriangle },
    { to: '/machines', label: 'Fleet Health', icon: Cpu },
  ]

  const adminNav = [
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  const items = role === 'worker' ? workerNav : role === 'reviewer' ? reviewerNav : [...workerNav, ...reviewerNav, ...adminNav]

  return (
    <aside
      className={cn(
        'fixed lg:sticky top-16 z-20 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 w-64 transition-all duration-200 flex flex-col justify-between p-4',
        !sidebarOpen && 'hidden lg:flex'
      )}
    >
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</div>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          )
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Ollama Host</span>
          <span className="text-emerald-600 font-mono text-[10px]">CONNECTED</span>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">qwen2-vl & llama3.2</p>
      </div>
    </aside>
  )
}
