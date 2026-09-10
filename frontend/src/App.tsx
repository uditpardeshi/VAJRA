import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/config/queryClient'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'

import { WorkerDashboardPage } from '@/pages/worker/WorkerDashboardPage'
import { InspectPage } from '@/pages/worker/InspectPage'
import { ChatPage } from '@/pages/worker/ChatPage'
import { AgentPage } from '@/pages/worker/AgentPage'
import { HistoryPage } from '@/pages/worker/HistoryPage'

import { DashboardPage } from '@/pages/reviewer/DashboardPage'
import { EscalationsPage } from '@/pages/reviewer/EscalationsPage'
import { MachinesPage } from '@/pages/reviewer/MachinesPage'
import { ReportsPage } from '@/pages/reviewer/ReportsPage'

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { RoleSelectPage } from '@/pages/auth/RoleSelectPage'

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/role-select" element={<RoleSelectPage />} />

            <Route element={<AppShell />}>
              {/* Worker Role Routes */}
              <Route path="/worker-dashboard" element={<WorkerDashboardPage />} />
              <Route path="/inspect" element={<InspectPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/history" element={<HistoryPage />} />

              {/* Reviewer Role Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/escalations" element={<EscalationsPage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Admin Role Routes */}
              <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              <Route path="*" element={<Navigate to="/worker-dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
