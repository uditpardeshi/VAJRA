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
        'fixed lg:sticky top-14 z-20 h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 w-60 transition-all duration-200 flex flex-col justify-between p-3 shrink-0',
        !sidebarOpen && 'hidden lg:flex'
      )}
    >
      <div className="space-y-1">
        <div className="px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            {roleMeta.title}
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
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
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-bold border border-primary-100/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Inference Engine
          </span>
          <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">READY</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono truncate">Local &amp; Tunnel Online</p>
      </div>
    </aside>
  )
}
