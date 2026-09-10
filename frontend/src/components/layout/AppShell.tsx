import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { BottomNav } from './BottomNav'
import { cn } from '@/utils/cn'

export function AppShell() {
  const location = useLocation()
  const isChatPage = location.pathname === '/chat'

  return (
    <div className="min-h-screen bg-[#1a1b23] text-[#EFF0D1] flex flex-col font-sans selection:bg-[#77BA99] selection:text-[#1a1b23]">
      <TopBar />
      <div className="flex flex-1 relative min-w-0">
        <SideNav />
        <main
          className={cn(
            'flex-1 w-full mx-auto min-w-0',
            isChatPage
              ? 'p-0 sm:p-1.5 md:p-2 max-w-7xl pb-12 lg:pb-2 h-[calc(100dvh-2.75rem)] sm:h-[calc(100dvh-3rem)] flex flex-col'
              : 'p-2 sm:p-3 md:p-4 max-w-7xl pb-16 lg:pb-4'
          )}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
