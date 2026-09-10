import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSession, ChatMessage, SessionFileItem } from '@/types/api'

interface ChatSessionState {
  sessions: ChatSession[]
  activeSessionId: string
  createSession: (title?: string, machine_id?: string) => string
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void
  updateSessionMachine: (sessionId: string, machine_id: string) => void
  addFilesToSession: (sessionId: string, newFiles: SessionFileItem[]) => void
  removeFileFromSession: (sessionId: string, filename: string) => void
  addMessageToSession: (sessionId: string, message: ChatMessage) => void
  clearSessionMessages: (sessionId: string) => void
}

const initialDefaultId = 'default-session'
const initialDefaultSession: ChatSession = {
  id: initialDefaultId,
  title: 'General Technical Inquiry',
  machine_id: 'HX-204',
  files: [],
  messages: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const useChatSessionStore = create<ChatSessionState>()(
  persist(
    (set, get) => ({
      sessions: [initialDefaultSession],
      activeSessionId: initialDefaultId,

      createSession: (title, machine_id) => {
        const id = `session-${Date.now()}`
        const sessionTitle = title || `Thread #${get().sessions.length + 1}`
        const newSession: ChatSession = {
          id,
          title: sessionTitle,
          machine_id: machine_id || 'HX-204',
          files: [],
          messages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }))
        return id
      },

      switchSession: (id) => {
        const exists = get().sessions.some((s) => s.id === id)
        if (exists) {
          set({ activeSessionId: id })
        }
      },

      deleteSession: (id) => {
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id)
          if (remaining.length === 0) {
            const fallback: ChatSession = {
              id: `session-${Date.now()}`,
              title: 'Primary Maintenance Thread',
              machine_id: 'HX-204',
              files: [],
              messages: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            return {
              sessions: [fallback],
              activeSessionId: fallback.id,
            }
          }

          const nextActive = state.activeSessionId === id ? remaining[0].id : state.activeSessionId
          return {
            sessions: remaining,
            activeSessionId: nextActive,
          }
        })
      },

      renameSession: (id, title) => {
        if (!title.trim()) return
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title: title.trim(), updated_at: new Date().toISOString() } : s
          ),
        }))
      },

      updateSessionMachine: (sessionId, machine_id) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, machine_id, updated_at: new Date().toISOString() } : s
          ),
        }))
      },

      addFilesToSession: (sessionId, newFiles) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s
            const existingNames = new Set(s.files.map((f) => f.filename))
            const filteredNew = newFiles.filter((f) => !existingNames.has(f.filename))
            return {
              ...s,
              files: [...s.files, ...filteredNew],
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      removeFileFromSession: (sessionId, filename) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s
            return {
              ...s,
              files: s.files.filter((f) => f.filename !== filename),
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      addMessageToSession: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s
            return {
              ...s,
              // Filter out any legacy dummy welcome messages automatically
              messages: [...s.messages.filter((m) => m.id !== 'welcome'), message],
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      clearSessionMessages: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s
            return {
              ...s,
              messages: [],
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },
    }),
    {
      name: 'vajra_chat_sessions_v2',
    }
  )
)
