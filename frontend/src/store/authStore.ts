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
  modelUrl: string;
  apiKey: string;
  machines: Machine[];
  currentMachine?: Machine;
  setRole: (role: UserRole) => void;
  setUserId: (id: number) => void;
  setUserName: (name: string) => void;
  setApiBase: (url: string) => void;
  setWsBase: (url: string) => void;
  setModelUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setMachines: (machines: Machine[]) => void;
  setCurrentMachine: (machine: Machine | undefined) => void;
  reset: () => void;
}

const DEFAULT_API = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
const DEFAULT_WS = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000/api/v1'
const DEFAULT_MODEL_URL = import.meta.env.VITE_MODEL_URL || 'https://elmiest-julieta-unmelodramatically.ngrok-free.dev'
const DEFAULT_API_KEY = import.meta.env.VITE_API_KEY || 'VAJRA-2026-SECRET'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: 'worker',
      userId: 1,
      userName: 'Worker',
      apiBase: DEFAULT_API,
      wsBase: DEFAULT_WS,
      modelUrl: DEFAULT_MODEL_URL,
      apiKey: DEFAULT_API_KEY,
      machines: [],
      currentMachine: undefined,
      setRole: (role) => set({ role }),
      setUserId: (userId) => set({ userId }),
      setUserName: (userName) => set({ userName }),
      setApiBase: (apiBase) => set({ apiBase }),
      setWsBase: (wsBase) => set({ wsBase }),
      setModelUrl: (modelUrl) => set({ modelUrl }),
      setApiKey: (apiKey) => set({ apiKey }),
      setMachines: (machines) => set({ machines }),
      setCurrentMachine: (currentMachine) => set({ currentMachine }),
      reset: () => set({ role: 'worker', userId: 1, userName: 'Worker', machines: [], currentMachine: undefined }),
    }),
    {
      name: 'sovereign-auth',
      partialize: (s) => ({
        role: s.role,
        userId: s.userId,
        userName: s.userName,
        apiBase: s.apiBase,
        wsBase: s.wsBase,
        modelUrl: s.modelUrl,
        apiKey: s.apiKey,
      })
    }
  )
)
