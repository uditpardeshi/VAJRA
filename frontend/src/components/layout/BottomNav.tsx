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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-12 bg-[#262730]/95 backdrop-blur-lg border-t border-[#3d3e4b] z-40 flex items-center justify-around px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-[#77BA99] font-bold drop-shadow-[0_0_8px_rgba(119,186,153,0.5)]'
                  : 'text-[#D7C0D0]/75 hover:text-[#EFF0D1]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[64px] tracking-tight">{item.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
