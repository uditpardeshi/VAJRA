import React, { useState } from 'react'
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Clock,
  Search,
  Cpu,
  ShieldCheck,
} from 'lucide-react'
import { useChatSessionStore } from '@/store/chatSessionStore'
import { cn } from '@/utils/cn'

export interface SessionSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function SessionSidebar({ isOpen = false, onClose, className }: SessionSidebarProps) {
  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
  } = useChatSessionStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  if (!isOpen) return null

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.machine_id && s.machine_id.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleStartEdit = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (editingTitle.trim()) {
      renameSession(id, editingTitle.trim())
    }
    setEditingId(null)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (sessions.length > 1) {
      deleteSession(id)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[86%] max-w-xs md:static md:w-72 md:z-auto bg-white/95 backdrop-blur-xl border-r border-slate-200/80 flex flex-col shrink-0 h-full select-none shadow-2xl md:shadow-none animate-in slide-in-from-left duration-200',
          className
        )}
      >
        {/* Top action bar */}
        <div className="p-3.5 border-b border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 tracking-tight">Conversations</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  createSession()
                  onClose?.()
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 active:scale-95 transition-all shadow-2xs"
                title="Create New Thread"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Section Header */}
        <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Recent Threads</span>
          <span className="font-mono text-[10px] font-normal lowercase">{sessions.length} active</span>
        </div>

        {/* Session list scroll area */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId
            const isEditing = editingId === session.id
            const fileCount = session.files?.length || 0

            return (
              <div
                key={session.id}
                onClick={() => {
                  switchSession(session.id)
                  onClose?.()
                }}
                className={cn(
                  'group relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1',
                  isActive
                    ? 'bg-sky-50/70 border-sky-200 text-sky-950 shadow-2xs ring-1 ring-sky-300/40'
                    : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 px-2 py-0.5 text-xs bg-white border border-primary rounded-lg focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(e as any, session.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(e, session.id)}
                        className="p-1 hover:text-emerald-600"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="p-1 hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'text-xs font-semibold truncate flex-1',
                          isActive ? 'text-sky-950 font-bold' : 'text-slate-700'
                        )}
                      >
                        {session.title}
                      </span>

                      {/* Action buttons on hover or active */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, session.id, session.title)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Rename Thread"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, session.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Thread"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Metadata row */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  {session.machine_id && (
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/70 rounded-full text-[10px] font-mono font-semibold">
                      {session.machine_id}
                    </span>
                  )}
                  {fileCount > 0 && (
                    <span className="flex items-center gap-0.5 text-primary font-semibold">
                      <FileText className="w-2.5 h-2.5" />
                      {fileCount} {fileCount === 1 ? 'doc' : 'docs'}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 ml-auto text-[9px] text-slate-400 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}

          {filteredSessions.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          )}
        </div>

        {/* Bottom card mirroring the reference image's status card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50/30 to-amber-50/30 border border-sky-100/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Sovereign RAG Active</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              3 OEM machines indexed. Zero telemetry outside facility.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
