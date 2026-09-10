import React from 'react'
import { NavLink } from 'react-router-dom'
import { Gauge, Camera, BookOpen, FileText, LayoutDashboard, AlertTriangle, Cpu, Server, Settings, FileCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function BottomNav() {
  const { role } = useAuthStore()

  const workerNav = [
    { to: '/worker-dashboard', label: 'Station', icon: Gauge },
    { to: '/inspect', label: 'Inspect', icon: Camera },
    { to: '/chat', label: 'Manuals', icon: BookOpen },
    { to: '/agent', label: 'Docs', icon: FileText },
  ]

  const reviewerNav = [
    { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
    { to: '/escalations', label: 'Alerts', icon: AlertTriangle },
    { to: '/machines', label: 'Fleet', icon: Cpu },
    { to: '/reports', label: 'Reports', icon: FileCheck },
  ]

  const adminNav = [
    { to: '/admin-dashboard', label: 'Ops', icon: Server },
    { to: '/settings', label: 'Endpoints', icon: Settings },
    { to: '/machines', label: 'Catalog', icon: Cpu },
    { to: '/reports', label: 'Reports', icon: FileCheck },
  ]

  const items = role === 'worker' ? workerNav : role === 'reviewer' ? reviewerNav : adminNav

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-1 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all ${
                isActive ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
