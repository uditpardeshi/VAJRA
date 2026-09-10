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
  Gauge,
  Shield,
  FileCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export function SideNav() {
  const { role } = useAuthStore()
  const { sidebarOpen } = useUIStore()

  const workerNav = [
    { to: '/worker-dashboard', label: 'Shift Station', icon: Gauge },
    { to: '/inspect', label: 'Camera Inspect', icon: Camera },
    { to: '/chat', label: 'Technical Manuals', icon: BookOpen },
    { to: '/agent', label: 'Doc Verification', icon: FileText },
    { to: '/history', label: 'Inspection Logs', icon: History },
  ]

  const reviewerNav = [
    { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { to: '/escalations', label: 'Escalations Queue', icon: AlertTriangle },
    { to: '/machines', label: 'Fleet Health & Specs', icon: Cpu },
    { to: '/reports', label: 'Audit Reports', icon: FileCheck },
  ]

  const adminNav = [
    { to: '/admin-dashboard', label: 'Operations Console', icon: Server },
    { to: '/settings', label: 'Endpoints & Keys', icon: Settings },
    { to: '/machines', label: 'Machine Catalog', icon: Cpu },
    { to: '/reports', label: 'Compliance Reports', icon: FileCheck },
  ]

  const roleMeta = {
    worker: { title: 'Technician Station', badge: 'FLOOR OPS' },
    reviewer: { title: 'Reviewer Console', badge: 'QA LEAD' },
    admin: { title: 'Admin Controls', badge: 'SYSTEM ROOT' },
  }[role] || { title: 'Navigation', badge: 'APP' }

  const items = role === 'worker' ? workerNav : role === 'reviewer' ? reviewerNav : adminNav

  return (
    <aside
      className={cn(
        'fixed lg:sticky top-11 sm:top-12 z-20 h-[calc(100vh-2.75rem)] sm:h-[calc(100vh-3rem)] bg-[#262730] border-r border-[#3d3e4b] w-56 transition-all duration-200 flex flex-col justify-between p-2 shrink-0 select-none shadow-lg lg:shadow-none',
        !sidebarOpen && 'hidden lg:flex'
      )}
    >
      <div className="space-y-1">
        <div className="px-2.5 py-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D7C0D0] font-mono">
            {roleMeta.title}
          </span>
          <span className="text-[9px] font-mono font-bold text-[#77BA99] bg-[#77BA99]/20 border border-[#77BA99]/40 px-1.5 py-0.5 rounded">
            {roleMeta.badge}
          </span>
        </div>

        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-[#77BA99]/20 text-[#77BA99] font-bold border border-[#77BA99]/50 shadow-xs'
                    : 'text-[#EFF0D1]/80 hover:bg-[#32333e] hover:text-[#EFF0D1]'
                )
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="p-2 bg-[#1d1e25] border border-[#3d3e4b] rounded-lg space-y-0.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#EFF0D1]">
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#77BA99]" />
            Shop Floor Station
          </span>
          <span className="text-[#77BA99] bg-[#77BA99]/20 border border-[#77BA99]/40 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">ONLINE</span>
        </div>
        <p className="text-[10px] text-[#D7C0D0] font-mono truncate">Bay PMU-2 · Shift A</p>
      </div>
    </aside>
  )
}
