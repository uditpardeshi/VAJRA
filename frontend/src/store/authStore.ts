import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Machine } from '@/types/api'

export type UserRole = 'worker' | 'reviewer' | 'admin'

interface AuthState {
  role: UserRole;
  userId: number;
  userName: string;
  apiBase: string;
  wsBase: string;
  machines: Machine[];
  currentMachine?: Machine;
  setRole: (role: UserRole) => void;
  setUserId: (id: number) => void;
  setUserName: (name: string) => void;
  setApiBase: (url: string) => void;
  setMachines: (machines: Machine[]) => void;
  setCurrentMachine: (machine: Machine | undefined) => void;
  reset: () => void;
}

const DEFAULT_API = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
const DEFAULT_WS = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000/api/v1'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: 'worker',
      userId: 1,
      userName: 'Worker',
      apiBase: DEFAULT_API,
      wsBase: DEFAULT_WS,
      machines: [],
      currentMachine: undefined,
      setRole: (role) => set({ role }),
      setUserId: (userId) => set({ userId }),
      setUserName: (userName) => set({ userName }),
      setApiBase: (apiBase) => set({ apiBase }),
      setMachines: (machines) => set({ machines }),
      setCurrentMachine: (currentMachine) => set({ currentMachine }),
      reset: () => set({ role: 'worker', userId: 1, userName: 'Worker', machines: [], currentMachine: undefined }),
    }),
    {
      name: 'sovereign-auth',
      partialize: (s) => ({ role: s.role, userId: s.userId, userName: s.userName, apiBase: s.apiBase, wsBase: s.wsBase })
    }
  )
)
