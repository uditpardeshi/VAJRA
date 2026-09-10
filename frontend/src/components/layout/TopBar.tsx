import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, ShieldAlert, Settings, Menu } from 'lucide-react'
import { useAuthStore, UserRole } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useMachines } from '@/hooks/api/useMachines'
import { MachineSelector } from '@/components/common/MachineSelector'

export function TopBar() {
  const navigate = useNavigate()
  const { role, setRole, userName, currentMachine, setCurrentMachine } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const { data: machines } = useMachines()

  const roles: { id: UserRole; label: string; icon: any; defaultRoute: string }[] = [
    { id: 'worker', label: 'Operator', icon: Wrench, defaultRoute: '/worker-dashboard' },
    { id: 'reviewer', label: 'QA Review', icon: ShieldAlert, defaultRoute: '/dashboard' },
    { id: 'admin', label: 'Admin', icon: Settings, defaultRoute: '/admin-dashboard' },
  ]

  const handleRoleSelect = (selectedRole: UserRole, route: string) => {
    setRole(selectedRole)
    navigate(route)
  }

  const activeMachineId = currentMachine?.machine_id || (machines && machines[0]?.machine_id) || 'HX-204'

  return (
    <header className="h-13 bg-[#1e1f29] border-b border-[#2e303d] px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Brand Identity & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#262730] rounded-lg lg:hidden transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/worker-dashboard')}>
          <div className="w-7 h-7 rounded-lg bg-[#77BA99] text-[#1a1b23] flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
            V
          </div>
          <span className="font-bold text-sm tracking-tight text-[#EFF0D1]">
            VAJRA
          </span>
        </div>
      </div>

      {/* Center: Modern Sleek Segmented Role Switcher */}
      <div className="flex items-center bg-[#15161c] p-1 rounded-lg border border-[#2e303d] shadow-2xs">
        {roles.map((r) => {
          const Icon = r.icon
          const active = role === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleSelect(r.id, r.defaultRoute)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                active
                  ? 'bg-[#262730] text-[#EFF0D1] font-semibold shadow-xs border border-[#363845]'
                  : 'text-[#D7C0D0]/70 hover:text-[#EFF0D1]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#77BA99]' : 'text-[#D7C0D0]/60'}`} />
              <span className="hidden sm:inline">{r.label}</span>
            </button>
          )
        })}
      </div>

      {/* Right: Machine Selector & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Machine Context Dropdown */}
        <div className="hidden md:block">
          <MachineSelector
            machines={machines || []}
            value={activeMachineId}
            onChange={(id) => {
              const found = machines?.find((m) => m.machine_id === id)
              if (found) setCurrentMachine(found)
            }}
            className="w-44 text-xs"
          />
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#2e303d]">
          <div className="w-7 h-7 rounded-full bg-[#262730] border border-[#363845] flex items-center justify-center text-[#EFF0D1] font-semibold text-xs shadow-2xs">
            {userName?.charAt(0)?.toUpperCase() || 'O'}
          </div>
          <span className="hidden lg:inline text-xs font-medium text-[#EFF0D1]">
            {userName}
          </span>
        </div>
      </div>
    </header>
  )
}
