import React from 'react'
import { NavLink } from 'react-router-dom'
import { Camera, MessageSquare, FileText, LayoutDashboard, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function BottomNav() {
  const { role } = useAuthStore()

  const workerNav = [
    { to: '/inspect', label: 'Inspect', icon: Camera },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/agent', label: 'Agent', icon: FileText },
  ]

  const reviewerNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/escalations', label: 'Escalations', icon: AlertTriangle },
  ]

  const items = role === 'worker' ? workerNav : reviewerNav

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
