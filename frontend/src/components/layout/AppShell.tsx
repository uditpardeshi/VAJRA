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
    <div className="min-h-screen bg-gradient-to-b from-[#f1f7ff]/70 via-[#f8fafc] to-[#fcfcfd] flex flex-col font-sans">
      <TopBar />
      <div className="flex flex-1 relative min-w-0">
        <SideNav />
        <main
          className={cn(
            'flex-1 w-full mx-auto min-w-0',
            isChatPage
              ? 'p-0 sm:p-2 md:p-3 lg:p-4 max-w-7xl pb-14 lg:pb-4 h-[calc(100dvh-3.5rem)] lg:h-[calc(100vh-3.5rem)] flex flex-col'
              : 'p-3 md:p-5 max-w-7xl pb-20 lg:pb-6'
          )}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
