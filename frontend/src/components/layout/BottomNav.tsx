import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Camera, BookOpen, FileText, AlertTriangle, Cpu, Server, Settings, FileCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function BottomNav() {
  const { role } = useAuthStore()

  const workerNav = [
    { to: '/worker-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inspect', label: 'Inspect', icon: Camera },
    { to: '/chat', label: 'Manuals', icon: BookOpen },
    { to: '/agent', label: 'Docs', icon: FileText },
  ]

  const reviewerNav = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/escalations', label: 'Escalations', icon: AlertTriangle },
    { to: '/machines', label: 'Fleet', icon: Cpu },
    { to: '/reports', label: 'Reports', icon: FileCheck },
  ]

  const adminNav = [
    { to: '/admin-dashboard', label: 'System', icon: Server },
    { to: '/settings', label: 'API Keys', icon: Settings },
    { to: '/machines', label: 'Catalog', icon: Cpu },
    { to: '/reports', label: 'Reports', icon: FileCheck },
  ]

  const items = role === 'worker' ? workerNav : role === 'reviewer' ? reviewerNav : adminNav

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-13 bg-[#1e1f29]/95 backdrop-blur-md border-t border-[#2e303d] z-40 flex items-center justify-around px-2 shadow-md">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-md text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-[#77BA99] font-semibold'
                  : 'text-[#D7C0D0]/60 hover:text-[#EFF0D1]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[68px] tracking-tight">{item.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
