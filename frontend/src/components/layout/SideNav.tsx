import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Camera,
  BookOpen,
  FileText,
  LayoutDashboard,
  AlertTriangle,
  Cpu,
  Settings,
  History,
  Server,
  FileCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export function SideNav() {
  const { role } = useAuthStore()
  const { sidebarOpen } = useUIStore()

  const workerNav = [
    { to: '/worker-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inspect', label: 'Camera Inspect', icon: Camera },
    { to: '/chat', label: 'Manuals & Specs', icon: BookOpen },
    { to: '/agent', label: 'Document Check', icon: FileText },
    { to: '/history', label: 'Inspection History', icon: History },
  ]

  const reviewerNav = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/escalations', label: 'Escalations Queue', icon: AlertTriangle },
    { to: '/machines', label: 'Fleet Health', icon: Cpu },
    { to: '/reports', label: 'Audit Reports', icon: FileCheck },
  ]

  const adminNav = [
    { to: '/admin-dashboard', label: 'System Overview', icon: Server },
    { to: '/settings', label: 'API & Keys', icon: Settings },
    { to: '/machines', label: 'Machine Catalog', icon: Cpu },
    { to: '/reports', label: 'Compliance Reports', icon: FileCheck },
  ]

  const items = role === 'worker' ? workerNav : role === 'reviewer' ? reviewerNav : adminNav

  return (
    <aside
      className={cn(
        'fixed lg:sticky top-13 z-20 h-[calc(100vh-3.25rem)] bg-[#1e1f29] border-r border-[#2e303d] w-52 transition-all duration-200 flex flex-col justify-between p-3 shrink-0 select-none shadow-sm lg:shadow-none',
        !sidebarOpen && 'hidden lg:flex'
      )}
    >
      <div className="space-y-1">
        <div className="px-3 py-1.5 mb-1 text-[11px] font-semibold text-[#D7C0D0]/60 uppercase tracking-wider">
          {role === 'worker' ? 'Operator Tools' : role === 'reviewer' ? 'QA Review' : 'Administration'}
        </div>

        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#77BA99]/15 text-[#77BA99] font-semibold'
                    : 'text-[#D7C0D0]/80 hover:bg-[#262730] hover:text-[#EFF0D1]'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}
