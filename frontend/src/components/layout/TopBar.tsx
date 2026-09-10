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
    <header className="h-11 sm:h-12 bg-[#262730]/95 backdrop-blur-md border-b border-[#3d3e4b] px-2.5 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] active:bg-[#1d1e25] rounded-lg lg:hidden transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Logo & Pill Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#77BA99] text-[#1d1e25] flex items-center justify-center font-black text-xs shadow-xs tracking-wider border border-[#77BA99]">
            V
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#EFF0D1] text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
              VAJRA <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#1d1e25] border border-[#3d3e4b] text-[#77BA99]">MACHINERY</span>
            </span>

            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#1d1e25] border border-[#3d3e4b] rounded-full text-[10px] font-semibold text-[#EFF0D1] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#77BA99]" />
              <span className="text-[#EFF0D1] font-mono">OEM Specs: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Role Selector Tabs & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Role pills */}
        <div className="flex items-center bg-[#1d1e25] p-0.5 rounded-full border border-[#3d3e4b] shadow-2xs">
          {roles.map((r) => {
            const Icon = r.icon
            const active = role === r.id
            const activeStyles = {
              worker: 'bg-[#77BA99]/25 text-[#77BA99] border border-[#77BA99]/60 font-bold shadow-xs',
              reviewer: 'bg-[#D7C0D0]/25 text-[#D7C0D0] border border-[#D7C0D0]/60 font-bold shadow-xs',
              admin: 'bg-[#D33F49]/25 text-[#D33F49] border border-[#D33F49]/60 font-bold shadow-xs',
            }[r.id]

            const iconColors = {
              worker: active ? 'text-[#77BA99]' : 'text-[#D7C0D0]/70',
              reviewer: active ? 'text-[#D7C0D0]' : 'text-[#D7C0D0]/70',
              admin: active ? 'text-[#D33F49]' : 'text-[#D7C0D0]/70',
            }[r.id]

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id, r.defaultRoute)}
                className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all ${
                  active
                    ? activeStyles
                    : 'text-[#D7C0D0]/80 hover:text-[#EFF0D1]'
                }`}
              >
                <Icon className={`w-3 h-3 ${iconColors}`} />
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            )
          })}
        </div>

        {/* User Avatar Circle */}
        <div className="flex items-center gap-1.5 pl-1.5 sm:border-l border-[#3d3e4b]">
          <div className="relative">
            <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-[#262730] border border-[#3d3e4b] flex items-center justify-center text-[#EFF0D1] font-bold text-[10px] shadow-2xs">
              {userName?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-[#77BA99] ring-1 ring-[#1d1e25]" />
          </div>
          <span className="hidden md:inline font-sans text-xs text-[#EFF0D1] font-semibold">{userName}</span>
        </div>
      </div>
    </header>
  )
}
